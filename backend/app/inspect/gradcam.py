"""Grad-CAM visualization utilities."""

import json
import logging
import time
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from PIL import Image

from app.inspect.hooks import get_layer_by_path

logger = logging.getLogger("app.inspect.gradcam")

# Module-level cache and warning flag for ImageNet class names
_IMAGENET_LABELS: dict[int, str] | None = None
_IMAGENET_WARNED: bool = False


def get_imagenet_labels() -> dict[int, str]:
    """
    Load ImageNet class names from JSON file and cache them.
    
    Tries importlib.resources first, then falls back to filesystem paths.
    Warns only once if the file cannot be found.
    
    Returns:
        Dictionary mapping class_id (int) to class_name (str)
    """
    global _IMAGENET_LABELS, _IMAGENET_WARNED
    
    # Return cached result if available
    if _IMAGENET_LABELS is not None:
        return _IMAGENET_LABELS
    
    # Try importlib.resources first (preferred method)
    try:
        from importlib import resources
        data = resources.files("app.assets").joinpath("imagenet_class_index.json").read_text()
        class_index = json.loads(data)
        _IMAGENET_LABELS = {
            int(class_id): class_data[1]  # class_data[1] is the class name
            for class_id, class_data in class_index.items()
        }
        logger.info(f"Loaded {len(_IMAGENET_LABELS)} ImageNet class names via importlib.resources")
        return _IMAGENET_LABELS
    except Exception as e:
        logger.debug(f"importlib.resources failed: {e}")
    
    # Fallback to filesystem paths
    candidates = [
        Path(__file__).resolve().parents[1] / "assets" / "imagenet_class_index.json",
        Path.cwd() / "app" / "assets" / "imagenet_class_index.json",
        Path.cwd() / "backend" / "app" / "assets" / "imagenet_class_index.json",
    ]
    
    for path in candidates:
        if path.exists() and path.is_file():
            try:
                with open(path, "r") as f:
                    class_index = json.load(f)
                _IMAGENET_LABELS = {
                    int(class_id): class_data[1]  # class_data[1] is the class name
                    for class_id, class_data in class_index.items()
                }
                logger.info(f"Loaded {len(_IMAGENET_LABELS)} ImageNet class names from {path}")
                return _IMAGENET_LABELS
            except Exception as e:
                logger.debug(f"Failed to load from {path}: {e}")
                continue
    
    # File not found - warn only once
    if not _IMAGENET_WARNED:
        logger.warning("Failed to find ImageNet class names file. Using class_<id> format.")
        _IMAGENET_WARNED = True
    
    _IMAGENET_LABELS = {}
    return _IMAGENET_LABELS


