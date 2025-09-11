@echo off
echo ========================================
echo EveryTriv - Development Mode Setup
echo ========================================

echo.
echo Starting EveryTriv in DEVELOPMENT mode...

echo.
echo 🖥️  Starting server (local, port 3003)...
cd server
start "EveryTriv Server (Dev)" cmd /k "pnpm run start:dev"

echo ⏳ Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo 🌐 Starting client (port 3000)...
cd ..\client
start "EveryTriv Client (Dev)" cmd /k "pnpm run start:dev"

echo.
echo ========================================
echo ✅ EveryTriv is running in DEVELOPMENT mode!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 📊 Backend:  http://localhost:3003 (Local)
echo.
echo MODE: Development (Local processes)
echo SERVER PORT: 3003 (local development)
echo CLIENT PORT: 3000
echo ========================================

echo.
echo Both server and client are running in separate windows.
echo Close those windows to stop the services.

echo.
echo Press any key to exit this setup window...
pause >nul
