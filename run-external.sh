#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

IP="89.58.17.78"

echo -e "${BLUE}🌐 EnglishAI Master - External Access Setup${NC}"
echo -e "Public IP: ${YELLOW}$IP${NC}"
echo ""

# Stop existing processes
echo -e "${YELLOW}🔄 Stopping existing processes...${NC}"
pkill -f "tsx watch" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 3

# Check Docker services
if ! docker compose ps | grep -q "Up"; then
    echo -e "${YELLOW}🐳 Starting Docker services...${NC}"
    docker compose up -d postgres redis
    sleep 5
fi

echo -e "${GREEN}✅ Docker services running${NC}"

# Start Backend
echo -e "${BLUE}🚀 Starting Backend API...${NC}"
cd apps/api
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

# Wait for backend
sleep 8

# Start Frontend  
echo -e "${BLUE}🌐 Starting Frontend...${NC}"
cd apps/web
PORT=3000 npm run dev -- --hostname 0.0.0.0 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# Wait for services to start
sleep 8

# Test connectivity
echo -e "${YELLOW}🔧 Testing connectivity...${NC}"

# Test backend
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API: http://$IP:3001${NC}"
else
    echo -e "${RED}❌ Backend API failed to start${NC}"
fi

# Test frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend: http://$IP:3000${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Services are running!${NC}"
echo -e "${BLUE}📊 Backend API:${NC} http://$IP:3001"
echo -e "${BLUE}🎨 Frontend App:${NC} http://$IP:3000"
echo -e "${BLUE}🗄️ Database Admin:${NC} http://$IP:8080"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo "  Backend: tail -f /tmp/backend.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Keep script running
wait