def generate_gradcam(
    model: nn.Module,
    input_tensor: torch.Tensor,
    original_image: Image.Image,
    target_layer: str,
    job_id: str,
    layer_name: str,
    storage_dir: Path,
    alpha: float = 0.45,
) -> Dict[str, str]:
    """
    Generate Grad-CAM visualization for a model and input.
    
    Args:
        model: PyTorch model (should be in eval mode)
        input_tensor: Preprocessed input tensor [1, C, H, W] (will enable requires_grad)
        original_image: Original RGB PIL Image (before preprocessing)
        target_layer: Layer path for Grad-CAM computation (e.g., "layer4")
        job_id: Job identifier for directory structure
        layer_name: Layer name for subdirectory
        storage_dir: Base storage directory (STORAGE_DIR from config)
        alpha: Overlay transparency (0.0 to 1.0, default 0.45)
        
    Returns:
        Dictionary with file paths:
        - heatmap_path: Relative path to heatmap.png
        - overlay_path: Relative path to overlay.png
    """
    # Ensure input tensor requires gradients
    input_tensor = input_tensor.clone().requires_grad_(True)
    
    # Get target layer
    target_module = get_layer_by_path(model, target_layer)
    
    # Storage for activations and gradients
    activations = None
    gradients = None
    
    def forward_hook(module, input, output):
        """Hook to store activations."""
        nonlocal activations
        activations = output.detach()
    
    def backward_hook(module, grad_input, grad_output):
        """Hook to store gradients."""
        nonlocal gradients
        if grad_output is not None and len(grad_output) > 0:
            gradients = grad_output[0].detach()
    
    # Register hooks
    forward_handle = target_module.register_forward_hook(forward_hook)
    backward_handle = target_module.register_full_backward_hook(backward_hook)
    
    try:
        # Forward pass
        model.eval()
        output = model(input_tensor)
        
        # Get top-1 predicted class
        probs = F.softmax(output, dim=1)
        top_class = torch.argmax(probs, dim=1).item()
        
        # Backward pass for top-1 class
        model.zero_grad()
        output[0, top_class].backward()
        
        # Compute Grad-CAM
        if gradients is None or activations is None:
            raise ValueError(f"Failed to capture gradients or activations from layer '{target_layer}'")
        
        # Grad-CAM computation
        # gradients shape: [1, C, H, W]
        # activations shape: [1, C, H, W]
        
        # Global average pooling of gradients (weights)
        # gradients shape: [1, C, H, W] or [C, H, W]
        if gradients.dim() == 4:
            # Shape: [1, C, 1, 1]
            weights = torch.mean(gradients, dim=(2, 3), keepdim=True)
        else:
            # Shape: [C, 1, 1]
            weights = torch.mean(gradients, dim=(1, 2), keepdim=True).unsqueeze(0)
        
        # Ensure activations have batch dimension
        if activations.dim() == 3:
            activations = activations.unsqueeze(0)
        
        # Weighted sum of activations
        # Shape: [1, C, H, W] -> [1, H, W]
        cam = torch.sum(weights * activations, dim=1, keepdim=False)
        cam = cam.squeeze(0)  # [H, W]
        
        # Apply ReLU to get positive activations
        cam = F.relu(cam)
        
        # Normalize to 0..1
        cam_min = cam.min()
        cam_max = cam.max()
        if cam_max - cam_min > 1e-6:
            cam_normalized = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam_normalized = torch.zeros_like(cam)
        
        # Convert to numpy
        cam_np = cam_normalized.detach().cpu().numpy()
        
        # Resize to match original image size
        original_size = original_image.size  # (width, height)
        cam_resized = np.array(Image.fromarray(cam_np).resize(original_size, Image.BILINEAR))
        
        # Generate heatmap (grayscale)
        heatmap_gray = (cam_resized * 255).astype(np.uint8)
        heatmap_image = Image.fromarray(heatmap_gray, mode='L')
        
        # Generate colored heatmap for overlay (using simple colormap)
        # Convert grayscale to RGB using a simple colormap (red for high, blue for low)
        heatmap_rgb = apply_colormap(cam_resized)
        
        # Overlay on original image
        original_array = np.array(original_image).astype(np.float32) / 255.0
        heatmap_array = heatmap_rgb.astype(np.float32) / 255.0
        
        # Alpha blending
        overlay_array = (1 - alpha) * original_array + alpha * heatmap_array
        overlay_array = np.clip(overlay_array * 255, 0, 255).astype(np.uint8)
        overlay_image = Image.fromarray(overlay_array, mode='RGB')
        
        # Create storage directory
        layer_dir = storage_dir / job_id / layer_name
        layer_dir.mkdir(parents=True, exist_ok=True)
        
        # Save files
        heatmap_path = layer_dir / "heatmap.png"
        overlay_path = layer_dir / "overlay.png"
        
        heatmap_image.save(heatmap_path, format='PNG')
        overlay_image.save(overlay_path, format='PNG')
        
        # Compute relative paths
        heatmap_relative = heatmap_path.relative_to(storage_dir)
        overlay_relative = overlay_path.relative_to(storage_dir)
        
        heatmap_str = str(heatmap_relative).replace('\\', '/')
        overlay_str = str(overlay_relative).replace('\\', '/')
        
        logger.info(f"Generated Grad-CAM for layer '{target_layer}' (top class: {top_class})")
        
        return {
            "heatmap_path": heatmap_str,
            "overlay_path": overlay_str,
        }
        
    finally:
        # Clean up hooks and gradients
        forward_handle.remove()
        backward_handle.remove()
        model.zero_grad()
        
        # Detach and clear computation graph
        if input_tensor.grad is not None:
            input_tensor.grad = None


