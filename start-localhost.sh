#!/bin/bash

echo "🎤 Starting EnglishAI Master for Microphone Access..."
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo ""
echo "⚠️  Note: This binds to localhost to enable microphone access"
echo "   Access from: http://localhost:3000/learning/voice-demo"
echo ""

# Check if Docker services are running
if docker compose ps | grep -q "Up"; then
    echo "✅ Docker services (PostgreSQL & Redis) are running"
else
    echo "🔄 Starting Docker services..."
    docker compose up -d postgres redis
    sleep 5
fi

echo ""
echo "🚀 Starting Backend API (port 3001)..."
cd apps/api
npm run dev &
BACKEND_PID=$!

sleep 8

echo "🌐 Starting Frontend (port 3000)..."
cd ../web
npm run dev -- --hostname localhost &
FRONTEND_PID=$!

echo ""
echo "✅ Services Started!"
echo "📊 Backend API: http://localhost:3001"
echo "🎨 Frontend: http://localhost:3000"
echo "🎤 Voice Demo: http://localhost:3000/learning/voice-demo"
echo "🗄️ Database Admin: http://89.58.17.78:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait