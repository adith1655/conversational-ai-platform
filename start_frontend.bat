@echo off
title GGH — Frontend (port 3000)
color 0B

echo.
echo  ============================================================
echo   Green Grass Heritage — Frontend
echo  ============================================================
echo.
echo   Site:    http://localhost:3000
echo   Gallery: http://localhost:3000/gallery.html
echo.
echo   Make sure the backend is also running on port 8000.
echo   Press Ctrl+C to stop
echo  ============================================================
echo.

cd /d "%~dp0frontend"

python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Cannot start dev server.
    pause
    exit /b 1
)

:: Wait a moment then open browser
start /b "" cmd /c "timeout /t 2 >nul && start http://localhost:3000"

python -m http.server 3000

pause
