"""Structured logging configuration."""

import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict

from app.core.config import settings


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, "extra_fields"):
            log_data.update(record.extra_fields)
        
        return json.dumps(log_data)


def setup_logging() -> None:
    """Configure structured logging based on environment."""
    # Determine log level from environment
    env_to_level = {
        "development": logging.DEBUG,
        "testing": logging.INFO,
        "production": logging.INFO,
    }
    log_level = env_to_level.get(settings.BACKEND_ENV.lower(), logging.INFO)
    
    # Create formatter
    if settings.BACKEND_ENV.lower() == "production":
        # Use JSON formatter in production
        formatter = JSONFormatter()
    else:
        # Use readable formatter in development
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Configure uvicorn loggers
    logging.getLogger("uvicorn").setLevel(log_level)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(log_level)
    
    # Configure app logger
    app_logger = logging.getLogger("app")
    app_logger.setLevel(log_level)
    
    # Log configuration
    app_logger.info(
        f"Logging configured: level={logging.getLevelName(log_level)}, "
        f"environment={settings.BACKEND_ENV}, format={'JSON' if settings.BACKEND_ENV.lower() == 'production' else 'standard'}"
    )

