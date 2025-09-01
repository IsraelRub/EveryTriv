#!/bin/bash

# Simple test script for EveryTriv API
API_BASE="http://localhost:3000"

echo "🧪 Testing EveryTriv API..."

# Test health endpoint
echo "📋 Testing health endpoint..."
curl -s "$API_BASE/health" | echo "Health: $(cat)"

echo ""

# Test root endpoint  
echo "📋 Testing root endpoint..."
curl -s "$API_BASE/" | echo "Root: $(cat)"

echo ""

# Test trivia endpoint (this will fail without LLM API keys, but should return proper error)
echo "📋 Testing trivia endpoint..."
curl -s -X POST "$API_BASE/api/v1/trivia" \
  -H "Content-Type: application/json" \
  -d '{"topic":"science","difficulty":"easy"}' | echo "Trivia: $(cat)"

echo ""
echo "✅ API tests completed!"
echo "💡 To test with real questions, add your OpenAI API key to .env file"
