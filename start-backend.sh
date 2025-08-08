#!/bin/bash

# Backend Starter Script
# Ensures the backend service is running for API connections

echo "🚀 Starting Edgerunner Backend Services..."

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Navigate to backend directory
cd backend || {
    echo "❌ Error: Backend directory not found"
    exit 1
}

# Check if Python virtual environment exists
if [[ ! -d "venv" ]]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Check if backend server is already running
if curl -f -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Backend server is already running on port 8000"
else
    echo "🔄 Starting backend server..."
    
    # Try different backend entry points
    if [[ -f "start.py" ]]; then
        echo "Using start.py..."
        python start.py &
    elif [[ -f "main.py" ]]; then
        echo "Using main.py..."
        python main.py &
    elif [[ -f "src/main.py" ]]; then
        echo "Using src/main.py..."
        python src/main.py &
    elif [[ -f "mock_backend.py" ]]; then
        echo "Using mock_backend.py as fallback..."
        python mock_backend.py &
    else
        echo "❌ No backend entry point found"
        echo "Available Python files:"
        find . -name "*.py" -maxdepth 2 | head -10
        exit 1
    fi
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if server started successfully
    if curl -f -s http://localhost:8000/health >/dev/null 2>&1; then
        echo "✅ Backend server started successfully on port 8000"
    else
        echo "⚠️  Backend server may still be starting or failed to start"
        echo "Check the server logs for details"
    fi
fi

echo "🎉 Backend startup script completed"
echo "🌐 Backend should be available at: http://localhost:8000"
echo "📋 To check status: curl http://localhost:8000/health"