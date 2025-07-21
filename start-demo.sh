#!/bin/bash

echo "🚀 Starting EnglishAI Master Demo..."

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend is running on port 3001"
else
    echo "❌ Backend is not running. Please start it first with: npm run dev"
    exit 1
fi

# Start frontend
echo "🌐 Starting frontend on port 3000..."
cd apps/web && npm run dev