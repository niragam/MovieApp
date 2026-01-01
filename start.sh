#!/bin/bash

# =============================================================================
# restart.sh - Stop all services and restart from scratch
# =============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$PROJECT_DIR/src/frontend"

echo "MovieApp Service Restart Script"
echo "===================================="
echo ""

# -----------------------------------------------------------------------------
# Stop Frontend Dev Server (if running)
# -----------------------------------------------------------------------------
echo "Checking for running frontend dev server..."
FRONTEND_PIDS=$(pgrep -f "vite" 2>/dev/null || true)
if [ -n "$FRONTEND_PIDS" ]; then
    echo "   Stopping Vite dev server (PIDs: $FRONTEND_PIDS)..."
    kill $FRONTEND_PIDS 2>/dev/null || true
    sleep 1
    echo "   Frontend stopped"
else
    echo "   No frontend dev server running"
fi

# Kill processes on frontend ports
for port in 5173 5174; do
    PORT_PID=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$PORT_PID" ]; then
        echo "   Killing process on port $port (PID: $PORT_PID)..."
        kill $PORT_PID 2>/dev/null || true
    fi
done

echo ""

# -----------------------------------------------------------------------------
# Stop Docker Containers (forcefully)
# -----------------------------------------------------------------------------
echo "Stopping Docker containers..."
cd "$PROJECT_DIR"

# Force stop docker-compose services
docker-compose down --remove-orphans 2>/dev/null || true

# Force stop and remove containers by name pattern
for container in mongo-netflix web-ser recserver; do
    if docker ps -aq -f name=$container 2>/dev/null | grep -q .; then
        echo "   Force stopping and removing: $container..."
        docker stop $container 2>/dev/null || true
        docker rm -f $container 2>/dev/null || true
    fi
done

# Extra cleanup: stop any container using our ports
for port in 27017 3000 8000; do
    CONTAINER_ID=$(docker ps -q --filter "publish=$port" 2>/dev/null || true)
    if [ -n "$CONTAINER_ID" ]; then
        echo "   Stopping container using port $port..."
        docker stop $CONTAINER_ID 2>/dev/null || true
        docker rm -f $CONTAINER_ID 2>/dev/null || true
    fi
done

echo "   Docker containers stopped"
echo ""

# -----------------------------------------------------------------------------
# Check if ports are free
# -----------------------------------------------------------------------------
echo "Checking if ports are available..."
PORTS_BLOCKED=false
for port in 27017 3000 8000; do
    PORT_PID=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$PORT_PID" ]; then
        echo "   Port $port is still in use by PID: $PORT_PID"
        echo "      Process: $(ps -p $PORT_PID -o comm= 2>/dev/null || echo 'unknown')"
        PORTS_BLOCKED=true
    fi
done

if [ "$PORTS_BLOCKED" = true ]; then
    echo ""
    echo "   Some ports are blocked. You may need to manually stop these processes:"
    echo "      sudo kill -9 \$(lsof -ti:27017) # for MongoDB"
    echo "      sudo kill -9 \$(lsof -ti:3000)  # for API"
    echo "      sudo kill -9 \$(lsof -ti:8000)  # for RecServer"
    echo ""
    read -p "   Continue anyway? [y/N]: " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# -----------------------------------------------------------------------------
# Clean up (optional - remove volumes for fresh start)
# -----------------------------------------------------------------------------
read -p "Do you want to remove all data (fresh database)? [y/N]: " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   Removing Docker volumes..."
    docker volume rm asp-ex3_mongodb_data 2>/dev/null || true
    echo "   Data removed - fresh start!"
fi

echo ""

# -----------------------------------------------------------------------------
# Rebuild and Start Docker Services
# -----------------------------------------------------------------------------
echo "Starting Docker services..."
cd "$PROJECT_DIR"
docker-compose up --build -d

echo "   Waiting for services to be ready..."
sleep 8

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "   Backend services started successfully!"
    docker-compose ps
else
    echo "   Error: Some services failed to start"
    docker-compose logs --tail=30
    exit 1
fi

echo ""

# -----------------------------------------------------------------------------
# Start Frontend
# -----------------------------------------------------------------------------
echo "Starting frontend dev server..."
cd "$FRONTEND_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "   Installing frontend dependencies..."
    npm install
fi

# Start Vite in background
echo "   Starting Vite dev server..."
nohup npm run dev > /tmp/vite.log 2>&1 &
VITE_PID=$!
sleep 3

# Check if Vite started
if kill -0 $VITE_PID 2>/dev/null; then
    # Get the actual port from the log
    VITE_PORT=$(grep -o 'localhost:[0-9]*' /tmp/vite.log | head -1 | cut -d':' -f2)
    echo "   Frontend started (PID: $VITE_PID, Port: ${VITE_PORT:-5173})"
else
    echo "   Frontend failed to start. Check /tmp/vite.log"
    cat /tmp/vite.log
fi

echo ""

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo "===================================="
echo "All services restarted!"
echo ""
echo "Service URLs:"
VITE_PORT=$(grep -o 'localhost:[0-9]*' /tmp/vite.log 2>/dev/null | head -1 | cut -d':' -f2 || echo "5173")
echo "   Frontend:  http://localhost:${VITE_PORT}"
echo "   API:       http://localhost:3000"
echo "   MongoDB:   localhost:27017"
echo "   RecServer: localhost:8000"
echo ""
echo "Useful commands:"
echo "   docker-compose logs -f     # View backend logs"
echo "   tail -f /tmp/vite.log      # View frontend logs"
echo "   ./seed_database.sh         # Populate sample data"
echo "===================================="
