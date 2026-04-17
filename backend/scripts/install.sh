#!/bin/bash
# Install Python dependencies

set -e

echo "Installing Python dependencies..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "Installing requirements..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Installation complete!"
echo "To activate the virtual environment, run: source venv/bin/activate"

