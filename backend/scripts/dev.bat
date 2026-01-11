@echo off
REM Run FastAPI server in development mode

REM Check if virtual environment exists
if not exist "venv" (
    echo Virtual environment not found. Please run scripts\install.bat first.
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if .env file exists
if not exist ".env" (
    echo Warning: .env file not found. Using default configuration.
    echo You may want to copy .env.example to .env and configure it.
)

REM Run uvicorn
echo Starting FastAPI server on http://localhost:8000
echo API docs available at http://localhost:8000/docs
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

