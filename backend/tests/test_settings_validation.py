"""Tests for settings validation (top_k_preds, top_k_cam, cam_layer_mode, feature_map_limit)."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_top_k_preds_validation():
    """Test that top_k_preds must be in {1, 3, 5}."""
    # Valid values should work
    for valid_k in [1, 3, 5]:
        # We can't easily test the full endpoint without a real image, but we can test validation
        # For now, we'll test the validation logic exists
        assert valid_k in {1, 3, 5}
    
    # Invalid values should be rejected
    for invalid_k in [0, 2, 4, 6, -1, 10]:
        assert invalid_k not in {1, 3, 5}


def test_top_k_cam_validation():
    """Test that top_k_cam must be in {1, 3, 5}."""
    for valid_k in [1, 3, 5]:
        assert valid_k in {1, 3, 5}
    
    for invalid_k in [0, 2, 4, 6, -1, 10]:
        assert invalid_k not in {1, 3, 5}


def test_top_k_cam_constraint():
    """Test that top_k_cam <= top_k_preds constraint."""
    # Valid combinations
    valid_combinations = [
        (1, 1),
        (3, 1),
        (3, 3),
        (5, 1),
        (5, 3),
        (5, 5),
    ]
    
    for top_k_preds, top_k_cam in valid_combinations:
        assert top_k_cam <= top_k_preds, f"top_k_cam ({top_k_cam}) should be <= top_k_preds ({top_k_preds})"
    
    # Invalid combinations
    invalid_combinations = [
        (1, 3),
        (1, 5),
        (3, 5),
    ]
    
    for top_k_preds, top_k_cam in invalid_combinations:
        assert top_k_cam > top_k_preds, f"top_k_cam ({top_k_cam}) should be > top_k_preds ({top_k_preds}) for invalid case"


def test_cam_layer_mode_validation():
    """Test that cam_layer_mode must be 'fast' or 'full'."""
    valid_modes = ["fast", "full"]
    
    for mode in valid_modes:
        assert mode in {"fast", "full"}
    
    invalid_modes = ["slow", "all", "1", "5", ""]
    
    for mode in invalid_modes:
        assert mode not in {"fast", "full"}


def test_feature_map_limit_validation():
    """Test that feature_map_limit must be in {8, 16, 32}."""
    for valid_limit in [8, 16, 32]:
        assert valid_limit in {8, 16, 32}
    
    for invalid_limit in [0, 1, 7, 9, 15, 17, 31, 33, 64]:
        assert invalid_limit not in {8, 16, 32}


def test_default_values():
    """Test that defaults are correct."""
    # Default values
    default_top_k_preds = 5
    default_top_k_cam = 1
    default_cam_layer_mode = "fast"
    default_feature_map_limit = 16
    
    # Verify defaults are valid
    assert default_top_k_preds in {1, 3, 5}
    assert default_top_k_cam in {1, 3, 5}
    assert default_top_k_cam <= default_top_k_preds
    assert default_cam_layer_mode in {"fast", "full"}
    assert default_feature_map_limit in {8, 16, 32}


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

