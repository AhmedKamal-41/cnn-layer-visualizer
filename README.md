# CNN Lens

A full-stack web application for visualizing and analyzing CNN (Convolutional Neural Network) layer activations and feature maps. Upload images to visualize how different CNN layers process and extract features.

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# From project root
docker-compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

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

### Smoke Test

Run the backend smoke test to verify everything works:

```bash
cd backend
# First, create sample image if needed
python scripts/create_sample_image.py
# Run smoke test (requires backend to be running)
python scripts/smoke_test.py
```

The smoke test verifies:
- Health endpoint
- Models endpoint
- Job creation
- Job processing and completion
- Result verification (layers, feature maps, CAM overlays)

## Project Overview

CNN Lens provides an interactive platform to:
- Upload images and select from available CNN models
- Visualize network architecture
- View layer-by-layer feature maps and activations
- Compare activations across different layers
- Analyze CNN behavior with heatmaps and visualizations

## Project Structure

```
cnn-lens/
├── backend/              # FastAPI Python backend
│   ├── app/
│   │   ├── api/         # API routes (v1)
│   │   ├── core/        # Configuration and models
│   │   ├── services/    # Business logic (jobs, inference, cache, storage)
│   │   └── registry/    # Model registry (YAML config)
│   ├── storage/         # Generated visual assets (gitignored)
│   └── requirements.txt # Python dependencies
│
└── frontend/            # Next.js TypeScript frontend
    ├── app/             # Next.js App Router pages
    ├── components/      # React components
    ├── lib/             # API client utilities
    └── types/           # TypeScript type definitions
```

## Backend Setup

### Prerequisites
- Python 3.9 or higher
- pip (Python package manager)

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file from `.env.example` (if available) and configure environment variables:
   ```bash
   # Copy and edit .env.example as needed
   ```

6. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`
   - API documentation: `http://localhost:8000/docs`
   - Alternative docs: `http://localhost:8000/redoc`

### Backend API Endpoints

- `POST /api/v1/jobs` - Create a new inference job
- `GET /api/v1/jobs/{job_id}` - Get job status and results
- `GET /api/v1/health` - Health check endpoint

## Frontend Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the backend API URL:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

### Frontend Pages

- `/` - Home page with image upload and model selection
- `/viewer/[jobId]` - Job viewer page with visualization tools

### Frontend Components

- `ModelSelector` - Dropdown for selecting CNN models
- `UploadDropzone` - Drag-and-drop image upload area
- `JobStatusBanner` - Status display for jobs
- `NetworkGraph` - Visual representation of CNN architecture
- `LayerPicker` - Left panel for selecting layers
- `FeatureMapGrid` - Center canvas showing feature maps
- `HeatmapOverlay` - Overlay component for heatmaps
- `ComparePanel` - Right panel for layer information and comparison

## Docker Deployment

### Prerequisites
- Docker 20.10 or higher
- Docker Compose 2.0 or higher

### Quick Start with Docker Compose

1. Navigate to the project root directory:
   ```bash
   cd cnn-lens
   ```

2. Build and start all services:
   ```bash
   docker-compose up --build
   ```

   This will:
   - Build the backend and frontend Docker images
   - Start both services with proper networking
   - Mount the storage directory for persistence

3. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`

### Docker Compose Commands

- **Start services in background:**
  ```bash
  docker-compose up -d
  ```

- **Stop services:**
  ```bash
  docker-compose down
  ```

- **View logs:**
  ```bash
  # All services
  docker-compose logs -f

  # Specific service
  docker-compose logs -f backend
  docker-compose logs -f frontend
  ```

- **Rebuild after code changes:**
  ```bash
  docker-compose up --build
  ```

- **Stop and remove volumes (cleans storage):**
  ```bash
  docker-compose down -v
  ```

### Building Individual Docker Images

#### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build the image:
   ```bash
   docker build -t cnn-lens-backend .
   ```

3. Run the container:
   ```bash
   docker run -p 8000:8000 \
     -v $(pwd)/storage:/app/storage \
     -e CORS_ORIGINS=http://localhost:3000 \
     cnn-lens-backend
   ```

#### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Build the image:
   ```bash
   docker build -t cnn-lens-frontend \
     --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 .
   ```

3. Run the container:
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_API_URL=http://localhost:8000 \
     cnn-lens-frontend
   ```

### Environment Variables

The `docker-compose.yml` file includes default environment variables. To customize:

1. Create a `.env` file in the project root (optional):
   ```env
   # Backend
   BACKEND_ENV=production
   CORS_ORIGINS=http://localhost:3000
   CACHE_MAX_ITEMS=100

   # Frontend
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2. Or modify environment variables directly in `docker-compose.yml`

### Storage Persistence

The storage directory (`backend/storage`) is mounted as a volume in docker-compose, ensuring that generated visual assets persist across container restarts. The storage directory is created automatically if it doesn't exist.

### Static Assets

- **Backend**: Static files are served from `/static/*` endpoint, mapping to the storage directory
- **Frontend**: Next.js handles static assets automatically

### Production Considerations

For production deployment:

1. **Use environment-specific configuration:**
   - Set `BACKEND_ENV=production`
   - Configure proper `CORS_ORIGINS` for your domain
   - Use secrets management for sensitive data

2. **Reverse Proxy:**
   - Consider using nginx or Traefik as a reverse proxy
   - Configure SSL/TLS certificates
   - Set proper headers for security

3. **Resource Limits:**
   - Add resource limits to docker-compose services:
     ```yaml
     deploy:
       resources:
         limits:
           cpus: '2'
           memory: 4G
     ```

4. **Health Checks:**
   - Health checks are already configured in the Dockerfiles
   - Monitor service health using `docker-compose ps`

5. **Logging:**
   - Consider using Docker logging drivers for production
   - Configure log rotation and retention policies

## Development Notes

### Backend Architecture

- **FastAPI**: Modern Python web framework for building APIs
- **PyTorch**: Deep learning framework for model inference
- **Async Job Pipeline**: In-memory queue system for processing jobs asynchronously
- **Model Registry**: YAML-based configuration for managing available models
- **Image Hash Caching**: In-memory cache to avoid reprocessing identical images
- **Storage Service**: Saves generated visual assets to `backend/storage/{job_id}/`

### Frontend Architecture

- **Next.js 14+**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Component-Based**: Modular React components for UI elements
- **API Client**: fetch() wrapper for backend communication

### Environment Variables

**Backend (.env)**
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `STORAGE_ROOT`: Path to storage directory
- `MODEL_REGISTRY_PATH`: Path to model registry YAML file
- `CACHE_ENABLED`: Enable/disable image hash caching

**Frontend (.env.local)**
- `NEXT_PUBLIC_API_URL`: Backend API base URL

## Future Implementation

This project currently contains placeholder/scaffold code. Future implementation tasks include:

1. **Backend**:
   - Complete async job processing pipeline
   - Implement PyTorch model loading from registry
   - Extract feature maps from model layers
   - Generate visualizations (heatmaps, feature maps)
   - Save visual assets to storage

2. **Frontend**:
   - Connect all components to backend APIs
   - Implement real-time job status polling
   - Render network architecture diagrams
   - Display feature maps and heatmaps
   - Add layer comparison functionality

## License

[Add your license here]

## Contributing

[Add contributing guidelines here]

