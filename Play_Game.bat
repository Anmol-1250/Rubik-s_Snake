@echo off
setlocal
echo ==========================================
echo    Rubik's Snake 3D - SERVER LAUNCHER
echo ==========================================
echo.

:: 1. Try Node.js
node -v >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Node.js detected.
    echo [RUN] Attempting to start server with npx serve...
    echo (If this fails or hangs, make sure you are connected to the internet)
    start "" "http://localhost:3000"
    npx serve -s . -l 3000
    if %errorlevel% == 0 goto end
    echo [WARN] npx serve failed. Trying Python fallback...
)

:: 2. Try Python
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Python detected.
    echo [RUN] Starting Python http.server on port 8000...
    start "" "http://localhost:8000"
    python -m http.server 8000
    goto end
)

:: 3. Failure
echo.
echo [ERROR] CRITICAL SYSTEM ERROR
echo ------------------------------------------
echo Neither Node.js nor Python were found.
echo.
echo HOW TO FIX:
echo 1. Install VS Code and the "Live Server" extension.
echo 2. Right-click index.html and select "Open with Live Server".
echo.
pause

:end
endlocal
