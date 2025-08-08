#!/bin/bash

echo "🚀 Starting EveryTriv in PRODUCTION mode with Docker..."

# Build and start all services
echo "🔨 Building and starting production services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "📊 Checking service status..."
docker-compose ps

echo "✅ EveryTriv is running in PRODUCTION mode!"
echo "🌐 Application: http://localhost:3000"
echo "📊 API: http://localhost:3001"
echo ""
echo "📋 To check logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo "🗑️  To cleanup: docker-compose down -v"
