#!/bin/bash
# Run tests with pytest

set -e

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Please run ./scripts/install.sh first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Install pytest if not already installed
if ! pip show pytest > /dev/null 2>&1; then
    echo "Installing pytest..."
    pip install pytest pytest-asyncio
fi

# Run tests
echo "Running tests..."
pytest -v

