"""Feature maps visualization utilities."""

import io
import logging
from pathlib import Path
from typing import List, Dict, Any

import torch
import numpy as np
from PIL import Image

from app.core.config import settings

logger = logging.getLogger("app.inspect.feature_maps")


def save_feature_maps(
    activation_tensor: torch.Tensor,
    job_id: str,
    layer_name: str,
    storage_dir: Path,
    top_k: int = 32,
) -> List[Dict[str, Any]]:
    """
    Extract top-k channels from activation tensor and save as PNG images.
    
    Args:
        activation_tensor: Activation tensor with shape [1, C, H, W]
        job_id: Job identifier for directory structure
        layer_name: Layer name for subdirectory
        storage_dir: Base storage directory (STORAGE_DIR from config)
        top_k: Number of top channels to select (default: 32)
        
    Returns:
        List of dictionaries, each containing:
        - channel_index: int (original channel index)
        - mean: float (mean activation value)
        - max: float (max activation value)
        - file_path: str (relative path from storage_dir)
    """
    # Remove batch dimension: [1, C, H, W] -> [C, H, W]
    activations = activation_tensor.squeeze(0)  # Shape: [C, H, W]
    
    num_channels = activations.shape[0]
    top_k = min(top_k, num_channels)  # Don't exceed available channels
    
    # Compute mean activation per channel (over H, W dimensions)
    # Shape: [C]
    channel_means = torch.mean(activations, dim=(1, 2))
    
    # Get top_k channel indices (sorted by mean activation, descending)
    _, top_indices = torch.topk(channel_means, k=top_k, largest=True)
    top_indices = top_indices.cpu().numpy()
    
    # Create storage directory: STORAGE_DIR/{job_id}/{layer_name}/
    layer_dir = storage_dir / job_id / layer_name
    layer_dir.mkdir(parents=True, exist_ok=True)
    
    manifest = []
    
    # Process each selected channel
    for idx, channel_idx in enumerate(top_indices):
        # Extract channel: [H, W]
        channel = activations[channel_idx].cpu().numpy()
        
        # Compute stats before normalization
        channel_mean = float(np.mean(channel))
        channel_max = float(np.max(channel))
        
        # Normalize to 0-255 range
        channel_min = np.min(channel)
        channel_max_val = np.max(channel)
        
        if channel_max_val - channel_min > 1e-6:  # Avoid division by zero
            normalized = (channel - channel_min) / (channel_max_val - channel_min) * 255.0
        else:
            # Handle edge case: constant values
            normalized = np.zeros_like(channel) if channel_max_val < 1e-6 else np.full_like(channel, 255.0)
        
        # Convert to uint8
        normalized = np.clip(normalized, 0, 255).astype(np.uint8)
        
        # Create PIL Image (mode='L' for grayscale)
        image = Image.fromarray(normalized, mode='L')
        
        # Save to file: ch_{channel_idx}.png
        filename = f"ch_{channel_idx}.png"
        file_path = layer_dir / filename
        
        image.save(file_path, format='PNG')
        
        # Compute relative path from storage_dir
        relative_path = file_path.relative_to(storage_dir)
        relative_path_str = str(relative_path).replace('\\', '/')  # Normalize path separators
        
        # Add to manifest
        manifest.append({
            "channel_index": int(channel_idx),
            "mean": channel_mean,
            "max": channel_max,
            "file_path": relative_path_str,
        })
        
        logger.debug(f"Saved feature map: {relative_path_str} (channel {channel_idx}, mean={channel_mean:.4f})")
    
    logger.info(f"Saved {len(manifest)} feature maps for layer '{layer_name}' to {layer_dir}")
    
    return manifest

