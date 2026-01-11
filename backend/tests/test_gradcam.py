"""Unit tests for Grad-CAM visualization."""

import tempfile
import io
from pathlib import Path

import pytest
import torch
from PIL import Image

from app.inspect.gradcam import generate_gradcam_topk
from app.models.loaders import load_model, preprocess_image


def create_test_image_bytes(width: int = 224, height: int = 224) -> bytes:
    """Create a simple test image as bytes."""
    image = Image.new("RGB", (width, height), color=(128, 128, 128))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.getvalue()


def test_gradcam_output_files_exist():
    """Test that generate_gradcam_topk produces output files."""
    model = load_model("resnet18")
    model.eval()
    
    # Create sample image
    sample_image = Image.new("RGB", (224, 224), color=(128, 128, 128))
    
    # Preprocess the image - preprocess_image expects bytes
    # Convert to bytes first, then preprocess
    buffer = io.BytesIO()
    sample_image.save(buffer, format="PNG")
    image_bytes = buffer.getvalue()
    input_tensor = preprocess_image(image_bytes, "resnet18")
    
    # Create temporary directory for output
    with tempfile.TemporaryDirectory() as tmpdir:
        storage_dir = Path(tmpdir)
        job_id = "test_job_123"
        
        # Generate Grad-CAM for top-3 classes (using layer4 as target layer for resnet18)
        cam_results = generate_gradcam_topk(
            model=model,
            input_tensor=input_tensor,
            original_image=sample_image,
            target_layer="layer4",
            job_id=job_id,
            storage_dir=storage_dir,
            top_k=3,
        )
        
        # Verify results structure
        assert isinstance(cam_results, list)
        assert len(cam_results) > 0
        
        # Verify each CAM result has expected fields
        for cam_info in cam_results:
            assert "class_id" in cam_info
            assert "class_name" in cam_info
            assert "prob" in cam_info
            assert "overlay_path" in cam_info
            
            # Verify overlay file exists
            overlay_path = storage_dir / cam_info["overlay_path"]
            assert overlay_path.exists(), f"Overlay file not found: {overlay_path}"
            assert overlay_path.is_file(), f"Overlay path is not a file: {overlay_path}"
            
            # Verify file is a valid image (check file extension and size)
            assert overlay_path.suffix == ".png", f"Expected PNG file, got {overlay_path.suffix}"
            assert overlay_path.stat().st_size > 0, f"Overlay file is empty: {overlay_path}"
            
            # Try to open as image to verify it's valid
            try:
                overlay_img = Image.open(overlay_path)
                assert overlay_img.format == "PNG", f"File is not a valid PNG: {overlay_path}"
                assert overlay_img.size[0] > 0 and overlay_img.size[1] > 0, f"Image has invalid size: {overlay_path}"
            except Exception as e:
                pytest.fail(f"Failed to open overlay image {overlay_path}: {e}")


def test_gradcam_output_directory_structure():
    """Test that Grad-CAM outputs are saved in correct directory structure."""
    model = load_model("resnet18")
    model.eval()
    
    # Create sample image
    sample_image = Image.new("RGB", (224, 224), color=(128, 128, 128))
    buffer = io.BytesIO()
    sample_image.save(buffer, format="PNG")
    image_bytes = buffer.getvalue()
    input_tensor = preprocess_image(image_bytes, "resnet18")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        storage_dir = Path(tmpdir)
        job_id = "test_job_456"
        
        cam_results = generate_gradcam_topk(
            model=model,
            input_tensor=input_tensor,
            original_image=sample_image,
            target_layer="layer4",
            job_id=job_id,
            storage_dir=storage_dir,
            top_k=2,
        )
        
        # Verify cams directory exists
        cams_dir = storage_dir / job_id / "cams"
        assert cams_dir.exists(), f"CAMs directory not found: {cams_dir}"
        assert cams_dir.is_dir(), f"CAMs path is not a directory: {cams_dir}"
        
        # Verify at least one overlay file exists in the directory
        overlay_files = list(cams_dir.glob("*.png"))
        assert len(overlay_files) > 0, f"No PNG files found in {cams_dir}"
