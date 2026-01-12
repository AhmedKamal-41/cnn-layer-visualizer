"""API v1 routes."""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, List, Dict, Any

from app.models.registry import list_models, get_model_config
from app.jobs.service import job_service
from app.jobs.models import (
    JobRecord,
    JobStatus,
    JobResultResponse,
    ModelInfo,
    InputInfo,
    PredictionInfo,
    PredictionClass,
    LayerInfo,
    LayerShape,
    ChannelInfo,
    CAMInfo,
    GradCAMInfo,
    GradCAMClassInfo,
    GradCAMOverlayInfo,
    TimingsInfo,
)
from app.core.config import settings

router = APIRouter()


@router.post("/jobs", response_model=JobRecord)
async def create_job(
    image: UploadFile = File(...),
    model_id: str = Form(...),
    top_k: Optional[int] = Form(None),
    cam_layers: Optional[str] = Form(None),
):
    """
    Create a new inference job.
    
    Args:
        image: Image file to process
        model_id: Model identifier from registry
        top_k: Number of top classes for Grad-CAM (default: 3, range: 1-5)
        cam_layers: Comma-separated layer names for Grad-CAM (default: "conv1,layer1,layer2,layer3,layer4")
        
    Returns:
        JobRecord with job_id and status
    """
    # Validate image file
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate model_id exists in registry
    model_config = get_model_config(model_id)
    if model_config is None:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found in registry")
    
    # Read image bytes
    try:
        image_bytes = await image.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Image file is empty")
        
        # Validate file size (convert MB to bytes)
        max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(image_bytes) > max_size_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"Image file too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB}MB"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading image file: {str(e)}")
    
    # Parse and validate top_k
    if top_k is None:
        top_k = 3
    elif top_k < 1 or top_k > 5:
        raise HTTPException(status_code=400, detail="top_k must be between 1 and 5")
    
    # Parse and validate cam_layers
    if cam_layers is None:
        cam_layers_list = ["conv1", "layer1", "layer2", "layer3", "layer4"]
    else:
        cam_layers_list = [layer.strip() for layer in cam_layers.split(",") if layer.strip()]
        if not cam_layers_list:
            raise HTTPException(status_code=400, detail="cam_layers must contain at least one layer")
    
    # Create job
    job_id = await job_service.create_job(model_id, image_bytes, top_k=top_k, cam_layers=cam_layers_list)
    
    # Return job record
    job = await job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=500, detail="Failed to create job")
    
    return job


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """
    Get job status and results.
    
    Args:
        job_id: Unique job identifier
        
    Returns:
        JobRecord for non-succeeded jobs, JobResultResponse for succeeded jobs
    """
    job = await job_service.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    
    # If job is not succeeded, return JobRecord as-is
    if job.status != JobStatus.SUCCEEDED or job.result is None:
        return job
    
    # Transform to JobResultResponse for succeeded jobs
    result = job.result
    
    # Get model config
    model_config = get_model_config(job.model_id)
    model_display_name = model_config.get("display_name", job.model_id) if model_config else job.model_id
    
    # Build prediction info
    prediction_data = result.prediction if result.prediction else {}
    topk_data = prediction_data.get("topk", [])
    prediction_classes = [
        PredictionClass(
            class_id=item["class_id"],
            class_name=item["class_name"],
            prob=item["prob"],
        )
        for item in topk_data
    ]
    
    # Build layers info
    layers_list = []
    for layer_data in result.layers_metadata:
        top_channels = [
            ChannelInfo(
                channel=ch["channel"],
                mean=ch["mean"],
                max=ch["max"],
                image_url=ch["image_url"],
            )
            for ch in layer_data["top_channels"]
        ]
        layers_list.append(
            LayerInfo(
                name=layer_data["name"],
                stage=layer_data.get("stage"),
                shape=LayerShape(
                    c=layer_data["shape"]["c"],
                    h=layer_data["shape"]["h"],
                    w=layer_data["shape"]["w"],
                ),
                top_channels=top_channels,
            )
        )
    
    # Build CAMs info (legacy format)
    cams_data = result.assets_manifest.get("cams", [])
    cams_list = [
        CAMInfo(
            class_id=item["class_id"],
            class_name=item["class_name"],
            prob=item["prob"],
            overlay_url=item["overlay_url"],
        )
        for item in cams_data
    ]
    
    # Build Grad-CAM info (multi-layer format)
    gradcam_data = result.assets_manifest.get("gradcam")
    gradcam_info = None
    if gradcam_data:
        classes_list = []
        for class_data in gradcam_data.get("classes", []):
            overlays_list = [
                GradCAMOverlayInfo(
                    layer=overlay["layer"],
                    url=overlay["url"],
                )
                for overlay in class_data.get("overlays", [])
            ]
            classes_list.append(
                GradCAMClassInfo(
                    class_id=class_data["class_id"],
                    class_name=class_data["class_name"],
                    prob=class_data["prob"],
                    overlays=overlays_list,
                )
            )
        gradcam_info = GradCAMInfo(
            top_k=gradcam_data.get("top_k", 3),
            classes=classes_list,
            layers=gradcam_data.get("layers", []),
            warnings=gradcam_data.get("warnings"),
        )
    
    # Build timings
    timings_data = result.timings
    timings = TimingsInfo(
        preprocess_ms=timings_data.get("preprocess_ms", 0.0),
        forward_ms=timings_data.get("forward_ms", 0.0),
        serialize_ms=timings_data.get("serialize_ms", 0.0),
        total_ms=timings_data.get("total_ms", 0.0),
    )
    
    # Build response
    response = JobResultResponse(
        job_id=job.job_id,
        status=JobStatus.SUCCEEDED,
        model=ModelInfo(id=job.model_id, display_name=model_display_name),
        input=InputInfo(image_url=f"/static/{job_id}/input.png"),
        prediction=PredictionInfo(topk=prediction_classes),
        layers=layers_list,
        cams=cams_list,
        gradcam=gradcam_info,
        timings=timings,
    )
    
    return response


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Health status
    """
    return {"status": "ok"}


@router.get("/models", response_model=List[Dict[str, Any]])
async def get_models():
    """
    Get list of available models from the registry.
    
    Returns:
        List of model configurations with id, display_name, and input_size
    """
    models = list_models()
    return models


@router.get("/models/{model_id}", response_model=Dict[str, Any])
async def get_model(model_id: str):
    """
    Get full configuration for a specific model.
    
    Args:
        model_id: Model identifier
        
    Returns:
        Full model configuration including normalization and layers_to_hook
        
    Raises:
        HTTPException: If model not found
    """
    model_config = get_model_config(model_id)
    if model_config is None:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")
    return model_config

