#!/bin/bash

echo "🔒 Starting EnglishAI Master for External Access with HTTPS..."
echo "IP: 89.58.17.78"
echo "Frontend: https://89.58.17.78:3000"
echo "Backend API: https://89.58.17.78:3001"
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
echo "🚀 Starting Backend API with HTTPS (port 3001)..."
cd apps/api
HTTPS=true SSL_CRT=../../ssl/cert.pem SSL_KEY=../../ssl/key.pem npm run dev &
BACKEND_PID=$!

sleep 8

echo "🌐 Starting Frontend with HTTPS (port 3000)..."
cd ../web
HTTPS=true SSL_CRT=../../ssl/cert.pem SSL_KEY=../../ssl/key.pem npm run dev -- --hostname 0.0.0.0 &
FRONTEND_PID=$!

echo ""
echo "✅ Services Started with HTTPS!"
echo "📊 Backend API: https://89.58.17.78:3001"
echo "🎨 Frontend: https://89.58.17.78:3000"
echo "🗄️ Database Admin: http://89.58.17.78:8080"
echo ""
echo "⚠️  Note: You'll need to accept the self-signed certificate in your browser"
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait