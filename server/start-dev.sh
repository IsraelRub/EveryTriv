#!/bin/bash

echo "🚀 Starting EveryTriv Server (Database-Free Mode)..."

# Check if we're in the server directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the server directory"
    echo "   cd server"
    echo "   ./start-dev.sh"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set environment to skip database
export SKIP_DB=true

echo "✅ Environment configured (Database: DISABLED, Redis: OPTIONAL)"
echo "🔧 Starting in development mode..."

# Start the server
npm run start:dev
