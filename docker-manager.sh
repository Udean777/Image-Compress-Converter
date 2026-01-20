#!/bin/bash

# Script to manage Docker Compose services

# Navigate to the directory where the script is located
cd "$(dirname "$0")"

# Function to display usage information
usage() {
    echo "Usage: $0 {up|down|restart|logs|build|ps|clean}"
    echo
    echo "Commands:"
    echo "  up       Start services in detached mode (docker-compose up -d)"
    echo "  down     Stop and remove containers, networks (docker-compose down)"
    echo "  restart  Restart all services"
    echo "  logs     View output from containers (follow mode)"
    echo "  build    Build or rebuild services and start them"
    echo "  ps       List containers"
    echo "  clean    Stop and remove containers, networks, and volumes (Use with caution)"
    exit 1
}

# Check if at least one argument is provided
if [ $# -eq 0 ]; then
    usage
fi

case "$1" in
    up)
        echo "🚀 Starting services..."
        docker-compose up -d
        echo "✅ Services started!"
        ;;
    down)
        echo "🛑 Stopping services..."
        docker-compose down
        echo "✅ Services stopped!"
        ;;
    restart)
        echo "🔄 Restarting services..."
        docker-compose restart
        echo "✅ Services restarted!"
        ;;
    logs)
        echo "📋 Attaching to logs..."
        docker-compose logs -f
        ;;
    build)
        echo "🔨 Building and starting services..."
        docker-compose up -d --build
        echo "✅ Build complete and services started!"
        ;;
    ps)
        docker-compose ps
        ;;
    clean)
        echo "⚠️  Cleaning up containers, networks, and volumes..."
        docker-compose down -v
        echo "✅ Cleanup complete!"
        ;;
    *)
        echo "❌ Invalid command: $1"
        usage
        ;;
esac
