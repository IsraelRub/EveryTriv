#!/bin/bash

echo "🚀 Starting EveryTriv in LOCAL development mode..."

# Start local database services
echo "📡 Starting local database services..."
docker-compose -f docker-compose.local.yaml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Start server
echo "🖥️  Starting server..."
cd server
npm run start:local &
SERVER_PID=$!

# Wait a bit for server to start
sleep 5

# Start client
echo "🌐 Starting client..."
cd ../client
npm run start:local &
CLIENT_PID=$!

echo "✅ EveryTriv is running in LOCAL mode!"
echo "📊 Server: http://localhost:3001"
echo "🌐 Client: http://localhost:3000"
echo "🗄️  Database Admin: http://localhost:8080"
echo "📊 Redis Admin: http://localhost:8081"
echo ""
echo "Press Ctrl+C to stop all services..."

# Function to handle cleanup
cleanup() {
    echo "🛑 Stopping services..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    docker-compose -f docker-compose.local.yaml down
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
