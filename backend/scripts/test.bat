@echo off
REM Run tests with pytest

REM Check if virtual environment exists
if not exist "venv" (
    echo Virtual environment not found. Please run scripts\install.bat first.
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install pytest if not already installed
pip show pytest >nul 2>&1
if errorlevel 1 (
    echo Installing pytest...
    pip install pytest pytest-asyncio
)

REM Run tests
echo Running tests...
pytest -v

pause

