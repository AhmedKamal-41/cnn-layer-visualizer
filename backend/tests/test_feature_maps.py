"""Unit tests for feature maps visualization."""

import tempfile
import shutil
from pathlib import Path

import pytest
import torch

from app.inspect.feature_maps import save_feature_maps
from app.inspect.hooks import capture_activations
from app.models.loaders import load_model


def test_save_feature_maps_one_layer():
    """Test that feature maps can be saved for one layer."""
    # Create temporary directory for testing
    with tempfile.TemporaryDirectory() as temp_dir:
        storage_dir = Path(temp_dir)
        
        # Load resnet18 model
        model = load_model("resnet18")
        model.eval()
        
        # Create dummy input tensor [1, 3, 224, 224]
        dummy_input = torch.randn(1, 3, 224, 224)
        
        # Capture activation from one layer (e.g., "conv1")
        job_id = "test-job-123"
        layer_name = "conv1"
        layer_paths = [layer_name]
        
        activations = capture_activations(model, dummy_input, layer_paths)
        
        # Verify we have activation for the layer
        assert layer_name in activations, f"Activation for '{layer_name}' not captured"
        activation_tensor = activations[layer_name]
        
        # Verify activation shape is [1, C, H, W]
        assert len(activation_tensor.shape) == 4, f"Expected 4D tensor, got shape {activation_tensor.shape}"
        assert activation_tensor.shape[0] == 1, f"Expected batch size 1, got {activation_tensor.shape[0]}"
        
        # Save feature maps
        manifest = save_feature_maps(
            activation_tensor=activation_tensor,
            job_id=job_id,
            layer_name=layer_name,
            storage_dir=storage_dir,
            top_k=32,
        )
        
        # Verify manifest structure
        assert len(manifest) > 0, "Manifest should contain entries"
        assert len(manifest) <= 32, "Should have at most 32 entries (top_k)"
        
        # Verify directory was created
        layer_dir = storage_dir / job_id / layer_name
        assert layer_dir.exists(), f"Layer directory should exist: {layer_dir}"
        assert layer_dir.is_dir(), f"Layer path should be a directory: {layer_dir}"
        
        # Verify each manifest entry
        for entry in manifest:
            assert "channel_index" in entry, "Manifest entry should have 'channel_index'"
            assert "mean" in entry, "Manifest entry should have 'mean'"
            assert "max" in entry, "Manifest entry should have 'max'"
            assert "file_path" in entry, "Manifest entry should have 'file_path'"
            
            # Verify file exists
            file_path = storage_dir / entry["file_path"]
            assert file_path.exists(), f"Feature map file should exist: {file_path}"
            assert file_path.suffix == ".png", f"File should be PNG: {file_path}"
            
            # Verify file is readable as image
            from PIL import Image
            img = Image.open(file_path)
            assert img.mode == "L", f"Image should be grayscale (mode='L'), got {img.mode}"
            
            # Verify stats are numeric
            assert isinstance(entry["channel_index"], int)
            assert isinstance(entry["mean"], float)
            assert isinstance(entry["max"], float)
        
        # Verify file paths are relative
        for entry in manifest:
            file_path_str = entry["file_path"]
            assert not Path(file_path_str).is_absolute(), f"File path should be relative: {file_path_str}"
            assert file_path_str.startswith(f"{job_id}/{layer_name}/"), f"File path should start with job_id/layer_name: {file_path_str}"
            assert file_path_str.endswith(".png"), f"File path should end with .png: {file_path_str}"
        
        print(f"✓ Successfully saved {len(manifest)} feature maps for layer '{layer_name}'")


if __name__ == "__main__":
    print("Running feature maps test...")
    test_save_feature_maps_one_layer()
    print("✓ Feature maps test passed!")

