"""Application configuration."""

from pathlib import Path
from typing import List, Union, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    # Environment Configuration
    BACKEND_ENV: str = "development"  # development, production, testing
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Storage Configuration
    STORAGE_DIR: Path = Path("./storage")
    
    # Model Registry
    MODEL_REGISTRY_PATH: Path = Path(__file__).parent.parent.parent / "model_registry.yaml"
    
    # Cache Configuration
    CACHE_ENABLED: bool = True
    CACHE_MAX_ITEMS: int = 100
    
    # Model Configuration
    PRELOAD_MODELS: Optional[str] = None  # "all" or comma-separated list of model IDs
    MODEL_CACHE_MAX: int = 3  # Maximum number of models to keep in memory (LRU cache)
    TORCH_HOME: Optional[Path] = None  # PyTorch cache directory (uses TORCH_HOME env var if set)
    
    # Upload Configuration
    MAX_UPLOAD_SIZE_MB: int = 10
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS_ORIGINS from comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return v
        return []
    
    @field_validator("STORAGE_DIR", mode="after")
    @classmethod
    def resolve_storage_dir(cls, v: Path) -> Path:
        """Resolve STORAGE_DIR to absolute path."""
        if not v.is_absolute():
            base_path = Path(__file__).parent.parent.parent
            v = (base_path / v).resolve()
        else:
            v = v.resolve()
        return v
    
    @field_validator("MODEL_REGISTRY_PATH", mode="after")
    @classmethod
    def resolve_model_registry_path(cls, v: Path) -> Path:
        """Resolve MODEL_REGISTRY_PATH to absolute path."""
        if not v.is_absolute():
            base_path = Path(__file__).parent.parent.parent
            v = (base_path / v).resolve()
        else:
            v = v.resolve()
        return v
    
    @field_validator("TORCH_HOME", mode="after")
    @classmethod
    def resolve_torch_home(cls, v: Optional[Path]) -> Optional[Path]:
        """Resolve TORCH_HOME to absolute path if provided."""
        if v is None:
            return None
        if not v.is_absolute():
            v = v.resolve()
        else:
            v = v.resolve()
        return v
    
    @field_validator("MODEL_CACHE_MAX", mode="after")
    @classmethod
    def validate_model_cache_max(cls, v: int) -> int:
        """Validate MODEL_CACHE_MAX is >= 1."""
        if v < 1:
            raise ValueError("MODEL_CACHE_MAX must be >= 1")
        return v


settings = Settings()

