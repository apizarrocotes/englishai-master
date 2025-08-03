#!/bin/bash

echo "🔍 Testing HTTPS connections..."
echo ""

echo "1. Testing backend API health (HTTPS):"
curl -k -s https://89.58.17.78:3001/health | jq . 2>/dev/null || echo "❌ HTTPS API not responding"
echo ""

echo "2. Testing backend API health (HTTP - should fail):"
curl -s http://89.58.17.78:3001/health 2>/dev/null || echo "✅ HTTP API correctly disabled"
echo ""

echo "3. Testing frontend (HTTPS):"
curl -k -s -I https://89.58.17.78:3000 | head -1
echo ""

echo "4. Testing learning paths endpoint (HTTPS):"
curl -k -s https://89.58.17.78:3001/api/learning/learning-paths-v2 | jq . 2>/dev/null || echo "❌ Learning paths not responding"