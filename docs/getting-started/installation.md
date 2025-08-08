# 🛠️ Installation Guide

This guide will help you set up Edgerunner v2 on your system.

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: macOS 10.15+, Windows 10+, Ubuntu 20.04+
- **Node.js**: v18.0.0 or higher
- **Python**: 3.9 or higher
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 2GB free space
- **Network**: Stable internet connection

### Broker-Specific Requirements

#### Interactive Brokers (IBKR)
- IBKR Gateway or Trader Workstation (TWS)
- Paper or Live trading account
- API access enabled in account settings

#### MetaTrader 5
- MetaTrader 5 terminal (Windows only)
- Demo or Live account
- Python integration package

#### ByBit
- ByBit account (Testnet recommended for testing)
- API key and secret

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/edgerunner-v2.git
cd edgerunner-v2
```

### 2. Install Frontend Dependencies

```bash
# Install Node.js dependencies
npm install

# Or using yarn
yarn install
```

### 3. Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### 4. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your preferred editor
nano .env
```

Basic `.env` configuration:

```env
# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=true
PAPER_TRADING_ONLY=true

# IBKR Configuration
IBKR_HOST=127.0.0.1
IBKR_PORT=7497
IBKR_CLIENT_ID=1
IBKR_PAPER_TRADING=true

# Optional: IBKR Flex Queries
# IBKR_FLEX_TOKEN=your_flex_token_here
# IBKR_FLEX_QUERY_TRADES=query_id_here

# Optional: MT5 Configuration (Windows only)
# MT5_LOGIN=your_login
# MT5_PASSWORD=your_password
# MT5_SERVER=your_server

# Optional: ByBit Configuration
# BYBIT_API_KEY=your_api_key
# BYBIT_API_SECRET=your_api_secret
# BYBIT_TESTNET=true
```

### 5. Database Setup (Optional)

If using database features:

```bash
# SQLite (default - no setup needed)
# Database file will be created automatically

# PostgreSQL (optional)
# Add to .env:
DATABASE_URL=postgresql://user:password@localhost/edgerunner
```

## 🔧 Broker Setup

### Interactive Brokers (IBKR)

1. **Download IBKR Gateway or TWS**
   - [IBKR Gateway](https://www.interactivebrokers.com/en/trading/ibgateway-stable.php)
   - [Trader Workstation](https://www.interactivebrokers.com/en/trading/tws.php)

2. **Configure API Settings**
   ```
   File → Global Configuration → API → Settings
   - Enable ActiveX and Socket Clients
   - Socket port: 7497 (paper) or 7496 (live)
   - Master API client ID: Leave blank
   - Allow connections from localhost only
   ```

3. **Start Gateway/TWS**
   ```bash
   # Paper trading (recommended)
   Use port 7497
   
   # Live trading
   Use port 7496 and update .env
   ```

### MetaTrader 5 (Windows Only)

1. **Install MT5**
   - Download from [MetaTrader 5](https://www.metatrader5.com/)

2. **Install Python Integration**
   ```bash
   pip install MetaTrader5
   ```

3. **Enable Algo Trading**
   - Tools → Options → Expert Advisors
   - Allow automated trading
   - Allow DLL imports

### ByBit

1. **Create API Keys**
   - Log in to [ByBit](https://www.bybit.com/)
   - Account & Security → API Management
   - Create new API key with trading permissions

2. **Configure Testnet (Recommended)**
   - Use [ByBit Testnet](https://testnet.bybit.com/)
   - Create separate testnet API keys

## ✅ Verification

### 1. Test Backend Connection

```bash
# Start backend
cd backend
python start.py

# In another terminal, test health endpoint
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-08T10:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. Test Frontend Build

```bash
# Build frontend
npm run build

# Start development server
npm run dev
```

Visit http://localhost:3000 - you should see the trading dashboard.

### 3. Test Broker Connections

```bash
# Test IBKR connection
curl http://localhost:8000/api/broker/status?broker=ibkr

# Test all brokers
curl http://localhost:8000/api/broker/status/all
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

#### Python Module Not Found
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

#### IBKR Connection Failed
- Ensure Gateway/TWS is running
- Check port configuration (7497 for paper trading)
- Verify API settings are enabled
- Check firewall settings

#### Node.js Version Issues
```bash
# Check Node version
node --version

# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node 18
nvm install 18
nvm use 18
```

## 📦 Docker Installation (Alternative)

For a containerized setup:

```bash
# Build and start containers
docker-compose up --build

# Run in background
docker-compose up -d

# Stop containers
docker-compose down
```

## 🎯 Next Steps

Once installation is complete:

1. [Quick Start Tutorial](./quick-start.md) - Get trading in 5 minutes
2. [First Trade Walkthrough](./first-trade.md) - Place your first trade
3. [Dashboard Guide](../user-guide/dashboard.md) - Understanding the interface

## 💡 Tips

- Start with paper trading to test your setup
- Keep your API credentials secure and never commit them to git
- Use a virtual environment for Python to avoid dependency conflicts
- Enable debug mode during initial setup for better error messages

---

*Need help? Check our [Troubleshooting Guide](../troubleshooting/common-issues.md) or open an issue on GitHub.*