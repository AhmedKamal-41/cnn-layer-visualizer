"""Tests for job creation validation."""

import io
import pytest
from fastapi.testclient import TestClient


def test_create_job_non_image_file(client: TestClient):
    """Test that non-image files are rejected."""
    # Create a text file (non-image)
    text_file = io.BytesIO(b"This is not an image file")
    text_file.name = "test.txt"
    
    response = client.post(
        "/api/v1/jobs",
        data={"model_id": "resnet18"},
        files={"image": ("test.txt", text_file, "text/plain")}
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "image" in data["detail"].lower()


def test_create_job_missing_model_id(client: TestClient, sample_image_bytes: bytes):
    """Test that missing model_id is rejected."""
    response = client.post(
        "/api/v1/jobs",
        files={"image": ("test.png", io.BytesIO(sample_image_bytes), "image/png")}
    )
    
    # FastAPI should return 422 for missing form field
    assert response.status_code == 422


def test_create_job_invalid_model_id(client: TestClient, sample_image_bytes: bytes):
    """Test that invalid model_id is rejected."""
    response = client.post(
        "/api/v1/jobs",
        data={"model_id": "invalid_model_id"},
        files={"image": ("test.png", io.BytesIO(sample_image_bytes), "image/png")}
    )
    
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()


def test_create_job_valid(client: TestClient, sample_image_bytes: bytes):
    """Test that valid image and model_id creates a job."""
    response = client.post(
        "/api/v1/jobs",
        data={"model_id": "resnet18"},
        files={"image": ("test.png", io.BytesIO(sample_image_bytes), "image/png")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert "status" in data
    assert "model_id" in data
    assert data["model_id"] == "resnet18"

