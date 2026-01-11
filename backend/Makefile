.PHONY: help install dev test lint format clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install Python dependencies
	pip install -r requirements.txt

install-dev: ## Install Python dependencies including dev tools
	pip install -r requirements.txt
	pip install pytest pytest-asyncio black flake8 mypy

dev: ## Run FastAPI server with uvicorn in development mode
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test: ## Run tests with pytest
	pytest -v

test-coverage: ## Run tests with coverage report
	pytest --cov=app --cov-report=html --cov-report=term

lint: ## Run linting with flake8
	flake8 app --max-line-length=100 --exclude=__pycache__

format: ## Format code with black
	black app --line-length=100

format-check: ## Check code formatting without making changes
	black app --line-length=100 --check

type-check: ## Run type checking with mypy
	mypy app --ignore-missing-imports

clean: ## Clean Python cache files
	find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -r {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -r {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -r {} + 2>/dev/null || true

