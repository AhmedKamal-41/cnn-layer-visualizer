"""Tests for models endpoint."""

import pytest
from fastapi.testclient import TestClient


def test_list_models(client: TestClient):
    """Test that models endpoint returns list of models."""
    response = client.get("/api/v1/models")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    
    # Check structure of model entries
    for model in data:
        assert "id" in model
        assert "display_name" in model
        assert "input_size" in model


def test_get_model_config_valid(client: TestClient):
    """Test getting model config for valid model_id."""
    response = client.get("/api/v1/models/resnet18")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "resnet18"
    assert "display_name" in data
    assert "input_size" in data
    assert "normalization" in data
    assert "layers_to_hook" in data


def test_get_model_config_invalid(client: TestClient):
    """Test that invalid model_id returns 404."""
    response = client.get("/api/v1/models/invalid_model_id")
    
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()

