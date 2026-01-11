"""Pydantic models for request/response schemas."""

from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    """Job status enumeration."""
    
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobCreate(BaseModel):
    """Request model for creating a job."""
    
    model_id: str = Field(..., description="Model identifier from registry")
    image_hash: Optional[str] = Field(None, description="Hash of the input image")


class JobResponse(BaseModel):
    """Response model for job status and results."""
    
    job_id: str = Field(..., description="Unique job identifier")
    status: JobStatus = Field(..., description="Current job status")
    model_id: str = Field(..., description="Model identifier used")
    created_at: Optional[datetime] = Field(None, description="Job creation timestamp")
    completed_at: Optional[datetime] = Field(None, description="Job completion timestamp")
    error: Optional[str] = Field(None, description="Error message if job failed")
    results: Optional[Dict[str, Any]] = Field(None, description="Job results if completed")
    
    class Config:
        """Pydantic config."""
        use_enum_values = True

