@echo off
title ASPHALT RUMBLE: REAL WORLD RACING 3D (ONLINE & SOLO)
color 0b
echo ========================================================
echo   ASPHALT RUMBLE: REAL WORLD RACING 3D (ONLINE & SOLO)
echo ========================================================
echo Oyun baslatiliyor...
echo.

:: Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [1/2] Node.js sunucusu baslatiliyor (Port 8080)...
    start "" http://localhost:8080
    node online_lan_server.cjs 8080
    goto end
)

:: Else check if Python is available
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [1/2] Python yerel sunucusu baslatiliyor (Port 8080)...
    start "" http://localhost:8080
    python -m http.server 8080
    goto end
)

:: Else open index.html directly
echo [1/2] index.html dogrudan varsayilan tarayicida aciliyor...
start "" "%~dp0index.html"

:end
