@echo off
title Green Grass Heritage — Launcher
color 0A

echo.
echo  ============================================================
echo   Green Grass Heritage — Full Stack Launcher
echo  ============================================================
echo.
echo   This will start:
echo     [1] Backend API   http://localhost:8000
echo     [2] Frontend      http://localhost:3000
echo.
echo   The browser will open automatically after 4 seconds.
echo  ============================================================
echo.

cd /d "%~dp0"

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install Python 3.10+ from python.org
    pause
    exit /b 1
)

:: Check .env
if not exist ".env" (
    echo  [WARN] .env not found — copying from .env.example
    copy ".env.example" ".env" >nul
    echo  [WARN] Edit .env and set your LLM_API_KEY, then re-run.
    notepad ".env"
    pause
    exit /b 1
)

:: Install dependencies if needed
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo  [INFO] Installing Python dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo  [ERROR] pip install failed. Check your internet connection.
        pause
        exit /b 1
    )
    echo.
)

echo  [INFO] Starting backend API on port 8000...
start "GGH Backend" cmd /k "cd /d "%~dp0" && python main.py"

echo  [INFO] Starting frontend on port 3000...
start "GGH Frontend" cmd /k "cd /d "%~dp0frontend" && python -m http.server 3000"

echo  [INFO] Opening browser in 4 seconds...
timeout /t 4 >nul
start http://localhost:3000

echo.
echo  ============================================================
echo   Both servers are running in separate windows.
echo   Close those windows (or press Ctrl+C in them) to stop.
echo  ============================================================
echo.
pause
