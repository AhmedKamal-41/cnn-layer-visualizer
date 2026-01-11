"""Unit tests for forward hooks and activation capture."""

import pytest
import torch
import torch.nn as nn

from app.inspect.hooks import capture_activations, get_layer_by_path
from app.models.loaders import load_model


def test_get_layer_by_path_resnet18():
    """Test getting layers by path for ResNet-18."""
    model = load_model("resnet18")
    
    # Test getting different layers
    layer1 = get_layer_by_path(model, "layer1")
    assert isinstance(layer1, nn.Module)
    
    layer4 = get_layer_by_path(model, "layer4")
    assert isinstance(layer4, nn.Module)
    
    conv1 = get_layer_by_path(model, "conv1")
    assert isinstance(conv1, nn.Module)


def test_capture_activations_resnet18():
    """Test capturing activations for ResNet-18 with at least 3 layers."""
    model = load_model("resnet18")
    model.eval()
    
    # Create a dummy input tensor [1, 3, 224, 224]
    input_tensor = torch.randn(1, 3, 224, 224)
    
    # Define layers to hook (at least 3)
    layer_paths = ["conv1", "layer1", "layer2", "layer3"]
    
    # Capture activations
    activations_dict = capture_activations(model, input_tensor, layer_paths)
    
    # Verify all layers were captured
    assert len(activations_dict) >= 3, f"Expected at least 3 layers, got {len(activations_dict)}"
    
    # Verify each activation has correct shape [1, C, H, W]
    for layer_name in layer_paths:
        if layer_name in activations_dict:
            activation = activations_dict[layer_name]
            assert isinstance(activation, torch.Tensor)
            assert activation.dim() == 4, f"Expected 4D tensor, got {activation.dim()}D"
            assert activation.shape[0] == 1, f"Expected batch size 1, got {activation.shape[0]}"
            assert activation.shape[1] > 0, f"Channels should be > 0, got {activation.shape[1]}"
            assert activation.shape[2] > 0, f"Height should be > 0, got {activation.shape[2]}"
            assert activation.shape[3] > 0, f"Width should be > 0, got {activation.shape[3]}"


def test_capture_activations_shape_consistency():
    """Test that captured activations have consistent batch dimension."""
    model = load_model("resnet18")
    model.eval()
    
    input_tensor = torch.randn(1, 3, 224, 224)
    layer_paths = ["layer1", "layer2"]
    
    activations_dict = capture_activations(model, input_tensor, layer_paths)
    
    # All activations should have batch size 1
    for layer_name, activation in activations_dict.items():
        assert activation.shape[0] == 1, f"Layer {layer_name} has batch size {activation.shape[0]}, expected 1"
