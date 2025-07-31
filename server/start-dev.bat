@echo off

echo 🚀 Starting EveryTriv Server (Database-Free Mode)...

REM Check if we're in the server directory
if not exist "package.json" (
    echo ❌ Please run this script from the server directory
    echo    cd server
    echo    start-dev.bat
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Set environment to skip database
set SKIP_DB=true

echo ✅ Environment configured (Database: DISABLED, Redis: OPTIONAL)
echo 🔧 Starting in development mode...

REM Start the server
npm run start:dev

pause
