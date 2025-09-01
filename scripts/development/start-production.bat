@echo off
echo 🚀 Starting EveryTriv in PRODUCTION mode with Docker...

REM Build and start all services
echo 🔨 Building and starting production services...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service status
echo 📊 Checking service status...
docker-compose ps

echo ✅ EveryTriv is running in PRODUCTION mode!
echo 🌐 Application: http://localhost:3000
echo 📊 API: http://localhost:3002
echo.
echo 📋 To check logs: docker-compose logs -f
echo 🛑 To stop: docker-compose down
echo 🗑️  To cleanup: docker-compose down -v
echo.
pause
