@echo off
REM Install Python dependencies

echo Installing Python dependencies...

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo Installing requirements...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo Installation complete!
echo To activate the virtual environment, run: venv\Scripts\activate.bat

pause

