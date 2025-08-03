#!/bin/bash

# Edgerunner IBKR Proxy Server Startup Script

echo "🚀 Starting Edgerunner IBKR Proxy Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env
    echo "🔧 Please edit .env file with your configuration before running again."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if TypeScript is compiled
if [ ! -d "dist" ]; then
    echo "🔨 Building TypeScript..."
    npm run build
fi

# Start the server
echo "🌟 Starting server..."
echo "📡 HTTP Server will be available at: http://localhost:3001"
echo "🔌 WebSocket Server will be available at: ws://localhost:3001/ws"
echo "📊 Health Check: http://localhost:3001/health"
echo ""
echo "💡 Make sure TWS or IB Gateway is running and API is enabled!"
echo ""

# Start in development mode if NODE_ENV is not production
if [ "$NODE_ENV" = "production" ]; then
    npm start
else
    npm run dev
fi