#!/bin/bash

echo "🔒 Starting EnglishAI Master with HTTPS for Remote Microphone Access..."
echo "Frontend: https://89.58.17.78:3000"
echo "Backend API: https://89.58.17.78:3001"
echo ""

# Kill existing processes
pkill -f "ts-node.*src/index.ts" 2>/dev/null
pkill -f "next dev" 2>/dev/null

# Check if Docker services are running
if docker compose ps | grep -q "Up"; then
    echo "✅ Docker services (PostgreSQL & Redis) are running"
else
    echo "🔄 Starting Docker services..."
    docker compose up -d postgres redis
    sleep 5
fi

echo ""
echo "🚀 Starting Backend API with HTTPS (port 3001)..."
cd apps/api
USE_HTTPS=true npm run dev &
BACKEND_PID=$!

sleep 8

echo "🌐 Starting Frontend with HTTPS (port 3000)..."
cd ../web
node https-server.js &
FRONTEND_PID=$!

echo ""
echo "✅ Services Started with HTTPS!"
echo "📊 Backend API: https://89.58.17.78:3001"
echo "🎨 Frontend: https://89.58.17.78:3000"
echo "🎤 Voice Demo: https://89.58.17.78:3000/learning/voice-demo"
echo "🗄️ Database Admin: http://89.58.17.78:8080"
echo ""
echo "🔥 IMPORTANT: Accept the self-signed certificate in your browser!"
echo "   1. Go to https://89.58.17.78:3000"
echo "   2. Click 'Advanced' then 'Proceed to 89.58.17.78 (unsafe)'"
echo "   3. Do the same for https://89.58.17.78:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait