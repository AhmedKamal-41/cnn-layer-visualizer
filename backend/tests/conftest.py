"""Shared pytest fixtures for backend tests."""

import os
import tempfile
import io
from pathlib import Path
from typing import Generator

import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def tmp_storage_dir() -> Generator[Path, None, None]:
    """Create a temporary storage directory for tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def sample_image() -> Image.Image:
    """Create a small test image (224x224 RGB)."""
    return Image.new("RGB", (224, 224), color=(128, 128, 128))


@pytest.fixture
def sample_image_bytes(sample_image: Image.Image) -> bytes:
    """Convert sample image to bytes (PNG format)."""
    buffer = io.BytesIO()
    sample_image.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.getvalue()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a FastAPI test client."""
    # TestClient handles startup/shutdown events automatically
    with TestClient(app) as test_client:
        yield test_client

