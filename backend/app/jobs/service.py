"""Job service for managing inference jobs."""

import asyncio
import logging
import time
import uuid
from pathlib import Path
from typing import Dict, Optional, List, Tuple
import io

import torch
import torch.nn.functional as F
from PIL import Image

from app.core.config import settings
from app.jobs.models import JobRecord, JobStatus, JobResult
from app.models.loaders import load_model, preprocess_image
from app.models.registry import get_model_config
from app.models.layer_mapping import get_default_cam_layers, get_cam_target_path
from app.inspect.hooks import capture_activations
from app.inspect.feature_maps import save_feature_maps
from app.inspect.gradcam import generate_gradcam_topk, generate_gradcam_multilayer
from app.services.cache import cache_service

logger = logging.getLogger("app.jobs.service")


class JobService:
    """Service for managing inference jobs."""
    
    def __init__(self):
        """Initialize job service."""
        self._jobs: Dict[str, JobRecord] = {}
        self._job_data: Dict[str, bytes] = {}  # Store image_bytes for each job
        self._job_params: Dict[str, Tuple[int, List[str]]] = {}  # Store (top_k, cam_layers) for each job
        self._job_queue: asyncio.Queue[str] = asyncio.Queue()
        self._lock: asyncio.Lock = asyncio.Lock()
        self._worker_task: Optional[asyncio.Task] = None
        self._worker_running: bool = False
    
    async def create_job(self, model_id: str, image_bytes: bytes, top_k: int = 3, cam_layers: Optional[List[str]] = None) -> str:
        """
        Create a new inference job.
        
        Checks cache first - if cached result exists, returns immediate SUCCEEDED job.
        Otherwise, creates new job and queues for processing.
        
        Args:
            model_id: Model identifier from registry
            image_bytes: Image file bytes
            top_k: Number of top classes for Grad-CAM (default: 3)
            cam_layers: List of layer names for Grad-CAM (default: None, uses default layers)
            
        Returns:
            Job ID (UUID string)
        """
        # Default cam_layers if None - use model-specific defaults from registry
        if cam_layers is None:
            cam_layers = get_default_cam_layers(model_id)
            if not cam_layers:
                raise ValueError(f"No default CAM layers found for model '{model_id}'")
        
        # Check cache first (if enabled)
        if settings.CACHE_ENABLED:
            cache_key = cache_service.compute_cache_key(image_bytes, model_id, top_k=top_k, cam_layers=cam_layers)
            cached_result = cache_service.get(cache_key)
            
            if cached_result is not None:
                # Cache hit: create job with SUCCEEDED status immediately
                job_id = str(uuid.uuid4())
                async with self._lock:
                    job_record = JobRecord(
                        job_id=job_id,
                        model_id=model_id,
                        status=JobStatus.SUCCEEDED,
                        progress=100,
                        message="Job completed (cached)",
                        result=cached_result,
                    )
                    self._jobs[job_id] = job_record
                
                logger.info(f"Created job {job_id} for model {model_id} (cache hit)")
                return job_id
        
        # Cache miss: create new job and queue for processing
        job_id = str(uuid.uuid4())
        
        async with self._lock:
            job_record = JobRecord(
                job_id=job_id,
                model_id=model_id,
                status=JobStatus.QUEUED,
                progress=0,
                message="Job queued",
            )
            
            self._jobs[job_id] = job_record
            self._job_data[job_id] = image_bytes
            self._job_params[job_id] = (top_k, cam_layers)
        
        await self._job_queue.put(job_id)
        
        logger.info(f"Created job {job_id} for model {model_id} (cache miss)")
        return job_id
    
    async def get_job(self, job_id: str) -> Optional[JobRecord]:
        """
        Get job record by ID.
        
        Args:
            job_id: Unique job identifier
            
        Returns:
            JobRecord if found, None otherwise
        """
        async with self._lock:
            return self._jobs.get(job_id)
    
    async def _update_job_progress(
        self,
        job_id: str,
        progress: int,
        message: Optional[str] = None,
        status: Optional[JobStatus] = None,
    ) -> None:
        """Update job progress and status."""
        async with self._lock:
            job = self._jobs.get(job_id)
            if job:
                job.progress = progress
                if message:
                    job.message = message
                if status:
                    job.status = status
    
    async def process_job(self, job_id: str) -> None:
        """
        Process a job through all steps with progress updates.
        
        Args:
            job_id: Unique job identifier
        """
        start_time = time.time()
        
        try:
            # Get job, image data, and params
            async with self._lock:
                job = self._jobs.get(job_id)
                image_bytes = self._job_data.get(job_id)
                job_params = self._job_params.get(job_id)
            
            if not job:
                logger.error(f"Job {job_id} not found in storage")
                return
            
            if not image_bytes:
                logger.error(f"Image data not found for job {job_id}")
                await self._update_job_progress(
                    job_id,
                    progress=0,
                    message="Error: Image data not found",
                    status=JobStatus.FAILED,
                )
                return
            
            # Extract model_id for use in defaults
            model_id = job.model_id
            
            # Get params (defaults if not found)
            if job_params:
                top_k, cam_layers = job_params
            else:
                top_k = 3
                # Use model-specific defaults from registry
                cam_layers = get_default_cam_layers(model_id)
                if not cam_layers:
                    logger.warning(f"No default CAM layers found for model '{model_id}', using empty list")
                    cam_layers = []
            
            # Update status to RUNNING
            await self._update_job_progress(
                job_id,
                progress=0,
                message="Starting processing",
                status=JobStatus.RUNNING,
            )
            logger.info(f"Started processing job {job_id}")
            
            storage_dir = settings.STORAGE_DIR
            
            # Store image_bytes for cache key generation later
            # (needed before it's popped in finally block)
            
            # Save original image
            image_path = storage_dir / job_id / "input.png"
            image_path.parent.mkdir(parents=True, exist_ok=True)
            with open(image_path, "wb") as f:
                f.write(image_bytes)
            
            # Load original image for visualization
            original_image = Image.open(io.BytesIO(image_bytes))
            if original_image.mode != "RGB":
                original_image = original_image.convert("RGB")
            
            # Step 1: Load model (progress: 10%)
            model_load_start = time.time()
            await self._update_job_progress(job_id, progress=10, message="Loading model")
            model = load_model(model_id)
            model_load_time = (time.time() - model_load_start) * 1000  # Convert to ms
            logger.info(f"Job {job_id}: Model loaded ({model_load_time:.1f}ms)")
            
            # Step 2: Preprocess (progress: 20%)
            preprocess_start = time.time()
            await self._update_job_progress(job_id, progress=20, message="Preprocessing image")
            input_tensor = preprocess_image(image_bytes, model_id)
            preprocess_time = (time.time() - preprocess_start) * 1000  # Convert to ms
            logger.info(f"Job {job_id}: Image preprocessed ({preprocess_time:.1f}ms)")
            
            # Step 3: Forward pass (progress: 40%)
            forward_start = time.time()
            await self._update_job_progress(job_id, progress=40, message="Running forward pass")
            
            model.eval()
            with torch.no_grad():
                output = model(input_tensor)
            
            # Get top-K predictions (use top_k from job_params, but get at least top-5 for prediction display)
            probs = F.softmax(output, dim=1)
            prediction_top_k = max(top_k, 5)  # Get at least top-5 predictions for display
            top_probs, top_indices = torch.topk(probs[0], k=min(prediction_top_k, probs.shape[1]))
            top_indices = top_indices.cpu().numpy()
            top_probs = top_probs.cpu().numpy()
            
            forward_time = (time.time() - forward_start) * 1000  # Convert to ms
            logger.info(f"Job {job_id}: Forward pass completed ({forward_time:.1f}ms)")
            
            # Step 4: Capture activations and generate feature maps (progress: 60%)
            activation_start = time.time()
            await self._update_job_progress(job_id, progress=60, message="Extracting feature maps")
            
            # Get model config for layers to hook
            model_config = get_model_config(model_id)
            if not model_config:
                raise ValueError(f"Model config not found for {model_id}")
            
            layer_paths = model_config.get("layers_to_hook", [])
            if not layer_paths:
                raise ValueError(f"No layers_to_hook found in model config for {model_id}")
            
            # Capture activations
            activations_dict = capture_activations(model, input_tensor, layer_paths)
            activation_time = (time.time() - activation_start) * 1000  # Convert to ms
            logger.info(f"Job {job_id}: Activations captured ({activation_time:.1f}ms)")
            
            # Get layer_stages mapping from model config
            layer_stages = model_config.get("layer_stages", {})
            
            # Generate feature maps for each layer
            feature_map_start = time.time()
            layers_data = []
            for layer_name in layer_paths:
                if layer_name not in activations_dict:
                    logger.warning(f"Activation not captured for layer {layer_name}")
                    continue
                
                activation_tensor = activations_dict[layer_name]
                # Skip non-4D activations (e.g., fc layer produces 2D tensor)
                if activation_tensor.ndim != 4:
                    logger.info(f"Skipping layer {layer_name}: ndim={activation_tensor.ndim} (expected 4D for feature maps)")
                    continue
                
                # Get shape: [1, C, H, W]
                shape = activation_tensor.shape
                c, h, w = shape[1], shape[2], shape[3]
                
                # Save feature maps
                feature_maps_manifest = save_feature_maps(
                    activation_tensor=activation_tensor,
                    job_id=job_id,
                    layer_name=layer_name,
                    storage_dir=storage_dir,
                    top_k=32,
                )
                
                # Convert to response format
                top_channels = [
                    {
                        "channel": item["channel_index"],
                        "mean": item["mean"],
                        "max": item["max"],
                        "image_url": f"/static/{item['file_path']}",
                    }
                    for item in feature_maps_manifest
                ]
                
                # Get stage for this layer
                stage = layer_stages.get(layer_name)
                
                # Get CAM target path (PyTorch module path for Grad-CAM)
                cam_target_path = get_cam_target_path(layer_name, model_id)
                
                layers_data.append({
                    "name": layer_name,
                    "stage": stage,
                    "shape": {"c": int(c), "h": int(h), "w": int(w)},
                    "top_channels": top_channels,
                    "cam_target_path": cam_target_path,
                })
            
            feature_map_time = (time.time() - feature_map_start) * 1000  # Convert to ms
            logger.info(f"Job {job_id}: Feature maps extracted ({feature_map_time:.1f}ms)")
            
            # Step 5: Generate Grad-CAM (progress: 80%)
            serialize_start = time.time()
            await self._update_job_progress(job_id, progress=80, message="Generating GradCAM visualizations")
            
            # Generate multi-layer Grad-CAM
            gradcam_data = generate_gradcam_multilayer(
                model=model,
                input_tensor=input_tensor,
                original_image=original_image,
                cam_layers=cam_layers,
                job_id=job_id,
                storage_dir=storage_dir,
                top_k=top_k,
                alpha=0.45,
            )
            
            # Generate legacy single-layer CAMs for backward compatibility (use last layer)
            target_layer = layer_paths[-1] if layer_paths else "layer4"
            cams_data = generate_gradcam_topk(
                model=model,
                input_tensor=input_tensor,
                original_image=original_image,
                target_layer=target_layer,
                job_id=job_id,
                storage_dir=storage_dir,
                top_k=top_k,
                alpha=0.45,
            )
            
            # Convert to response format
            cams_list = [
                {
                    "class_id": item["class_id"],
                    "class_name": item["class_name"],
                    "prob": item["prob"],
                    "overlay_url": f"/static/{item['overlay_path']}",
                }
                for item in cams_data
            ]
            
            serialize_time = (time.time() - serialize_start) * 1000  # Convert to ms
            logger.info(f"Job {job_id}: GradCAM visualizations generated ({serialize_time:.1f}ms)")
            
            # Build prediction info
            from app.inspect.gradcam import _get_imagenet_class_name
            prediction_classes = [
                {
                    "class_id": int(class_id),
                    "class_name": _get_imagenet_class_name(int(class_id)),
                    "prob": float(prob),
                }
                for class_id, prob in zip(top_indices, top_probs)
            ]
            
            # Get model display name
            model_config = get_model_config(model_id)
            model_display_name = model_config.get("display_name", model_id) if model_config else model_id
            
            total_time = (time.time() - start_time) * 1000  # Convert to ms
            
            # Create result payload (internal format - will be transformed in API)
            result = JobResult(
                prediction={"topk": prediction_classes},
                layers_metadata=layers_data,
                assets_manifest={
                    "cams": cams_list,  # Legacy format for backward compatibility
                    "gradcam": gradcam_data,  # New multi-layer format
                },
                timings={
                    "preprocess_ms": preprocess_time,
                    "forward_ms": forward_time,
                    "serialize_ms": serialize_time,
                    "total_ms": total_time,
                },
            )
            
            # Update job with result and mark as SUCCEEDED
            async with self._lock:
                job = self._jobs.get(job_id)
                if job:
                    job.status = JobStatus.SUCCEEDED
                    job.progress = 100
                    job.message = "Job completed successfully"
                    job.result = result
            
            # Store result in cache (if enabled)
            if settings.CACHE_ENABLED:
                cache_key = cache_service.compute_cache_key(image_bytes, model_id)
                cache_service.set(cache_key, result)
                logger.debug(f"Cached result for job {job_id}")
            
            logger.info(f"Job {job_id} completed successfully (total: {total_time:.1f}ms)")
            
        except Exception as e:
            # Handle errors and mark job as FAILED
            async with self._lock:
                job = self._jobs.get(job_id)
                if job:
                    job.status = JobStatus.FAILED
                    job.message = f"Job failed: {str(e)}"
                    job.progress = 0
            logger.error(f"Job {job_id} failed: {e}", exc_info=True)
        finally:
            # Clean up image data and params (always runs, success or failure)
            async with self._lock:
                self._job_data.pop(job_id, None)
                self._job_params.pop(job_id, None)
    
    async def _worker_loop(self) -> None:
        """Background worker loop that processes jobs from queue."""
        logger.info("Job worker loop started")
        self._worker_running = True
        
        while self._worker_running:
            try:
                job_id = await self._job_queue.get()
                
                # Check for shutdown signal
                if job_id == "shutdown_signal":
                    break
                
                await self.process_job(job_id)
                self._job_queue.task_done()
                
            except asyncio.CancelledError:
                logger.info("Job worker loop cancelled")
                break
            except Exception as e:
                logger.error(f"Error in worker loop: {e}", exc_info=True)
        
        logger.info("Job worker loop stopped")
    
    async def start_worker(self) -> None:
        """Start the background worker."""
        if self._worker_task is None or self._worker_task.done():
            self._worker_task = asyncio.create_task(self._worker_loop())
            logger.info("Job worker started")
    
    async def stop_worker(self) -> None:
        """Stop the background worker."""
        self._worker_running = False
        
        # Put shutdown signal to unblock queue
        await self._job_queue.put("shutdown_signal")
        
        if self._worker_task and not self._worker_task.done():
            try:
                await asyncio.wait_for(self._worker_task, timeout=5.0)
            except asyncio.TimeoutError:
                logger.warning("Worker did not stop gracefully, cancelling")
                self._worker_task.cancel()
            except asyncio.CancelledError:
                pass
        
        logger.info("Job worker stopped")


# Global job service instance
job_service = JobService()
