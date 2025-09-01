#!/bin/bash

echo "========================================"
echo "Stopping EveryTriv Docker Services"
echo "========================================"

echo ""
echo "Stopping all containers..."
docker-compose down

echo ""
echo "Removing volumes (optional - uncomment if needed):"
echo "# docker-compose down -v"

echo ""
echo "========================================"
echo "All services stopped successfully!"
echo "========================================"
