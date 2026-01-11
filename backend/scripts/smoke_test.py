#!/usr/bin/env python3
"""
Smoke test script for CNN Lens backend.
Tests end-to-end flow: health check, model listing, job creation, and result verification.
"""

import sys
import time
import requests
from pathlib import Path

# Add parent directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

def test_health():
    """Test health check endpoint."""
    print("Testing /api/v1/health...")
    response = requests.get(f"{API_BASE}/health", timeout=5)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data.get("status") == "ok", f"Expected status 'ok', got {data}"
    print("✓ Health check passed")

def test_models():
    """Test models endpoint."""
    print("Testing /api/v1/models...")
    response = requests.get(f"{API_BASE}/models", timeout=5)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    models = response.json()
    assert isinstance(models, list), f"Expected list, got {type(models)}"
    assert len(models) > 0, "Expected at least one model"
    print(f"✓ Models endpoint passed ({len(models)} models found)")
    return models[0]["id"]  # Return first model ID

def test_create_job(model_id: str, image_path: Path):
    """Test job creation."""
    print(f"Testing job creation with model '{model_id}'...")
    
    if not image_path.exists():
        raise FileNotFoundError(f"Sample image not found: {image_path}")
    
    with open(image_path, "rb") as f:
        files = {"image": ("sample.jpg", f, "image/jpeg")}
        data = {"model_id": model_id}
        response = requests.post(f"{API_BASE}/jobs", files=files, data=data, timeout=30)
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    job_data = response.json()
    assert "job_id" in job_data, f"Expected 'job_id' in response, got keys: {job_data.keys()}"
    job_id = job_data["job_id"]
    print(f"✓ Job created: {job_id}")
    return job_id

def test_poll_job(job_id: str, max_wait_seconds: int = 120):
    """Poll job until SUCCEEDED or FAILED."""
    print(f"Polling job {job_id} (max {max_wait_seconds}s)...")
    start_time = time.time()
    
    while time.time() - start_time < max_wait_seconds:
        response = requests.get(f"{API_BASE}/jobs/{job_id}", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        job_data = response.json()
        status = job_data.get("status")
        progress = job_data.get("progress", 0)
        message = job_data.get("message", "")
        
        print(f"  Status: {status}, Progress: {progress}%, Message: {message}")
        
        if status == "succeeded":
            print("✓ Job succeeded")
            return job_data
        elif status == "failed":
            error_msg = job_data.get("message", "Unknown error")
            raise AssertionError(f"Job failed: {error_msg}")
        
        time.sleep(2)
    
    raise TimeoutError(f"Job did not complete within {max_wait_seconds} seconds")

def test_verify_results(job_data: dict):
    """Verify job results meet requirements."""
    print("Verifying job results...")
    
    # Check required fields
    assert "job_id" in job_data, "Missing 'job_id'"
    assert "model" in job_data, "Missing 'model'"
    assert "input" in job_data, "Missing 'input'"
    assert "prediction" in job_data, "Missing 'prediction'"
    assert "layers" in job_data, "Missing 'layers'"
    assert "cams" in job_data, "Missing 'cams'"
    assert "timings" in job_data, "Missing 'timings'"
    
    # Verify layers (at least 3)
    layers = job_data["layers"]
    assert isinstance(layers, list), f"Expected layers to be list, got {type(layers)}"
    assert len(layers) >= 3, f"Expected at least 3 layers, got {len(layers)}"
    print(f"✓ Found {len(layers)} layers")
    
    # Verify at least one layer has feature maps
    layers_with_feature_maps = 0
    for layer in layers:
        top_channels = layer.get("top_channels", [])
        if len(top_channels) > 0:
            layers_with_feature_maps += 1
            # Verify feature map URLs are accessible
            for channel in top_channels[:1]:  # Check first channel only
                image_url = channel.get("image_url", "")
                if image_url:
                    full_url = f"{BASE_URL}{image_url}"
                    img_response = requests.head(full_url, timeout=5)
                    assert img_response.status_code == 200, f"Feature map image not accessible: {full_url}"
    
    assert layers_with_feature_maps > 0, "Expected at least one layer with feature maps"
    print(f"✓ Found {layers_with_feature_maps} layers with feature maps")
    
    # Verify CAMs (at least 1)
    cams = job_data["cams"]
    assert isinstance(cams, list), f"Expected cams to be list, got {type(cams)}"
    assert len(cams) >= 1, f"Expected at least 1 CAM, got {len(cams)}"
    print(f"✓ Found {len(cams)} CAM overlays")
    
    # Verify CAM overlay URLs are accessible
    for cam in cams:
        overlay_url = cam.get("overlay_url", "")
        if overlay_url:
            full_url = f"{BASE_URL}{overlay_url}"
            img_response = requests.head(full_url, timeout=5)
            assert img_response.status_code == 200, f"CAM overlay image not accessible: {full_url}"
    
    print("✓ All CAM overlays are accessible")
    
    # Verify prediction
    prediction = job_data["prediction"]
    topk = prediction.get("topk", [])
    assert len(topk) > 0, "Expected at least one prediction"
    print(f"✓ Found {len(topk)} predictions")
    
    print("✓ All result verifications passed")

def main():
    """Run smoke test."""
    print("=" * 60)
    print("CNN Lens Backend Smoke Test")
    print("=" * 60)
    
    try:
        # Test 1: Health check
        test_health()
        
        # Test 2: Models endpoint
        model_id = test_models()
        
        # Test 3: Create job
        sample_image_path = backend_dir / "assets" / "sample.jpg"
        if not sample_image_path.exists():
            raise FileNotFoundError(
                f"Sample image not found at {sample_image_path}. "
                "Please run: python scripts/create_sample_image.py"
            )
        job_id = test_create_job(model_id, sample_image_path)
        
        # Test 4: Poll job
        job_data = test_poll_job(job_id)
        
        # Test 5: Verify results
        test_verify_results(job_data)
        
        print("=" * 60)
        print("SMOKE TEST PASSED")
        print("=" * 60)
        return 0
        
    except Exception as e:
        print("=" * 60)
        print(f"SMOKE TEST FAILED: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())

