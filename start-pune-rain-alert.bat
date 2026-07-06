@echo off
title Pune Rain Red Alert System - IBM watsonx.ai + ngrok LIVE
color 0A

echo.
echo ================================================================
echo   PUNE DISTRICT RAIN RED ALERT SYSTEM
echo   India Meteorological Department  +  IBM watsonx.ai
echo   ngrok LIVE Public URL Tunnel
echo ================================================================
echo.

:: ── Check Node.js ────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js %NODE_VER% detected

:: ── Check npm ─────────────────────────────────────────────────────
where npm >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] npm not found.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm -v') do set NPM_VER=%%v
echo [OK] npm v%NPM_VER% detected

:: ── Check ngrok ───────────────────────────────────────────────────
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    color 0E
    echo [WARN] ngrok CLI not found in PATH.
    echo        The app will still use the @ngrok/ngrok npm package for tunnelling.
    echo.
) else (
    for /f "tokens=3" %%v in ('ngrok version 2^>^&1 ^| findstr /i "version"') do set NGROK_VER=%%v
    echo [OK] ngrok %NGROK_VER% detected
)

:: ── Check .env ────────────────────────────────────────────────────
if not exist ".env" (
    color 0C
    echo [ERROR] .env file not found!
    echo         Required keys: WATSONX_API_KEY, WATSONX_PROJECT_ID,
    echo                        WATSONX_URL, WATSONX_MODEL_ID, NGROK_AUTHTOKEN
    echo.
    pause
    exit /b 1
)
echo [OK] .env file found

:: ── Install / verify packages ─────────────────────────────────────
if not exist "node_modules\" (
    echo.
    echo [INFO] node_modules not found. Installing packages...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] npm install failed. Check your network connection.
        pause
        exit /b 1
    )
    echo [OK] Packages installed.
    echo.
) else (
    echo [INFO] Verifying packages (npm install)...
    call npm install --silent 2>nul
    echo [OK] All packages verified.
)

:: ── Kill any existing process on port 3000 ────────────────────────
echo [INFO] Checking port 3000...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do (
    if not "%%p"=="0" (
        echo [INFO] Killing existing process on port 3000 (PID %%p)...
        taskkill /PID %%p /F >nul 2>&1
    )
)
echo [OK] Port 3000 is free.

echo.
echo ================================================================
echo   STARTING SERVER + ngrok TUNNEL
echo ================================================================
echo.
echo   Local  : http://localhost:3000
echo   Public : Will be printed in the console below (ngrok URL)
echo.
echo   *** COPY the ngrok URL from the console below and share it! ***
echo.
echo   Press Ctrl+C to stop server and close tunnel
echo ================================================================
echo.

:: ── Start the server (ngrok tunnel starts inside server.js) ───────
node server.js

:: ── Server exited ─────────────────────────────────────────────────
echo.
echo [INFO] Server stopped.
echo.
pause
