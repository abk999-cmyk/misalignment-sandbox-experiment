#!/bin/bash

# Development script to start both backend and frontend
# Ensures ports are free before starting

set -e

BACKEND_PORT=3001
FRONTEND_PORT=5173

echo "🔧 Starting Xi Wei Pharma Development Environment"
echo ""

# Function to kill process on port
kill_port() {
  local port=$1
  local pid=$(lsof -ti:$port 2>/dev/null || echo "")
  if [ -n "$pid" ]; then
    echo "⚠️  Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
}

# Kill existing processes
echo "🧹 Cleaning up existing processes..."
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT

# Check if backend .env.local exists
if [ ! -f "backend/.env.local" ]; then
  echo "⚠️  backend/.env.local not found. Copying from .env.example..."
  cp backend/.env.example backend/.env.local
  echo "✅ Please edit backend/.env.local and add your OPENAI_API_KEY"
  exit 1
fi

# Start backend
echo "🚀 Starting backend on port $BACKEND_PORT..."
cd backend
npm run dev > ../logs/backend-dev.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 5

# Check backend health
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
  echo "✅ Backend is running"
else
  echo "❌ Backend failed to start. Check logs/backend-dev.log"
  kill $BACKEND_PID 2>/dev/null || true
  exit 1
fi

# Start frontend
echo "🚀 Starting frontend on port $FRONTEND_PORT..."
npm run dev > logs/frontend-dev.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "   Backend:  http://localhost:$BACKEND_PORT"
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "Press Ctrl+C to stop all servers"

# Trap Ctrl+C
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit" INT

# Wait for processes
wait

