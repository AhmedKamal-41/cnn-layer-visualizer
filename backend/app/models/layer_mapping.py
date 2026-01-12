"""Layer mapping utilities for model-specific default CAM layers."""

import logging
from typing import List

from app.models.registry import get_model_config

logger = logging.getLogger("app.models.layer_mapping")


def get_default_cam_layers(model_id: str) -> List[str]:
    """
    Get model-specific default CAM layers from the registry.
    
    Reads from model_registry.yaml and returns the layers_to_hook list
    (or a subset) as defaults for Grad-CAM computation.
    
    Args:
        model_id: Model identifier (e.g., "resnet18", "mobilenet_v2")
        
    Returns:
        List of layer paths to use for Grad-CAM (e.g., ["conv1", "layer1", ...] or ["features.0", "features.2", ...])
        Returns empty list if model config not found or layers_to_hook missing
    """
    model_config = get_model_config(model_id)
    
    if model_config is None:
        logger.warning(f"Model config not found for {model_id}, returning empty CAM layers list")
        return []
    
    layers_to_hook = model_config.get("layers_to_hook", [])
    
    if not layers_to_hook:
        logger.warning(f"No layers_to_hook found in model config for {model_id}, returning empty CAM layers list")
        return []
    
    # Return all layers from layers_to_hook as defaults
    # This ensures we use model-specific paths (e.g., features.0 for MobileNetV2, conv1 for ResNet)
    logger.debug(f"Using default CAM layers for {model_id}: {layers_to_hook}")
    return layers_to_hook.copy()


def get_cam_target_path(layer_name: str, model_id: str) -> str:
    """
    Get the CAM target path for a given layer name.
    
    For models where layer names in the registry already use actual module paths
    (e.g., EfficientNet: "features.0", MobileNetV2: "features.0"), this returns
    the layer_name as-is. For models with generic names (ResNet: "conv1", "layer1"),
    it also returns the layer_name as-is since those are valid module paths.
    
    This function exists for consistency and potential future mapping needs.
    
    Args:
        layer_name: Layer name from registry (e.g., "features.0", "conv1", "layer1")
        model_id: Model identifier
        
    Returns:
        PyTorch module path to use for Grad-CAM computation (same as layer_name for now)
    """
    # For now, layer names in registry already use actual module paths,
    # so we can return layer_name directly
    # This function allows for future mapping if needed
    return layer_name

