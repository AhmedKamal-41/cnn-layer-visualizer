"""Model registry for loading and accessing model configurations."""

import yaml
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any

from app.core.config import settings

logger = logging.getLogger("app.models.registry")

# Cache for loaded registry data
_registry_cache: Optional[Dict[str, Any]] = None


def _load_registry() -> Dict[str, Any]:
    """
    Load model registry from YAML file.
    
    Returns:
        Dictionary containing model registry data
        
    Raises:
        FileNotFoundError: If registry file doesn't exist
        yaml.YAMLError: If YAML parsing fails
    """
    global _registry_cache
    
    if _registry_cache is not None:
        return _registry_cache
    
    registry_path = settings.MODEL_REGISTRY_PATH
    
    if not registry_path.exists():
        raise FileNotFoundError(f"Model registry file not found: {registry_path}")
    
    try:
        with open(registry_path, "r") as f:
            data = yaml.safe_load(f)
        
        if not data or "models" not in data:
            raise ValueError("Invalid registry format: missing 'models' key")
        
        _registry_cache = data
        logger.info(f"Loaded model registry from {registry_path}")
        return _registry_cache
    
    except yaml.YAMLError as e:
        logger.error(f"Error parsing YAML registry file: {e}")
        raise
    except Exception as e:
        logger.error(f"Error loading registry file: {e}")
        raise


def list_models() -> List[Dict[str, Any]]:
    """
    Get list of all available models.
    
    Returns:
        List of model configurations (each containing id, display_name, input_size)
    """
    try:
        registry = _load_registry()
        models = registry.get("models", [])
        
        # Return simplified model info for listing
        return [
            {
                "id": model.get("id"),
                "display_name": model.get("display_name"),
                "input_size": model.get("input_size"),
            }
            for model in models
        ]
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        return []


def get_model_config(model_id: str) -> Optional[Dict[str, Any]]:
    """
    Get full configuration for a specific model.
    
    Args:
        model_id: Model identifier
        
    Returns:
        Full model configuration dictionary, or None if not found
    """
    try:
        registry = _load_registry()
        models = registry.get("models", [])
        
        for model in models:
            if model.get("id") == model_id:
                return model.copy()
        
        logger.warning(f"Model not found in registry: {model_id}")
        return None
    
    except Exception as e:
        logger.error(f"Error getting model config for {model_id}: {e}")
        return None


def clear_cache() -> None:
    """Clear the registry cache (useful for testing or reloading)."""
    global _registry_cache
    _registry_cache = None
    logger.debug("Registry cache cleared")

