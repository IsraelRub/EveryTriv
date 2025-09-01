@echo off
echo 🚀 Starting EveryTriv in LOCAL development mode...

REM Start local database services
echo 📡 Starting local database services...
docker-compose -f docker-compose.local.yaml up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Start server in background
echo 🖥️  Starting server...
cd server
start "EveryTriv Server" cmd /k "npm run start:local"

REM Wait a bit for server to start
timeout /t 5 /nobreak >nul

REM Start client
echo 🌐 Starting client...
cd ..\client
start "EveryTriv Client" cmd /k "npm run start:local"

echo ✅ EveryTriv is running in LOCAL mode!
echo 📊 Server: http://localhost:3002
echo 🌐 Client: http://localhost:3000
echo 🗄️  Database Admin: http://localhost:8080
echo 📊 Redis Admin: http://localhost:8081
echo.
echo Press any key to stop all services...
pause >nul

echo 🛑 Stopping services...
docker-compose -f docker-compose.local.yaml down
