# Backend Dockerfile for ConvLens API
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
RUN echo "=== Verifying copied files ===" && \
    echo "Contents of /app/app/:" && \
    ls -la /app/app/ && \
    echo "" && \
    echo "Checking for assets directory:" && \
    if [ -d /app/app/assets ]; then \
        echo "✓ Assets directory exists"; \
        ls -la /app/app/assets/ || true; \
    else \
        echo "✗ Assets directory NOT found"; \
    fi && \
    echo "" && \
    echo "Checking for imagenet_class_index.json:" && \
    if [ -f /app/app/assets/imagenet_class_index.json ]; then \
        echo "✓ imagenet_class_index.json found"; \
        ls -lh /app/app/assets/imagenet_class_index.json; \
    else \
        echo "✗ imagenet_class_index.json NOT found"; \
        echo "Searching entire /app for the file:"; \
        find /app -name "imagenet_class_index.json" 2>/dev/null || echo "File not found anywhere"; \
        exit 1; \
    fi
COPY model_registry.yaml .

COPY start.sh ./

RUN mkdir -p /app/storage && chmod 755 /app/storage

RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app && \
    chmod +x /app/start.sh

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD sh -c 'python -c "import os; import urllib.request; port = os.getenv(\"PORT\", \"8000\"); urllib.request.urlopen(f\"http://localhost:{port}/api/v1/health\")"'

CMD ["./start.sh"]
