#!/bin/bash

# Edgerunner v2 - Complete Auto-Startup Script
# This script handles everything automatically - no manual steps required!

set -e  # Exit on any error

echo "🚀 Starting Edgerunner v2 Trading Platform"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $(node --version)"
        exit 1
    fi
    print_status "Node.js $(node --version) detected"
fi

# Check Python
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    print_error "Python is not installed. Please install Python 3.8+ from https://python.org/"
    exit 1
else
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    else
        PYTHON_CMD="python"
    fi
    
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1-2)
    print_status "Python $PYTHON_VERSION detected"
fi

# Install frontend dependencies
print_info "Installing frontend dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.installed" ]; then
    npm install
    touch node_modules/.installed
    print_status "Frontend dependencies installed"
else
    print_status "Frontend dependencies already installed"
fi

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
    print_status "Virtual environment created"
fi

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    print_error "Could not find virtual environment activation script"
    exit 1
fi

# Install Python packages
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt > /dev/null 2>&1
    print_status "Backend dependencies installed"
elif [ -f "pyproject.toml" ]; then
    pip install -e . > /dev/null 2>&1
    print_status "Backend dependencies installed"
else
    print_warning "No requirements.txt found, installing common dependencies..."
    pip install fastapi uvicorn ib-insync pandas numpy > /dev/null 2>&1
    print_status "Basic backend dependencies installed"
fi

cd ..

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_info "Creating default .env configuration..."
    cat > .env << 'EOF'
# Edgerunner v2 Configuration
APP_NAME="Edgerunner v2"
DEBUG=true
PAPER_TRADING_ONLY=true

# IBKR Configuration
IBKR_HOST=127.0.0.1
IBKR_PORT=7497
IBKR_CLIENT_ID=1
IBKR_PAPER_TRADING=true

# Uncomment and configure these for live trading (NOT RECOMMENDED for testing)
# IBKR_FLEX_TOKEN=your_flex_token_here
# IBKR_FLEX_QUERY_TRADES=your_trades_query_id
# IBKR_FLEX_QUERY_POSITIONS=your_positions_query_id

# MT5 Configuration (Windows only)
# MT5_LOGIN=your_mt5_login
# MT5_PASSWORD=your_mt5_password
# MT5_SERVER=your_mt5_server
# MT5_PATH=C:\Program Files\MetaTrader 5\terminal64.exe

# ByBit Configuration
# BYBIT_API_KEY=your_bybit_api_key
# BYBIT_SECRET_KEY=your_bybit_secret
BYBIT_BASE_URL=https://api-testnet.bybit.com

# External APIs (Optional)
# ALPHA_VANTAGE_API_KEY=your_api_key
# POLYGON_API_KEY=your_api_key
EOF
    print_status "Default .env file created"
else
    print_status "Using existing .env configuration"
fi

# Check for broker configurations
print_info "Checking broker configurations..."

# Check IBKR Gateway/TWS
if command -v lsof &> /dev/null; then
    if lsof -i :7497 &> /dev/null; then
        print_status "IBKR Gateway/TWS detected on port 7497"
    else
        print_warning "IBKR Gateway/TWS not detected. Start TWS or Gateway in paper trading mode for IBKR features"
    fi
elif command -v netstat &> /dev/null; then
    if netstat -an | grep :7497 &> /dev/null; then
        print_status "IBKR Gateway/TWS detected on port 7497"
    else
        print_warning "IBKR Gateway/TWS not detected. Start TWS or Gateway in paper trading mode for IBKR features"
    fi
else
    print_info "Cannot check IBKR Gateway status (lsof/netstat not available)"
fi

# Check MT5 (Windows only)
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    if [ -f "/c/Program Files/MetaTrader 5/terminal64.exe" ] || command -v terminal64.exe &> /dev/null; then
        print_status "MT5 terminal detected"
    else
        print_warning "MT5 not detected. Install from https://www.metatrader5.com/ for MT5 features"
    fi
else
    print_info "MT5 only available on Windows (will use mock mode)"
fi

print_status "System checks completed successfully!"

# Start the application
print_info "Starting Edgerunner v2..."
echo ""
echo "🎯 The application will:"
echo "   • Automatically start the backend server"
echo "   • Initialize all broker connections"
echo "   • Run system diagnostics"
echo "   • Connect to available brokers"
echo "   • Launch the trading dashboard"
echo ""
echo "📱 Open your browser to: http://localhost:3000"
echo "🔧 Backend API available at: http://localhost:8000"
echo ""
echo "⌨️  Press Ctrl+C to stop the application"
echo ""

# Function to cleanup on exit
cleanup() {
    print_info "Shutting down Edgerunner v2..."
    
    # Kill backend processes
    pkill -f "python.*start.py" 2>/dev/null || true
    pkill -f "uvicorn" 2>/dev/null || true
    
    # Kill frontend processes  
    pkill -f "vite" 2>/dev/null || true
    pkill -f "node.*vite" 2>/dev/null || true
    
    print_status "Application stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the application with automatic backend startup
npm run dev

# This line should never be reached, but just in case
print_info "Application exited normally"