"""Model loading and preprocessing utilities."""

import logging
import io
import os
from collections import OrderedDict
from typing import Optional, Tuple

import torch
import torchvision
import torchvision.transforms as transforms
from PIL import Image

from app.core.config import settings
from app.models.registry import get_model_config

logger = logging.getLogger("app.models.loaders")

# In-memory LRU cache for loaded models (OrderedDict for LRU behavior)
_model_cache: OrderedDict[str, torch.nn.Module] = OrderedDict()


def _get_cache_max() -> int:
    """Get MODEL_CACHE_MAX from settings at runtime (lazy getter)."""
    from app.core.config import settings
    return settings.MODEL_CACHE_MAX


def remove_from_cache(model_id: str) -> None:
    """Remove model from cache (used during preloading with download_only strategy)."""
    global _model_cache
    if model_id in _model_cache:
        del _model_cache[model_id]


def _get_model_mapping():
    """Get model_id to torchvision model loading function mapping."""
    return {
        "resnet18": lambda: torchvision.models.resnet18(weights="DEFAULT"),
        "resnet50": lambda: torchvision.models.resnet50(weights="DEFAULT"),
        "mobilenet_v2": lambda: torchvision.models.mobilenet_v2(weights="DEFAULT"),
        "mobilenet_v3_small": lambda: torchvision.models.mobilenet_v3_small(weights="DEFAULT"),
        "mobilenet_v3_large": lambda: torchvision.models.mobilenet_v3_large(weights="DEFAULT"),
        "efficientnet_b0": lambda: torchvision.models.efficientnet_b0(weights="DEFAULT"),
        "efficientnet_b2": lambda: torchvision.models.efficientnet_b2(weights="DEFAULT"),
        "efficientnet_b3": lambda: torchvision.models.efficientnet_b3(weights="DEFAULT"),
        "densenet121": lambda: torchvision.models.densenet121(weights="DEFAULT"),
        "convnext_tiny": lambda: torchvision.models.convnext_tiny(weights="DEFAULT"),
        "shufflenet_v2_x1_0": lambda: torchvision.models.shufflenet_v2_x1_0(weights="DEFAULT"),
    }


def load_model(model_id: str) -> torch.nn.Module:
    """
    Load a PyTorch model from torchvision with pretrained weights.
    
    Models are cached in-memory with LRU eviction and moved to CPU in eval mode.
    
    Args:
        model_id: Model identifier (resnet18, mobilenet_v2, efficientnet_b0)
        
    Returns:
        Loaded PyTorch model in eval mode on CPU
        
    Raises:
        ValueError: If model_id is not supported
    """
    import time
    start_time = time.time()
    
    # Check cache first (LRU: move to end on access)
    if model_id in _model_cache:
        _model_cache.move_to_end(model_id)
        load_time = (time.time() - start_time) * 1000
        logger.info(f"Model cache hit: {model_id} ({load_time:.1f}ms)")
        return _model_cache[model_id]
    
    # Verify model exists in registry
    model_config = get_model_config(model_id)
    if model_config is None:
        raise ValueError(f"Model '{model_id}' not found in registry")
    
    logger.info(f"Loading model: {model_id} (cache miss)")
    
    model_mapping = _get_model_mapping()
    
    if model_id not in model_mapping:
        raise ValueError(f"Unsupported model_id: {model_id}. Supported: {list(model_mapping.keys())}")
    
    # Load model (this will download weights if not cached)
    model = model_mapping[model_id]()
    
    # Move to CPU and set to eval mode
    model = model.cpu()
    model.eval()
    
    # LRU cache: add to end, evict oldest if over limit
    _model_cache[model_id] = model
    _model_cache.move_to_end(model_id)
    
    # Evict oldest if cache is full
    cache_max = _get_cache_max()
    if len(_model_cache) > cache_max:
        oldest_key = next(iter(_model_cache))
        del _model_cache[oldest_key]
        logger.debug(f"Evicted model from cache: {oldest_key} (cache size: {len(_model_cache)}/{cache_max})")
    
    load_time = (time.time() - start_time) * 1000
    logger.info(f"Loaded and cached model: {model_id} ({load_time:.1f}ms)")
    
    return model


