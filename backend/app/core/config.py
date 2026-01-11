"""Application configuration."""

from pathlib import Path
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    # Environment Configuration
    BACKEND_ENV: str = "development"  # development, production, testing
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Storage Configuration
    STORAGE_DIR: Path = Path("./storage")
    
    # Model Registry
    MODEL_REGISTRY_PATH: Path = Path(__file__).parent.parent.parent / "model_registry.yaml"
    
    # Cache Configuration
    CACHE_ENABLED: bool = True
    CACHE_MAX_ITEMS: int = 100
    
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
        return v
    
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


settings = Settings()

