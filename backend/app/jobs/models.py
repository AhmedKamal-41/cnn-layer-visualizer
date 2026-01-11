"""Job models for job records and status."""

from datetime import datetime
from enum import Enum
from typing import Optional, Dict, List, Any

from pydantic import BaseModel, Field


class JobStatus(str, Enum):
    """Job status enumeration."""
    
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class JobResult(BaseModel):
    """Job result data (internal storage)."""
    
    prediction: Any = Field(default=None, description="Model prediction output")
    layers_metadata: List[Dict[str, Any]] = Field(default_factory=list, description="Metadata for each layer")
    assets_manifest: Dict[str, str] = Field(default_factory=dict, description="URLs/paths to generated assets")
    timings: Dict[str, float] = Field(default_factory=dict, description="Timing information for different operations")


# New schema models for API response
class ModelInfo(BaseModel):
    """Model information."""
    id: str
    display_name: str


class InputInfo(BaseModel):
    """Input image information."""
    image_url: str


class PredictionClass(BaseModel):
    """Prediction class information."""
    class_id: int
    class_name: str
    prob: float


class PredictionInfo(BaseModel):
    """Prediction information."""
    topk: List[PredictionClass]


class ChannelInfo(BaseModel):
    """Channel information."""
    channel: int
    mean: float
    max: float
    image_url: str


class LayerShape(BaseModel):
    """Layer shape information."""
    c: int
    h: int
    w: int


class LayerInfo(BaseModel):
    """Layer information."""
    name: str
    stage: Optional[str] = Field(default=None, description="Canonical stage identifier (e.g., stage1, stage2)")
    shape: LayerShape
    top_channels: List[ChannelInfo]


class CAMInfo(BaseModel):
    """Grad-CAM information."""
    class_id: int
    class_name: str
    prob: float
    overlay_url: str


class TimingsInfo(BaseModel):
    """Timing information in milliseconds."""
    preprocess_ms: float
    forward_ms: float
    serialize_ms: float
    total_ms: float


class JobResultResponse(BaseModel):
    """Job result response schema for SUCCEEDED jobs."""
    job_id: str
    model: ModelInfo
    input: InputInfo
    prediction: PredictionInfo
    layers: List[LayerInfo]
    cams: List[CAMInfo]
    timings: TimingsInfo


class JobRecord(BaseModel):
    """Job record model."""
    
    job_id: str = Field(..., description="Unique job identifier (UUID)")
    model_id: str = Field(..., description="Model identifier from registry")
    created_at: datetime = Field(default_factory=datetime.now, description="Job creation timestamp")
    status: JobStatus = Field(..., description="Current job status")
    progress: int = Field(default=0, ge=0, le=100, description="Job progress percentage (0-100)")
    message: Optional[str] = Field(default=None, description="Optional status message")
    result: Optional[JobResult] = Field(default=None, description="Job result data (null until completion)")
    
    class Config:
        """Pydantic config."""
        use_enum_values = True

