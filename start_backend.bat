@echo off
title GGH — Backend API (port 8000)
color 0A

echo.
echo  ============================================================
echo   Green Grass Heritage — Backend API
echo  ============================================================
echo.
echo   API:     http://localhost:8000
echo   Docs:    http://localhost:8000/docs
echo   Health:  http://localhost:8000/api/v1/health
echo   Photos:  http://localhost:8000/gallery/
echo.
echo   Press Ctrl+C to stop
echo  ============================================================
echo.

cd /d "%~dp0"

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install Python 3.10+ and try again.
    pause
    exit /b 1
)

:: Check .env
if not exist ".env" (
    echo  [WARN] .env file not found. Copying from .env.example...
    copy ".env.example" ".env" >nul
    echo  [WARN] Please edit .env and add your LLM_API_KEY before starting.
    notepad ".env"
    pause
)

:: Install dependencies if needed
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo  [INFO] Installing dependencies...
    pip install -r requirements.txt
    echo.
)

python main.py

pause
