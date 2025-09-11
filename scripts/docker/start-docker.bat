@echo off
echo ========================================
echo EveryTriv - Docker Production Setup
echo ========================================

echo.
echo Checking Docker status...
call "%~dp0check-docker.bat"
if %ERRORLEVEL% neq 0 (
    echo.
    echo Cannot start EveryTriv without Docker running.
    pause
    exit /b 1
)

echo.
echo Building and starting Docker containers...
docker-compose up --build -d

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Checking service status...
docker-compose ps

echo.
echo ========================================
echo Services are running on:
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:3002
echo - pgAdmin:  http://localhost:8080
echo - Redis Commander: http://localhost:8081
echo - WebDB:    http://localhost:22071
echo ========================================

echo.
echo To stop services, run: docker-compose down
echo To view logs, run: docker-compose logs -f
