"""Model loading and preprocessing utilities."""

import logging
import io
from typing import Dict, Optional, Tuple

import torch
import torchvision
import torchvision.transforms as transforms
from PIL import Image

from app.models.registry import get_model_config

logger = logging.getLogger("app.models.loaders")

# In-memory cache for loaded models
_model_cache: Dict[str, torch.nn.Module] = {}


def load_model(model_id: str) -> torch.nn.Module:
    """
    Load a PyTorch model from torchvision with pretrained weights.
    
    Models are cached in-memory and moved to CPU in eval mode.
    
    Args:
        model_id: Model identifier (resnet18, mobilenet_v2, efficientnet_b0)
        
    Returns:
        Loaded PyTorch model in eval mode on CPU
        
    Raises:
        ValueError: If model_id is not supported
    """
    # Check cache first
    if model_id in _model_cache:
        logger.debug(f"Using cached model: {model_id}")
        return _model_cache[model_id]
    
    # Verify model exists in registry
    model_config = get_model_config(model_id)
    if model_config is None:
        raise ValueError(f"Model '{model_id}' not found in registry")
    
    logger.info(f"Loading model: {model_id}")
    
    # Map model_id to torchvision model loading function
    model_mapping = {
        "resnet18": lambda: torchvision.models.resnet18(weights="DEFAULT"),
        "mobilenet_v2": lambda: torchvision.models.mobilenet_v2(weights="DEFAULT"),
        "efficientnet_b0": lambda: torchvision.models.efficientnet_b0(weights="DEFAULT"),
    }
    
    if model_id not in model_mapping:
        raise ValueError(f"Unsupported model_id: {model_id}. Supported: {list(model_mapping.keys())}")
    
    # Load model
    model = model_mapping[model_id]()
    
    # Move to CPU and set to eval mode
    model = model.cpu()
    model.eval()
    
    # Cache the model
    _model_cache[model_id] = model
    logger.info(f"Loaded and cached model: {model_id}")
    
    return model


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