def _compute_cam_for_class(
    model: nn.Module,
    input_tensor: torch.Tensor,
    target_layer: str,
    class_id: int,
) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Compute Grad-CAM for a specific class.
    
    Args:
        model: PyTorch model
        input_tensor: Input tensor [1, C, H, W] with requires_grad=True
        target_layer: Layer path for Grad-CAM computation
        class_id: Class ID to compute CAM for
        
    Returns:
        Tuple of (activations, gradients) tensors
    """
    # Get target layer
    target_module = get_layer_by_path(model, target_layer)
    
    # Storage for activations and gradients
    activations = None
    gradients = None
    
    def forward_hook(module, input, output):
        nonlocal activations
        activations = output.detach()
    
    def backward_hook(module, grad_input, grad_output):
        nonlocal gradients
        if grad_output is not None and len(grad_output) > 0:
            gradients = grad_output[0].detach()
    
    # Register hooks
    forward_handle = target_module.register_forward_hook(forward_hook)
    backward_handle = target_module.register_full_backward_hook(backward_hook)
    
    try:
        # Forward pass
        output = model(input_tensor)
        
        # Backward pass for specific class
        model.zero_grad()
        output[0, class_id].backward()
        
        if gradients is None or activations is None:
            raise ValueError(f"Failed to capture gradients or activations from layer '{target_layer}'")
        
        return activations, gradients
    finally:
        forward_handle.remove()
        backward_handle.remove()
        model.zero_grad()


def _compute_cam_from_activations_gradients(
    activations: torch.Tensor,
    gradients: torch.Tensor,
) -> torch.Tensor:
    """
    Compute CAM from activations and gradients.
    
    Args:
        activations: Activation tensor [1, C, H, W] or [C, H, W]
        gradients: Gradient tensor [1, C, H, W] or [C, H, W]
        
    Returns:
        Normalized CAM tensor [H, W] with values in [0, 1]
    """
    # Global average pooling of gradients (weights)
    if gradients.dim() == 4:
        weights = torch.mean(gradients, dim=(2, 3), keepdim=True)
    else:
        weights = torch.mean(gradients, dim=(1, 2), keepdim=True).unsqueeze(0)
    
    # Ensure activations have batch dimension
    if activations.dim() == 3:
        activations = activations.unsqueeze(0)
    
    # Weighted sum of activations
    cam = torch.sum(weights * activations, dim=1, keepdim=False)
    cam = cam.squeeze(0)  # [H, W]
    
    # Apply ReLU to get positive activations
    cam = F.relu(cam)
    
    # Normalize to 0..1
    cam_min = cam.min()
    cam_max = cam.max()
    if cam_max - cam_min > 1e-6:
        cam_normalized = (cam - cam_min) / (cam_max - cam_min)
    else:
        cam_normalized = torch.zeros_like(cam)
    
    return cam_normalized




def _get_imagenet_class_name(class_id: int) -> str:
    """
    Get ImageNet class name for a given class ID.
    
    Args:
        class_id: Class ID (0-999)
        
    Returns:
        Class name string (e.g., "golden retriever")
    """
    class_names = get_imagenet_labels()
    
    # Return actual class name if available, otherwise fall back to class_{id}
    return class_names.get(class_id, f"class_{class_id}")


def apply_colormap(heatmap: np.ndarray) -> np.ndarray:
    """
    Apply a simple colormap to heatmap (red for high values, blue for low values).
    
    Args:
        heatmap: 2D array with values in [0, 1]
        
    Returns:
        RGB array with shape [H, W, 3]
    """
    # Simple colormap: red (high) to blue (low) via white/yellow
    # Red channel: high values
    # Green channel: middle values
    # Blue channel: low values
    
    h, w = heatmap.shape
    rgb = np.zeros((h, w, 3), dtype=np.uint8)
    
    # Red channel (high values)
    rgb[:, :, 0] = (heatmap * 255).astype(np.uint8)
    
    # Green channel (middle values, inverted U shape)
    rgb[:, :, 1] = (np.abs(heatmap - 0.5) * 2 * 255).astype(np.uint8)
    
    # Blue channel (low values, inverted)
    rgb[:, :, 2] = ((1 - heatmap) * 255).astype(np.uint8)
    
    return rgb


def generate_gradcam_topk(
    model: nn.Module,
    input_tensor: torch.Tensor,
    original_image: Image.Image,
    target_layer: str,
    job_id: str,
    storage_dir: Path,
    top_k: int = 3,
    alpha: float = 0.45,
) -> List[Dict[str, Any]]:
    """
    Generate Grad-CAM visualizations for top-K predicted classes.
    
    Args:
        model: PyTorch model (should be in eval mode)
        input_tensor: Preprocessed input tensor [1, C, H, W] (will enable requires_grad)
        original_image: Original RGB PIL Image (before preprocessing)
        target_layer: Layer path for Grad-CAM computation (e.g., "layer4")
        job_id: Job identifier for directory structure
        storage_dir: Base storage directory (STORAGE_DIR from config)
        top_k: Number of top classes to generate CAM for (default: 3)
        alpha: Overlay transparency (0.0 to 1.0, default 0.45)
        
    Returns:
        List of dictionaries, each containing:
        - class_id: int (class ID, 0-999 for ImageNet)
        - class_name: str (class name or "class_{id}")
        - prob: float (probability/confidence)
        - overlay_path: str (relative path to overlay PNG)
    """
    # Ensure input tensor requires gradients
    input_tensor = input_tensor.clone().requires_grad_(True)
    
    # Forward pass to get predictions
    model.eval()
    with torch.enable_grad():
        output = model(input_tensor)
    
    # Get probabilities
    probs = F.softmax(output, dim=1)
    
    # Get top-K classes
    top_probs, top_indices = torch.topk(probs[0], k=min(top_k, probs.shape[1]))
    top_indices = top_indices.detach().cpu().numpy()
    top_probs = top_probs.detach().cpu().numpy()
    
    # Create storage directory: STORAGE_DIR/{job_id}/cams/
    cams_dir = storage_dir / job_id / "cams"
    cams_dir.mkdir(parents=True, exist_ok=True)
    
    original_size = original_image.size  # (width, height)
    results = []
    
    # Process each top class
    for class_id, prob in zip(top_indices, top_probs):
        class_id_int = int(class_id)
        
        try:
            # Compute CAM for this class
            activations, gradients = _compute_cam_for_class(
                model=model,
                input_tensor=input_tensor,
                target_layer=target_layer,
                class_id=class_id_int,
            )
            
            # Compute CAM from activations and gradients
            cam_normalized = _compute_cam_from_activations_gradients(activations, gradients)
            
            # Convert to numpy
            cam_np = cam_normalized.detach().cpu().numpy()
            
            # Resize to match original image size
            cam_resized = np.array(Image.fromarray(cam_np).resize(original_size, Image.BILINEAR))
            
            # Generate colored heatmap for overlay
            heatmap_rgb = apply_colormap(cam_resized)
            
            # Overlay on original image
            original_array = np.array(original_image).astype(np.float32) / 255.0
            heatmap_array = heatmap_rgb.astype(np.float32) / 255.0
            
            # Alpha blending
            overlay_array = (1 - alpha) * original_array + alpha * heatmap_array
            overlay_array = np.clip(overlay_array * 255, 0, 255).astype(np.uint8)
            overlay_image = Image.fromarray(overlay_array, mode='RGB')
            
            # Save overlay
            filename = f"class_{class_id_int}.png"
            overlay_path = cams_dir / filename
            overlay_image.save(overlay_path, format='PNG')
            
            # Compute relative path
            overlay_relative = overlay_path.relative_to(storage_dir)
            overlay_str = str(overlay_relative).replace('\\', '/')
            
            # Get class name
            class_name = _get_imagenet_class_name(class_id_int)
            
            results.append({
                "class_id": class_id_int,
                "class_name": class_name,
                "prob": float(prob),
                "overlay_path": overlay_str,
            })
            
            logger.debug(f"Generated CAM for class {class_id_int} ({class_name}): prob={prob:.4f}")
            
        except Exception as e:
            logger.warning(f"Failed to generate CAM for class {class_id_int}: {e}")
            continue
    
    logger.info(f"Generated {len(results)} CAM overlays for top-{top_k} classes")
    
    return results


def generate_gradcam_multilayer(
    model: nn.Module,
    input_tensor: torch.Tensor,
    original_image: Image.Image,
    cam_layers: List[str],
    job_id: str,
    storage_dir: Path,
    top_k: int = 1,
    alpha: float = 0.45,
) -> Dict[str, Any]:
    """
    Generate Grad-CAM visualizations for top-K predicted classes across multiple layers.
    
    Optimized to use a single forward pass and one backward pass per class (instead of
    one forward+backward per layer per class).
    
    Args:
        model: PyTorch model (should be in eval mode)
        input_tensor: Preprocessed input tensor [1, C, H, W] (will enable requires_grad)
        original_image: Original RGB PIL Image (before preprocessing)
        cam_layers: List of layer names for Grad-CAM computation (e.g., ["conv1", "layer1", "layer2"])
        job_id: Job identifier for directory structure
        storage_dir: Base storage directory (STORAGE_DIR from config)
        top_k: Number of top classes to generate CAM for (default: 1)
        alpha: Overlay transparency (0.0 to 1.0, default 0.45)
        
    Returns:
        Dictionary with structure:
        - top_k: int
        - classes: List[Dict] where each dict contains:
            - class_id: int
            - class_name: str
            - prob: float
            - overlays: List[Dict] where each dict contains:
                - layer: str
                - url: str
        - layers: List[str]
        - warnings: Optional[List[str]]
    """
    # Ensure input tensor requires gradients
    input_tensor = input_tensor.clone().requires_grad_(True)
    
    # Get layer modules for all target layers
    layer_modules = {}
    for layer_name in cam_layers:
        try:
            layer_modules[layer_name] = get_layer_by_path(model, layer_name)
        except Exception as e:
            logger.warning(f"Failed to get layer '{layer_name}': {e}")
            continue
    
    if not layer_modules:
        raise ValueError(f"No valid layers found in cam_layers: {cam_layers}")
    
    # Storage for activations and gradients (one dict per layer)
    activations_dict = {}
    gradients_dict = {}
    
    # Create hook functions that capture data for specific layers
    def make_forward_hook(layer_name):
        def hook(module, input, output):
            activations_dict[layer_name] = output.detach()
        return hook
    
    def make_backward_hook(layer_name):
        def hook(module, grad_input, grad_output):
            if grad_output is not None and len(grad_output) > 0:
                gradients_dict[layer_name] = grad_output[0].detach()
        return hook
    
    # Register hooks for all layers
    handles = []
    for layer_name, module in layer_modules.items():
        handles.append(module.register_forward_hook(make_forward_hook(layer_name)))
        handles.append(module.register_full_backward_hook(make_backward_hook(layer_name)))
    
    try:
        # ONE forward pass to get predictions and capture activations for all layers
        model.eval()
        forward_start = time.time()
        with torch.enable_grad():
            output = model(input_tensor)
        forward_time = (time.time() - forward_start) * 1000
        
        # Get probabilities and top-K classes
        probs = F.softmax(output, dim=1)
        top_probs, top_indices = torch.topk(probs[0], k=min(top_k, probs.shape[1]))
        top_indices = top_indices.detach().cpu().numpy()
        top_probs = top_probs.detach().cpu().numpy()
        
        original_size = original_image.size  # (width, height)
        classes_data = []
        warnings = []
        
        # Process each top class (default is top_k=1, so usually just one iteration)
        for class_idx, (class_id, prob) in enumerate(zip(top_indices, top_probs)):
            class_id_int = int(class_id)
            class_name = _get_imagenet_class_name(class_id_int)
            overlays = []
            
            # ONE backward pass for this class (captures gradients for all layers)
            backward_start = time.time()
            model.zero_grad()
            # Use retain_graph=True if we have more classes to process (allows multiple backward passes)
            retain_graph = (class_idx < len(top_indices) - 1)
            output[0, class_id_int].backward(retain_graph=retain_graph)
            backward_time = (time.time() - backward_start) * 1000
            
            # Post-processing start time
            postprocess_start = time.time()
            
            # Process each layer using captured activations and gradients
            for layer_name in cam_layers:
                try:
                    # Get captured activations and gradients for this layer
                    if layer_name not in activations_dict:
                        raise ValueError(f"Activations not captured for layer '{layer_name}'")
                    if layer_name not in gradients_dict:
                        raise ValueError(f"Gradients not captured for layer '{layer_name}'")
                    
                    activations = activations_dict[layer_name]
                    gradients = gradients_dict[layer_name]
                    
                    # Compute CAM from activations and gradients
                    cam_normalized = _compute_cam_from_activations_gradients(activations, gradients)
                    
                    # Convert to numpy
                    cam_np = cam_normalized.detach().cpu().numpy()
                    
                    # Resize to match original image size
                    cam_resized = np.array(Image.fromarray(cam_np).resize(original_size, Image.BILINEAR))
                    
                    # Generate colored heatmap for overlay
                    heatmap_rgb = apply_colormap(cam_resized)
                    
                    # Overlay on original image
                    original_array = np.array(original_image).astype(np.float32) / 255.0
                    heatmap_array = heatmap_rgb.astype(np.float32) / 255.0
                    
                    # Alpha blending
                    overlay_array = (1 - alpha) * original_array + alpha * heatmap_array
                    overlay_array = np.clip(overlay_array * 255, 0, 255).astype(np.uint8)
                    overlay_image = Image.fromarray(overlay_array, mode='RGB')
                    
                    # Create storage directory: STORAGE_DIR/{job_id}/gradcam/{class_id}/{layer_name}.png
                    gradcam_dir = storage_dir / job_id / "gradcam" / str(class_id_int)
                    gradcam_dir.mkdir(parents=True, exist_ok=True)
                    
                    # Save overlay
                    overlay_path = gradcam_dir / f"{layer_name}.png"
                    overlay_image.save(overlay_path, format='PNG')
                    
                    # Compute relative path and URL
                    overlay_relative = overlay_path.relative_to(storage_dir)
                    overlay_str = str(overlay_relative).replace('\\', '/')
                    overlay_url = f"/static/{overlay_str}"
                    
                    overlays.append({
                        "layer": layer_name,
                        "url": overlay_url,
                    })
                    
                    logger.debug(f"Generated CAM for class {class_id_int} ({class_name}) at layer {layer_name}: prob={prob:.4f}")
                    
                except Exception as e:
                    warning_msg = f"Failed to generate CAM for class {class_id_int} ({class_name}) at layer {layer_name}: {e}"
                    logger.warning(warning_msg)
                    warnings.append(warning_msg)
                    continue
            
            postprocess_time = (time.time() - postprocess_start) * 1000
            
            classes_data.append({
                "class_id": class_id_int,
                "class_name": class_name,
                "prob": float(prob),
                "overlays": overlays,
            })
            
            # Log timing for this class (only log for first class to avoid spam)
            if class_idx == 0:
                logger.info(
                    f"Grad-CAM timing for class {class_id_int}: "
                    f"forward={forward_time:.1f}ms, backward={backward_time:.1f}ms, "
                    f"postprocess={postprocess_time:.1f}ms"
                )
        
        result = {
            "top_k": top_k,
            "classes": classes_data,
            "layers": cam_layers,
            "warnings": warnings if warnings else None,
        }
        
        logger.info(f"Generated multi-layer Grad-CAM for {len(classes_data)} classes across {len(cam_layers)} layers")
        
        return result
        
    finally:
        # Clean up hooks
        for handle in handles:
            handle.remove()
        model.zero_grad()
