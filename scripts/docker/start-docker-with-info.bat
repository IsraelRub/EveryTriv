@echo off
echo ========================================
echo EveryTriv - Production Docker Setup
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
timeout /t 15 /nobreak >nul

echo.
echo Checking service status...
docker-compose ps

echo.
echo ========================================
echo ✅ EveryTriv is running in PRODUCTION mode!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 📊 Backend:  http://localhost:3002 (Docker)
echo 🗄️  pgAdmin:  http://localhost:8080
echo 📊 Redis Commander: http://localhost:8081
echo 🔧 WebDB:    http://localhost:22071
echo.
echo MODE: Production (Docker containers)
echo SERVER PORT: 3002 (inside Docker)
echo CLIENT PORT: 3000
echo ========================================

echo.
echo Useful commands:
echo - View logs: pnpm run docker:logs
echo - Stop services: pnpm run stop:docker
echo - Check status: pnpm run docker:status
echo.
echo Press any key to view live logs (Ctrl+C to stop watching)...
pause >nul

echo.
echo Showing live logs (Ctrl+C to exit):
docker-compose logs -f
