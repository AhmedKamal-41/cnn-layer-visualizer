# Backend Dockerfile for ConvLens API
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
# Explicitly copy the ImageNet class index file to ensure it's included
COPY app/assets/imagenet_class_index.json ./app/assets/imagenet_class_index.json
COPY model_registry.yaml .

# Copy startup script
COPY start.sh ./

# Create storage directory with proper permissions
RUN mkdir -p /app/storage && chmod 755 /app/storage

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app && \
    chmod +x /app/start.sh

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check (uses PORT env var with fallback to 8000)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD sh -c 'python -c "import os; import urllib.request; port = os.getenv(\"PORT\", \"8000\"); urllib.request.urlopen(f\"http://localhost:{port}/api/v1/health\")"'

# Run uvicorn via startup script (uses PORT env var with fallback to 8000 for local dev)
CMD ["./start.sh"]

