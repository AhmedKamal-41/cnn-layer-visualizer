<div align="center">
  <img src="logo.svg" alt="convLens Logo" width="120" />
  
  # ConvLens
  
  A full-stack web application for visualizing and analyzing Convolutional Neural Network (CNN) layer activations, feature maps, and Grad-CAM heatmaps.
</div>

## Live Version

🌐 **Live Demo**: [https://convlens.com](https://convlens.com)

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
