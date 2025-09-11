@echo off
echo ========================================
echo EveryTriv - Docker Status Check
echo ========================================

echo.
echo Checking if Docker is running...

REM Check if Docker Desktop is running
docker version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker is not running!
    echo.
    echo Please make sure:
    echo 1. Docker Desktop is installed
    echo 2. Docker Desktop is running
    echo 3. Docker daemon is accessible
    echo.
    echo To start Docker Desktop:
    echo - Open Docker Desktop application
    echo - Wait for it to finish starting up
    echo - Look for the green "running" status in the system tray
    echo.
    exit /b 1
)

echo ✅ Docker is running!

echo.
echo Docker version:
docker version --format "{{.Server.Version}}"

echo.
echo Docker Compose version:
docker-compose version --short

echo.
echo Available Docker resources:
docker system df

echo.
echo ========================================
echo Docker is ready for EveryTriv!
echo ========================================
