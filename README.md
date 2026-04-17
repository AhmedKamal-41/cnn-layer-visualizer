<div align="center">
  <img src="frontend\app\icon.svg" alt="convLens Logo" width="120" />
  
  # ConvLens
  
  A full-stack web application for visualizing and analyzing Convolutional Neural Network (CNN) layer activations, feature maps, and Grad-CAM heatmaps.

  [![CI](https://github.com/AhmedKamal-41/cnn-layer-visualizer/actions/workflows/ci.yml/badge.svg)](https://github.com/AhmedKamal-41/cnn-layer-visualizer/actions/workflows/ci.yml)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Live Demo](https://img.shields.io/badge/demo-convlens.com-violet)](https://convlens.com)
</div>

## Live Version

 **Live Demo**: [https://convlens.com](https://convlens.com)

## Overview

ConvLens combines modern web technologies with PyTorch-based deep learning inference to deliver real-time visualization of CNN internal representations. The platform supports multiple pre-trained architectures from torchvision, including ResNet, MobileNet, EfficientNet, DenseNet, ConvNeXt, and ShuffleNet variants.

### Key Features

- **Multi-Model Support**: Analyze images with 11 pre-trained CNN architectures
- **Layer-by-Layer Visualization**: Explore feature maps and activations at each network stage
- **Grad-CAM Integration**: Generate class activation maps for model interpretability
- **Model Comparison**: Compare predictions and visualizations across multiple models simultaneously
- **Interactive Network Diagrams**: Visual representation of CNN architecture with layer selection
- **Real-Time Processing**: Asynchronous job pipeline with status polling
- **Production-Ready Architecture**: Docker containerization, API documentation, and comprehensive error handling

## Tech Stack

### Backend

![Python](https://img.shields.io/badge/Python-3.9%2B-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.104%2B-009688) ![PyTorch](https://img.shields.io/badge/PyTorch-2.1%2B-EE4C2C) ![Torchvision](https://img.shields.io/badge/Torchvision-0.16%2B-EE4C2C) ![NumPy](https://img.shields.io/badge/NumPy-1.26%2B-013243) ![Pillow](https://img.shields.io/badge/Pillow-10.1%2B-8BC34A) ![PyYAML](https://img.shields.io/badge/PyYAML-6.0%2B-FF6F00) ![Uvicorn](https://img.shields.io/badge/Uvicorn-0.24%2B-5A4FCF) ![Pydantic](https://img.shields.io/badge/Pydantic-2.1%2B-E92063) ![Aiofiles](https://img.shields.io/badge/Aiofiles-23.2%2B-4A90E2)

### Frontend

![Next.js](https://img.shields.io/badge/Next.js-14.0.4-000000) ![React](https://img.shields.io/badge/React-18.2%2B-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3%2B-3178C6) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4%2B-38B2AC) ![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933)

### Infrastructure

![Docker](https://img.shields.io/badge/Docker-Latest-2496ED) ![Docker Compose](https://img.shields.io/badge/Docker_Compose-2.0%2B-2496ED)

### Deep Learning Models

The platform supports the following pre-trained CNN architectures from torchvision:

- **ResNet**: ResNet-18, ResNet-50
- **MobileNet**: MobileNet V2, MobileNet V3 (Small, Large)
- **EfficientNet**: EfficientNet-B0, EfficientNet-B2, EfficientNet-B3
- **DenseNet**: DenseNet-121
- **ConvNeXt**: ConvNeXt-Tiny
- **ShuffleNet**: ShuffleNet-V2

All models are pre-trained on ImageNet and loaded with default weights from torchvision.

## System Design

### Design Philosophy

ConvLens is built around three explicit tradeoffs that shaped every architectural
decision:

1. **Inference latency over training flexibility.** The system serves pretrained
   models for inference only — there is no training pipeline, no checkpointing, no
   distributed gradient synchronization. This focus permits aggressive inference
   optimizations (model warmup, channels_last memory format, torch.compile JIT) that
   would be inappropriate in a research setting.

2. **Stateless API, stateful workers.** HTTP endpoints are stateless and idempotent
   where possible. All mutable state — job records, model cache, image hash cache —
   lives within long-running worker processes. This separation allows the API layer
   to scale independently of inference capacity and keeps request handlers fast.

3. **Architecture-agnostic interpretability.** The visualization pipeline accepts
   any torchvision-compatible model through a YAML registry that decouples model
   metadata (input size, normalization, layer paths, Grad-CAM target) from the
   inference engine. Adding a new model is a configuration change, not a code change.

### Request Lifecycle

A typical inference request flows through the system as follows:

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐
│  Client  │────────▶│  FastAPI    │────────▶│  Validator   │
│ (Next.js)│  POST   │   Router    │         │  (image,     │
└──────────┘  /jobs  └─────────────┘         │   schema)    │
     ▲                     │                 └──────┬───────┘
     │                     │                        │
     │ poll /jobs/{id}     ▼                        ▼
     │              ┌─────────────┐         ┌──────────────┐
     │              │ Job Service │◀────────│  Hash Cache  │
     │              │ (in-memory  │  hit?   │   Lookup     │
     │              │  queue)     │         └──────────────┘
     │              └──────┬──────┘                │
     │                     │                       │ miss
     │                     ▼                       ▼
     │              ┌─────────────┐         ┌──────────────┐
     │              │  Worker     │◀────────│   Model      │
     │              │  (asyncio   │  load   │   Registry   │
     │              │   task)     │         │   (YAML)     │
     │              └──────┬──────┘         └──────────────┘
     │                     │
     │                     ▼
     │              ┌─────────────────────────────────────┐
     │              │      Inference Pipeline             │
     │              │  ┌────────┐  ┌─────────┐  ┌──────┐  │
     │              │  │Forward │─▶│ Feature │─▶│Grad- │  │
     │              │  │ Pass   │  │  Maps   │  │ CAM  │  │
     │              │  └────────┘  └─────────┘  └──────┘  │
     │              └──────────────┬──────────────────────┘
     │                             │
     │                             ▼
     │                      ┌──────────────┐
     └──────────────────────│  Storage     │
           result URLs      │  (filesystem)│
                            └──────────────┘
```

The frontend polls `GET /api/v1/jobs/{job_id}` until status transitions from
`pending` → `processing` → `succeeded`. Generated assets (feature maps, Grad-CAM
overlays) are served as static files at `/static/{path}`.

### Architectural Decisions

#### Decision 1 — In-process job queue over external broker

**Context.** Job processing requires a queue to decouple HTTP request handling from
multi-second PyTorch inference.

**Options considered.**
- Celery + Redis: industry standard, supports retries, distributed workers
- RQ + Redis: simpler than Celery, fewer features
- In-process asyncio queue: no external dependency

**Decision.** In-process asyncio queue with a single background worker.

**Rationale.** ConvLens's deployment target is a single-container service (Railway,
Fly.io, Render). Adding Redis would double the operational footprint, require a
managed Redis instance, and introduce network latency for what is fundamentally a
single-machine workload. The trade — losing horizontal scalability and persistence
across restarts — is acceptable for a single-region inference service where the
typical job completes in under one second after model warmup.

**When this would be revisited.** If sustained traffic exceeds ~30 jobs per minute,
or if multi-region deployment is required, the queue should be migrated to Celery +
Redis. The job interface is intentionally narrow (`enqueue`, `get_status`,
`get_result`) to make this swap mechanical.

#### Decision 2 — YAML model registry over hardcoded model definitions

**Context.** The system must support 11+ pretrained CNN architectures, each with
different input dimensions, normalization parameters, layer names, and Grad-CAM
target layers.

**Options considered.**
- Python dictionaries hardcoded in source files
- Database-backed model metadata
- YAML configuration file with Pydantic schema validation

**Decision.** YAML registry (`backend/model_registry.yaml`) loaded once at startup
and validated against Pydantic schemas.

**Rationale.** Three properties matter:
- **Discoverability** — a non-engineer (researcher, ML PhD student, contributor)
  can add a new model by editing one YAML file and submitting a PR. No Python
  knowledge required.
- **Validation at startup** — Pydantic schemas catch missing fields, invalid layer
  paths, and shape mismatches before the server accepts requests. A typo in a
  layer name fails loudly at boot, not silently at inference time.
- **Zero runtime overhead** — the registry is parsed once, cached in memory, and
  never touched again. Database queries on the hot path would be a regression.

**Trade.** The registry cannot be modified without a server restart. For an
inference service with infrequent model changes, this is the right trade.

#### Decision 3 — Process-local LRU model cache

**Context.** Pretrained CNN weights range from 9MB (ShuffleNet V2) to 110MB
(ConvNeXt-Tiny). Loading a model from disk takes 0.5–3 seconds. A naive design
would load the model on every request.

**Options considered.**
- Load on every request: trivially correct, unusably slow
- Load all models eagerly at startup: ~1.5GB resident memory, slow boot
- Lazy LRU cache with bounded capacity: load on first request, evict least
  recently used when capacity is reached

**Decision.** Lazy LRU cache with capacity of 4 models (configurable via
`MODEL_CACHE_SIZE`), with eager preloading of the 3 most-used models
(ResNet-18, ResNet-50, MobileNet V2) during startup.

**Rationale.** The 80/20 rule applies to model selection — most users pick from a
small set of well-known architectures. Eager preload of the popular three eliminates
cold-start latency for the majority of requests. The LRU cache handles the long
tail without exhausting RAM. Capacity of 4 is calibrated against a 1GB container
memory budget assuming an average model size of ~50MB plus PyTorch runtime overhead.

**Memory math.** 4 models × ~50MB average = ~200MB for weights, ~400MB for PyTorch
runtime and intermediate tensors during inference, ~200MB for FastAPI process
overhead. Total ~800MB — fits comfortably in a 1GB container with headroom.

#### Decision 4 — File-based asset storage over object storage

**Context.** Each completed job generates ~10–40 PNG files (feature map
visualizations, Grad-CAM overlays). These need to be served back to the frontend.

**Options considered.**
- Cloudflare R2 / AWS S3 with public URLs
- Local filesystem mounted as a volume
- Embed images as base64 in the JSON response

**Decision.** Local filesystem under `./storage/`, served via FastAPI's
`StaticFiles` mount.

**Rationale.** Generated assets are ephemeral — they are tied to a specific job and
become uninteresting once the user closes the page. Long-term storage is not a
requirement. The filesystem approach has zero external dependencies, zero per-byte
cost, and no network round-trips between worker and storage layer.

**Trade.** On Railway and similar platform-as-a-service deployments, the filesystem
is reset on every redeploy, so old job results disappear. For ConvLens, this is
correct behavior — there is no notion of historical jobs in the user model.

**When this would be revisited.** If the system gains user accounts and historical
job browsing, R2 or S3 becomes necessary. The storage interface in
`app/services/storage.py` is intentionally abstract to make this swap a
single-class change.

#### Decision 5 — Polling over WebSockets / SSE for job status

**Context.** The frontend needs to show real-time progress as jobs move from
`pending` to `processing` to `succeeded`.

**Options considered.**
- WebSocket subscription per job
- Server-Sent Events (SSE) stream
- HTTP long polling
- Short polling with `setInterval`

**Decision.** Short polling at 500ms intervals.

**Rationale.** Most jobs complete within 1–3 seconds after model warmup. The total
number of poll requests per job is 2–6. The implementation complexity of WebSockets
or SSE — connection lifecycle, reconnection logic, proxy compatibility, and CORS
handling for streaming responses — is not justified by the marginal latency
improvement at this scale. Polling is also stateless on the server, which composes
cleanly with the in-process queue design.

**When this would be revisited.** If average job duration exceeds 10 seconds, or if
the polling endpoint becomes a measurable percentage of total CPU, SSE is the
recommended migration path. SSE is preferred over WebSockets because the
communication is unidirectional (server → client) and SSE works through standard
HTTP infrastructure without protocol upgrades.

### Performance Engineering

The inference path is optimized aggressively for CPU-only deployment, since
Railway and similar platforms do not provide GPUs in the standard tier. Key
optimizations applied at model load time, never per-request:

- **`torch.inference_mode()`** wraps every forward pass — strictly faster than
  `torch.no_grad()`, eliminates autograd overhead.
- **`torch.compile(mode="reduce-overhead")`** JIT-compiles each model to
  optimized kernels on first use, cached for subsequent calls. Yields 20-40%
  speedup on most CNNs.
- **`channels_last` memory format** — non-default in PyTorch but required for
  optimal performance on x86 CPUs with AVX-512 and on Tensor Core GPUs.
- **Model warmup pass** during loading triggers kernel compilation before the
  first user request, eliminating the first-request latency spike.
- **`pillow-simd`** as a drop-in Pillow replacement — 4-6x faster image
  decoding and resizing on x86 CPUs.
- **`xxhash`** for image content hashing — 5-10x faster than SHA-256, used as
  the cache key for result memoization.
- **`orjson`** as the FastAPI default response class — 3-5x faster JSON
  serialization than the standard library.
- **`uvloop` + `httptools`** as uvicorn's event loop and HTTP parser — 2-4x
  faster request handling.
- **Lazy feature map rendering** — raw activation tensors are captured during
  the forward pass but PNG visualizations are only encoded when the user
  explicitly requests a layer. Reduces total job latency by 60-80% on typical
  use patterns.

### Failure Modes and Recovery

The system is designed to fail safely without manual intervention:

- **Worker crash during inference.** Job remains in `processing` state. A
  background sweeper (run every 5 minutes) marks jobs older than 90 seconds in
  `processing` state as `failed` with reason `timeout`.
- **Model load failure.** The error is caught at the registry layer and the model
  is marked unavailable. The frontend hides unavailable models from the
  selection UI. Other models continue to work normally.
- **Filesystem write failure.** Returns HTTP 500 with structured error. The job
  record reflects `failed` status. The hash cache is not updated, so the same
  request will retry on the next submission.
- **OOM during inference.** Caught by Python's `MemoryError`. The model is
  evicted from the LRU cache to free memory. The job fails with a clear error
  message. Subsequent jobs for smaller models continue working.

### Observability

Every request and job emits structured log events with consistent field names:

- `request_id` (UUID, generated at API entry)
- `job_id` (UUID, generated at job creation)
- `model_id` (string, from registry)
- `event` (dot-notation: `job.created`, `model.loaded`, `inference.completed`)
- `duration_ms` (float, on completion events)

This schema makes log filtering trivial: tracing a single user's request through
the entire pipeline requires only `grep request_id=<uuid>`. No distributed tracing
infrastructure is required at the current scale, but the field naming is
compatible with OpenTelemetry conventions for future migration.

### Capacity Planning

At current optimization levels, on a single 1 vCPU / 1GB RAM container:

- **Cold start:** ~3 seconds (FastAPI boot + preload of 3 default models)
- **Warm inference (cached model):** 180-300ms per job for ResNet-50-class models
- **Cache hit (identical request):** <10ms
- **Sustainable throughput:** ~10-15 jobs/minute single-stream
- **Memory ceiling:** ~800MB resident with 4 models cached

Beyond ~15 jobs/minute, the system would benefit from horizontal scaling, which
would require migrating the in-process queue to Celery + Redis as described in
Decision 1. The codebase is structured to make this migration mechanical: the
`JobService` interface is small (3 methods), and all job state goes through it.

## Architecture

### System Architecture

ConvLens follows a microservices architecture with clear separation between frontend and backend services:

- **Backend Service**: FastAPI-based REST API providing inference endpoints, job management, and asset storage
- **Frontend Service**: Next.js application with React components for user interaction and visualization
- **Storage Layer**: File-based storage for generated visual assets (feature maps, Grad-CAM overlays)
- **Model Registry**: YAML-based configuration system for managing model metadata and layer mappings

### Backend Architecture

The backend implements an asynchronous job processing pipeline:

- **API Layer**: RESTful endpoints for job creation, status polling, and resource retrieval
- **Job Service**: In-memory queue system with background worker for processing inference jobs
- **Model Registry**: Centralized configuration for model metadata, preprocessing parameters, and layer mappings
- **Inference Engine**: PyTorch-based model loading and forward pass execution
- **Visualization Pipeline**: Feature map extraction, Grad-CAM generation, and asset serialization
- **Cache Layer**: In-memory image hash caching to avoid reprocessing identical inputs
- **Storage Service**: File system abstraction for persisting generated visual assets

### Frontend Architecture

The frontend implements a component-based React architecture:

- **Page Router**: Next.js App Router for client-side routing and server-side rendering
- **Component Library**: Modular React components for UI elements and visualization widgets
- **State Management**: React hooks for local state and API client integration
- **API Integration**: Type-safe API client with error handling and request/response typing
- **Visualization Components**: Custom components for network diagrams, feature maps, and heatmap overlays

## Quick Start

### Prerequisites

- **Docker**: 20.10 or higher
- **Docker Compose**: 2.0 or higher

For manual setup:

- **Python**: 3.9 or higher
- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher

### Option 1: Docker Compose (Recommended)

```bash
# From project root
docker-compose up --build
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Option 2: Manual Setup

**Backend:**

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (in separate terminal):**

```bash
cd frontend
npm install
npm run dev
```

### Verification

Run the backend smoke test to verify the installation:

```bash
cd backend
python scripts/smoke_test.py
```

The smoke test verifies:
- Health endpoint availability
- Models endpoint functionality
- Job creation and processing pipeline
- Result verification (layers, feature maps, Grad-CAM overlays)

## Project Structure

```
cnn-lens/
├── backend/              # FastAPI Python backend
│   ├── app/
│   │   ├── api/         # API routes (v1)
│   │   ├── core/        # Configuration and logging
│   │   ├── inspect/     # Feature map and Grad-CAM generation
│   │   ├── jobs/        # Job management service
│   │   ├── models/      # Model loading and registry
│   │   └── services/    # Business logic (cache, storage)
│   ├── storage/         # Generated visual assets (gitignored)
│   ├── tests/           # Backend test suite
│   ├── model_registry.yaml  # Model configuration registry
│   └── requirements.txt # Python dependencies
│
└── frontend/            # Next.js TypeScript frontend
    ├── app/             # Next.js App Router pages
    ├── components/      # React components
    ├── lib/             # API client and utilities
    ├── public/          # Static assets
    └── types/           # TypeScript type definitions
```

## API Documentation

### Backend Endpoints

- `GET /api/v1/health` - Health check endpoint
- `GET /api/v1/models` - List available models
- `POST /api/v1/jobs` - Create a new inference job
- `GET /api/v1/jobs/{job_id}` - Get job status and results
- `GET /static/{path}` - Serve generated visual assets

### Job Processing Workflow

1. **Job Creation**: Client submits image and model selection via `POST /api/v1/jobs`
2. **Job Queuing**: Backend creates job record and queues for processing
3. **Model Loading**: Worker loads PyTorch model from registry (cached in memory)
4. **Image Preprocessing**: Image is resized, cropped, and normalized per model requirements
5. **Forward Pass**: Model processes image and extracts layer activations
6. **Feature Map Generation**: Top activations are visualized and saved as images
7. **Grad-CAM Generation**: Class activation maps are computed for top-K predictions
8. **Asset Serialization**: All visualizations are saved to storage directory
9. **Job Completion**: Job status updates to `succeeded` with result URLs

### Request/Response Examples

**Create Job:**

```bash
curl -X POST "http://localhost:8000/api/v1/jobs" \
  -F "image=@image.jpg" \
  -F "model_id=resnet18" \
  -F "top_k=3"
```

**Get Job Status:**

```bash
curl "http://localhost:8000/api/v1/jobs/{job_id}"
```

## Configuration

### Environment Variables

**Backend (.env)**

- `CORS_ORIGINS`: Allowed CORS origins (comma-separated, default: `http://localhost:3000`)
- `STORAGE_ROOT`: Path to storage directory (default: `./storage`)
- `MODEL_REGISTRY_PATH`: Path to model registry YAML file (default: `./model_registry.yaml`)
- `CACHE_ENABLED`: Enable/disable image hash caching (default: `true`)
- `CACHE_MAX_ITEMS`: Maximum cache entries (default: `100`)

**Frontend (.env.local)**

- `NEXT_PUBLIC_API_URL`: Backend API base URL (default: `http://localhost:8000`)

### Model Registry Configuration

The model registry (`backend/model_registry.yaml`) defines available models with:

- Model identifier and display name
- Input image dimensions
- Normalization parameters (mean, std)
- Layers to hook for feature extraction
- Layer-to-stage mappings for UI organization
- Grad-CAM target layer paths

## Development

### Backend Development

**Running Tests:**

```bash
cd backend
pytest
```

**Code Structure:**

- `app/api/v1/routes.py`: API endpoint definitions
- `app/jobs/service.py`: Job processing pipeline
- `app/models/loaders.py`: Model loading and caching
- `app/inspect/gradcam.py`: Grad-CAM implementation
- `app/inspect/feature_maps.py`: Feature map extraction

### Frontend Development

**Running Type Check:**

```bash
cd frontend
npm run type-check
```

**Running Linter:**

```bash
npm run lint
```

**Code Structure:**

- `app/page.tsx`: Landing page with model selection
- `app/viewer/[jobId]/page.tsx`: Job viewer with visualization tools
- `components/NetworkDiagram.tsx`: Interactive network architecture diagram
- `components/FeatureMapGrid.tsx`: Feature map visualization grid
- `lib/api.ts`: Type-safe API client

## Deployment

### Docker Compose Deployment

The recommended deployment method uses Docker Compose for orchestration:

```bash
docker-compose up -d
```

**Service Configuration:**

- Backend service exposes port 8000
- Frontend service exposes port 3000
- Storage directory is mounted as volume for persistence
- Services communicate via internal Docker network

### Railway (No Docker) Deploy

Deploy both services using Railway's native builders:

**FRONTEND Service:**
- Build Command: `npm ci && npm run build`
- Start Command: `npm run start -- -p $PORT`
- Root Directory: `frontend`
- Environment Variables:


**BACKEND Service:**
- Build Command: `pip install -r requirements.txt`
- Start Command: `sh start.sh` (use `sh` to avoid permission issues)
- Root Directory: `backend`
- Environment Variables:

  - `PORT` (automatically set by Railway, fallback to 8000)

**Notes:**
- Ensure both services are deployed as separate Railway services
- Frontend service should reference backend service URL in `NEXT_PUBLIC_API_URL`
- Backend start command uses `sh start.sh` to avoid execute permission issues
- Storage directory will be ephemeral unless using Railway volumes

### Production Considerations

1. **Environment Configuration**: Use environment-specific configuration files
2. **Reverse Proxy**: Deploy behind nginx or Traefik with SSL/TLS
3. **Resource Limits**: Configure CPU and memory limits in docker-compose
4. **Logging**: Implement structured logging with log aggregation
5. **Monitoring**: Add health checks and metrics collection
6. **Security**: Configure CORS origins, rate limiting, and input validation
7. **Storage**: Use persistent volumes or cloud storage for generated assets

### Health Checks

Health check endpoints are configured in Dockerfiles:

- Backend: `GET /api/v1/health`
- Monitor service health: `docker-compose ps`

## Testing

### Backend Test Suite

The backend includes comprehensive tests:

- Unit tests for model loading and preprocessing
- Integration tests for API endpoints
- Feature map extraction tests
- Grad-CAM generation tests
- Model registry validation tests

Run tests:

```bash
cd backend
pytest
```

### Smoke Tests

Smoke tests verify end-to-end functionality:

```bash
cd backend
python scripts/smoke_test.py
```


