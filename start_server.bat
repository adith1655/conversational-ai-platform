@echo off
:: Redirects to the new start_all.bat launcher.
:: This file is kept for backwards compatibility.
echo  [INFO] Redirecting to the new launcher (start_all.bat)...
timeout /t 2 >nul
call "%~dp0start_all.bat"
