#!/bin/bash

echo "🌐 Setting up ngrok for EnglishAI Master..."

# Install ngrok
if ! command -v ngrok &> /dev/null; then
    echo "📦 Installing ngrok..."
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update && sudo apt install ngrok -y
fi

echo "🚀 Starting ngrok tunnels..."

# Start ngrok for frontend
ngrok http 3000 --region=us --subdomain=englishai-demo 2>/dev/null &
NGROK_FRONTEND_PID=$!

sleep 3

# Start ngrok for API  
ngrok http 3001 --region=us --subdomain=englishai-api 2>/dev/null &
NGROK_API_PID=$!

sleep 3

echo "✅ Ngrok tunnels created!"
echo "🎨 Frontend: Check ngrok dashboard or use: curl http://localhost:4040/api/tunnels"
echo "📊 API: Check ngrok dashboard or use: curl http://localhost:4041/api/tunnels"
echo ""
echo "Press Ctrl+C to stop tunnels"

trap "kill $NGROK_FRONTEND_PID $NGROK_API_PID 2>/dev/null; exit" INT
wait