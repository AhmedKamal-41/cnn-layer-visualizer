"""Forward hooks for capturing model activations."""

import logging
from typing import Dict, List, Tuple

import torch
import torch.nn as nn

logger = logging.getLogger("app.inspect.hooks")


def get_layer_by_path(model: nn.Module, layer_path: str) -> nn.Module:
    """
    Get a layer/module from model using dot-separated path notation.
    
    Supports both attribute access (e.g., "layer1") and indexing (e.g., "features.3").
    
    Args:
        model: PyTorch model
        layer_path: Dot-separated path (e.g., "conv1", "layer1", "features.3")
        
    Returns:
        The layer/module at the specified path
        
    Raises:
        ValueError: If path not found or invalid
    """
    current = model
    parts = layer_path.split(".")
    
    for part in parts:
        try:
            # Try attribute access first
            if hasattr(current, part):
                current = getattr(current, part)
            # Try indexing (for Sequential, ModuleList, etc.)
            elif hasattr(current, "__getitem__"):
                try:
                    index = int(part)
                    current = current[index]
                except (ValueError, TypeError, IndexError):
                    raise ValueError(f"Cannot access '{part}' as index in path '{layer_path}'")
            else:
                raise ValueError(f"Cannot access '{part}' in path '{layer_path}'")
        except (AttributeError, KeyError, IndexError) as e:
            raise ValueError(f"Path '{layer_path}' not found: {e}")
    
    return current


def register_forward_hooks(
    model: nn.Module,
    layer_paths: List[str],
) -> Tuple[Dict[str, torch.Tensor], List]:
    """
    Register forward hooks on specified layers to capture activations.
    
    Args:
        model: PyTorch model
        layer_paths: List of layer paths to hook (e.g., ["conv1", "layer1", "layer2"])
        
    Returns:
        Tuple of (activations_dict, handles_list):
        - activations_dict: Dictionary to store activations {layer_name: tensor}
        - handles_list: List of hook handles for cleanup
    """
    activations: Dict[str, torch.Tensor] = {}
    handles: List = []
    
    def create_hook(layer_name: str):
        """Create a hook function for a specific layer."""
        def hook_fn(module: nn.Module, input: Tuple[torch.Tensor, ...], output: torch.Tensor) -> None:
            """Hook callback that stores the activation tensor."""
            # Clone tensor to avoid reference issues
            # Handle both single tensor outputs and tuple outputs
            if isinstance(output, torch.Tensor):
                activations[layer_name] = output.detach().clone()
            else:
                # If output is a tuple, take the first tensor
                activations[layer_name] = output[0].detach().clone() if len(output) > 0 else None
            
            logger.debug(f"Captured activation from '{layer_name}': shape={activations[layer_name].shape}")
        
        return hook_fn
    
    # Register hooks for each layer path
    for layer_path in layer_paths:
        try:
            layer = get_layer_by_path(model, layer_path)
            hook_fn = create_hook(layer_path)
            handle = layer.register_forward_hook(hook_fn)
            handles.append(handle)
            logger.debug(f"Registered hook on layer: {layer_path}")
        except ValueError as e:
            logger.warning(f"Failed to register hook on '{layer_path}': {e}")
            # Continue with other layers
    
    return activations, handles


def remove_hooks(handles: List) -> None:
    """
    Remove all forward hooks from the model.
    
    Args:
        handles: List of hook handles returned by register_forward_hook()
    """
    for handle in handles:
        try:
            handle.remove()
        except Exception as e:
            logger.warning(f"Error removing hook handle: {e}")
            # Continue removing other hooks
    
    logger.debug(f"Removed {len(handles)} hook handles")


def capture_activations(
    model: nn.Module,
    input_tensor: torch.Tensor,
    layer_paths: List[str],
) -> Dict[str, torch.Tensor]:
    """
    Capture activations from specified layers during forward pass.
    
    This function registers hooks, runs a forward pass, and cleans up hooks.
    
    Args:
        model: PyTorch model (should be in eval mode)
        input_tensor: Input tensor with shape [1, C, H, W]
        layer_paths: List of layer paths to capture (e.g., ["conv1", "layer1", "layer2"])
        
    Returns:
        Dictionary mapping layer names to activation tensors {layer_name: tensor}
        Each tensor has shape [1, C, H, W] (or [1, ...] for other shapes)
    """
    activations, handles = register_forward_hooks(model, layer_paths)
    
    try:
        # Run forward pass
        with torch.no_grad():
            _ = model(input_tensor)
        
        logger.info(f"Captured activations from {len(activations)} layers")
        
    finally:
        # Always remove hooks, even if forward pass fails
        remove_hooks(handles)
    
    return activations

