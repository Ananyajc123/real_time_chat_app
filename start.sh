#!/bin/bash

# Chat App Startup Script
echo "🚀 Starting Nexus Chat Application..."
echo ""

# Colors for output
GREEN='\033[0.32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${YELLOW}📊 Checking PostgreSQL...${NC}"
if ! psql -U postgres -c '\q' 2>/dev/null; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    brew services start postgresql
    sleep 3
fi

# Check if database exists
if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw chatapp; then
    echo -e "${YELLOW}Creating database 'chatapp'...${NC}"
    psql -U postgres -c "CREATE DATABASE chatapp;" || {
        echo -e "${RED}❌ Failed to create database. Please check PostgreSQL installation.${NC}"
        exit 1
    }
fi
echo -e "${GREEN}✅ PostgreSQL ready${NC}"

# Check if Redis is running
echo -e "${YELLOW}📨 Checking Redis...${NC}"
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${YELLOW}Starting Redis...${NC}"
    brew services start redis
    sleep 2
fi
echo -e "${GREEN}✅ Redis ready${NC}"

# Start backend in background
echo -e "${YELLOW}🔧 Starting Backend (Spring Boot)...${NC}"
./mvnw spring-boot:run > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8082/health > /dev/null; then
        echo -e "${GREEN}✅ Backend started successfully${NC}"
        break
    fi
    sleep 2
    echo -n "."
done

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

# Start frontend
echo -e "${YELLOW}🎨 Starting Frontend (React)...${NC}"
cd frontend
npm start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..

echo ""
echo -e "${GREEN}✨ Application started successfully!${NC}"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8082"
echo ""
echo "📝 Demo accounts:"
echo "   Email: alice@demo.com | Password: demo123"
echo "   Email: bob@demo.com   | Password: demo123"
echo ""
echo "💡 To stop the application:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   Or press Ctrl+C and run: ./stop.sh"
echo ""

# Save PIDs for stop script
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Keep script running
wait
