"""FastAPI application entry point."""

import gc
import logging
import os
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.routes import router as v1_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.jobs.service import job_service
from app.models.loaders import load_model, remove_from_cache
from app.models.registry import get_all_model_ids

# Setup structured logging
setup_logging()
logger = logging.getLogger("app")

app = FastAPI(
    title="ConvLens API",
    description="Backend API for CNN visualization and analysis",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(v1_router, prefix="/api/v1", tags=["v1"])

# Mount static file server for storage directory
# Ensure storage directory exists
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(settings.STORAGE_DIR)), name="static")


@app.get("/health")
async def health_check():
    """Health check endpoint for Railway health checks."""
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("Starting ConvLens API")
    logger.info(f"Environment: {settings.BACKEND_ENV}")
    logger.info(f"Storage directory: {settings.STORAGE_DIR}")
    logger.info(f"CORS origins: {settings.CORS_ORIGINS}")
    
    # Ensure TORCH_HOME directory exists and set environment variable
    settings.TORCH_HOME.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("TORCH_HOME", str(settings.TORCH_HOME))
    logger.info(f"PyTorch cache directory: {settings.TORCH_HOME}")
    
    # Start job worker
    await job_service.start_worker()
    logger.info("Job worker started")
    
    # Preload models if configured
    if settings.PRELOAD_MODELS:
        preload_start = time.time()
        model_ids_to_preload = []
        
        if settings.PRELOAD_MODELS.lower() == "all":
            model_ids_to_preload = get_all_model_ids()
            logger.info(f"Preloading all models: {len(model_ids_to_preload)} models")
        else:
            # Comma-separated list
            model_ids_to_preload = [mid.strip() for mid in settings.PRELOAD_MODELS.split(",") if mid.strip()]
            logger.info(f"Preloading specified models: {model_ids_to_preload}")
        
        strategy = settings.PRELOAD_STRATEGY
        logger.info(f"Preload strategy: {strategy}")
        
        for model_id in model_ids_to_preload:
            model_start = time.time()
            try:
                if strategy == "download_only":
                    # Load model to download weights, then free memory
                    model = load_model(model_id)
                    # Remove from cache immediately to free RAM
                    remove_from_cache(model_id)
                    del model
                    gc.collect()
                    model_time = (time.time() - model_start) * 1000
                    logger.info(f"Preloaded model weights: {model_id} ({model_time:.1f}ms)")
                elif strategy == "load_into_ram":
                    # Load and keep in cache (existing logic)
                    load_model(model_id)
                    model_time = (time.time() - model_start) * 1000
                    logger.info(f"Preloaded and cached model: {model_id} ({model_time:.1f}ms)")
            except Exception as e:
                logger.error(f"Failed to preload model {model_id}: {e}")
        
        total_time = (time.time() - preload_start) * 1000
        logger.info(f"Model preloading complete ({len(model_ids_to_preload)} models, {total_time:.1f}ms)")
    
    logger.info("Startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    logger.info("Shutting down ConvLens API")
    
    # Stop job worker
    await job_service.stop_worker()
    
    logger.info("Shutdown complete")

