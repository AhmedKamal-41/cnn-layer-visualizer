"""FastAPI application entry point."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.routes import router as v1_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.jobs.service import job_service

# Setup structured logging
setup_logging()
logger = logging.getLogger("app")

app = FastAPI(
    title="CNN Lens API",
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


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("Starting CNN Lens API")
    logger.info(f"Environment: {settings.BACKEND_ENV}")
    logger.info(f"Storage directory: {settings.STORAGE_DIR}")
    logger.info(f"CORS origins: {settings.CORS_ORIGINS}")
    
    # Start job worker
    await job_service.start_worker()
    logger.info("Job worker started")
    
    logger.info("Startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    logger.info("Shutting down CNN Lens API")
    
    # Stop job worker
    await job_service.stop_worker()
    
    logger.info("Shutdown complete")

