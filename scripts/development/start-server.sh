#!/bin/bash

echo "🚀 Starting EveryTriv Server..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean build directory
echo "🧹 Cleaning build directory..."
rm -rf dist

echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Starting server..."
    npm run start:prod
else
    echo "❌ Build failed! Running in development mode..."
    npm run start:dev
fi
