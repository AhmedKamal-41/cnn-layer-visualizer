"""Unit tests for model loaders and preprocessing."""

import io
import pytest
import torch
from PIL import Image

from app.models.loaders import preprocess_image, load_model


def create_test_image_bytes(width: int = 256, height: int = 256) -> bytes:
    """Create a simple test image as bytes."""
    # Create a simple RGB image
    image = Image.new("RGB", (width, height), color=(128, 128, 128))
    
    # Convert to bytes
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.getvalue()


def test_preprocess_image_shape():
    """Test that preprocessing returns correct tensor shape."""
    # Create test image
    image_bytes = create_test_image_bytes(width=300, height=400)
    
    # Preprocess with resnet18 (input_size: [224, 224])
    tensor = preprocess_image(image_bytes, model_id="resnet18")
    
    # Verify shape is [1, 3, 224, 224]
    assert tensor.shape == (1, 3, 224, 224), f"Expected shape [1, 3, 224, 224], got {tensor.shape}"
    
    # Verify dtype is float32
    assert tensor.dtype == torch.float32, f"Expected dtype float32, got {tensor.dtype}"


def test_preprocess_image_different_sizes():
    """Test preprocessing with different input image sizes."""
    # Test with square image
    image_bytes_square = create_test_image_bytes(width=500, height=500)
    tensor_square = preprocess_image(image_bytes_square, model_id="resnet18")
    assert tensor_square.shape == (1, 3, 224, 224)
    
    # Test with rectangular image
    image_bytes_rect = create_test_image_bytes(width=800, height=600)
    tensor_rect = preprocess_image(image_bytes_rect, model_id="resnet18")
    assert tensor_rect.shape == (1, 3, 224, 224)
    
    # Test with smaller image
    image_bytes_small = create_test_image_bytes(width=100, height=100)
    tensor_small = preprocess_image(image_bytes_small, model_id="resnet18")
    assert tensor_small.shape == (1, 3, 224, 224)


def test_load_model():
    """Test that model loading works and returns model in eval mode."""
    model = load_model("resnet18")
    
    # Verify it's a PyTorch module
    assert isinstance(model, torch.nn.Module)
    
    # Verify it's in eval mode
    assert not model.training, "Model should be in eval mode"
    
    # Verify it's on CPU
    next_param = next(model.parameters())
    assert next_param.device.type == "cpu", "Model should be on CPU"


def test_load_model_caching():
    """Test that models are cached and subsequent calls return same instance."""
    model1 = load_model("resnet18")
    model2 = load_model("resnet18")
    
    # Should be the same instance (cached)
    assert model1 is model2, "Models should be cached and return same instance"


if __name__ == "__main__":
    # Simple test runner for quick verification
    print("Running preprocessing shape test...")
    test_preprocess_image_shape()
    print("✓ Preprocessing shape test passed!")
    print("\nRunning preprocessing different sizes test...")
    test_preprocess_image_different_sizes()
    print("✓ Preprocessing different sizes test passed!")
    print("\nAll tests passed!")

