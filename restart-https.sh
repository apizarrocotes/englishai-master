#!/bin/bash

echo "🔄 Restarting HTTPS services with updated configuration..."

# Kill all existing processes
echo "⚠️  Stopping existing services..."
pkill -f "ts-node.*src/index.ts" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "node https-server.js" 2>/dev/null

sleep 3

echo "🚀 Starting services with HTTPS..."
cd /home/apc/englishai-master

# Start services
./start-https-simple.sh