def preload_model(model_id: str) -> None:
    """
    Preload a model by downloading its weights (if not already cached).
    
    This function downloads model weights to the torch cache directory (TORCH_HOME),
    but does not necessarily keep the model in memory if the cache is full.
    The model will be available for fast loading later via load_model().
    
    Args:
        model_id: Model identifier (resnet18, mobilenet_v2, efficientnet_b0)
        
    Raises:
        ValueError: If model_id is not supported
    """
    # Verify model exists in registry
    model_config = get_model_config(model_id)
    if model_config is None:
        logger.warning(f"Model '{model_id}' not found in registry, skipping preload")
        return
    
    model_mapping = _get_model_mapping()
    
    if model_id not in model_mapping:
        logger.warning(f"Unsupported model_id for preload: {model_id}")
        return
    
    # If model is already in cache, skip
    if model_id in _model_cache:
        logger.debug(f"Model {model_id} already in cache, skipping preload")
        return
    
    try:
        logger.info(f"Preloading model: {model_id}")
        # Load model (this will download weights if not cached)
        # torchvision handles caching to TORCH_HOME automatically
        model = model_mapping[model_id]()
        model = model.cpu()
        model.eval()
        
        # Add to cache if there's room, otherwise just discard (weights are cached to disk)
        cache_max = _get_cache_max()
        if len(_model_cache) < cache_max:
            _model_cache[model_id] = model
            _model_cache.move_to_end(model_id)
            logger.info(f"Preloaded and cached model: {model_id}")
        else:
            # Weights are downloaded, but don't keep in memory
            del model
            logger.info(f"Preloaded model weights for {model_id} (not kept in memory, cache full)")
    except Exception as e:
        logger.error(f"Failed to preload model {model_id}: {e}")


def preprocess_image(image_bytes: bytes, model_id: str) -> torch.Tensor:
    """
    Preprocess image bytes for model input.
    
    Steps:
    1. Convert bytes to PIL Image
    2. Resize smaller edge to input_size[0] (maintains aspect ratio)
    3. Center crop to input_size [H, W]
    4. Convert to tensor and normalize
    5. Add batch dimension
    
    Args:
        image_bytes: Image file bytes
        model_id: Model identifier to get preprocessing config from registry
        
    Returns:
        Preprocessed tensor with shape [1, 3, H, W] ready for forward pass
        
    Raises:
        ValueError: If model_id not found in registry
        IOError: If image_bytes cannot be decoded
    """
    # Get model config from registry
    model_config = get_model_config(model_id)
    if model_config is None:
        raise ValueError(f"Model '{model_id}' not found in registry")
    
    input_size = model_config["input_size"]
    normalization = model_config["normalization"]
    mean = normalization["mean"]
    std = normalization["std"]
    
    # Convert bytes to PIL Image
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Convert to RGB if necessary (handle PNG with alpha, etc.)
        if image.mode != "RGB":
            image = image.convert("RGB")
    except Exception as e:
        raise IOError(f"Failed to decode image: {e}")
    
    # Create transforms
    # Resize: resize the smaller edge to input_size[0], maintaining aspect ratio
    # CenterCrop: crop to exact input_size [H, W]
    transform = transforms.Compose([
        transforms.Resize(input_size[0]),  # Resize smaller edge to input_size[0] (maintains aspect ratio)
        transforms.CenterCrop(input_size),  # Center crop to [H, W]
        transforms.ToTensor(),  # Convert to [0, 1] range and CHW format
        transforms.Normalize(mean=mean, std=std),  # Normalize
    ])
    
    # Apply transforms
    tensor = transform(image)
    
    # Add batch dimension: [C, H, W] -> [1, C, H, W]
    tensor = tensor.unsqueeze(0)
    
    return tensor

