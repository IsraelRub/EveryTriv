@echo off

echo 🚀 Starting EveryTriv Server...

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Clean build directory
echo 🧹 Cleaning build directory...
if exist "dist" rmdir /s /q "dist"

echo 🔨 Building application...
npm run build

if %ERRORLEVEL% equ 0 (
    echo ✅ Build successful! Starting server...
    npm run start:prod
) else (
    echo ❌ Build failed! Running in development mode...
    npm run start:dev
)

pause
