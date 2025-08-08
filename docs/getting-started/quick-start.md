# ⚡ Quick Start Guide

Get Edgerunner v2 up and running in 5 minutes with automatic configuration!

## 🎯 One-Command Start

The fastest way to get started:

```bash
# Make start script executable (first time only)
chmod +x start-app.sh

# Start everything automatically
./start-app.sh
```

That's it! The application will:
- ✅ Start the backend server
- ✅ Launch the frontend
- ✅ Auto-connect to available brokers
- ✅ Open your browser to the dashboard

## 🚀 What Happens Automatically

### 1. Backend Initialization (0-5 seconds)
- Python backend starts on port 8000
- Database initializes (if configured)
- API endpoints become available
- Health monitoring activates

### 2. Broker Discovery (5-10 seconds)
- Scans for IBKR Gateway/TWS on port 7497
- Checks for MT5 terminal (Windows)
- Validates ByBit credentials (if configured)
- Establishes connections automatically

### 3. Frontend Launch (10-15 seconds)
- Vite dev server starts on port 3000
- React application loads
- WebSocket connections establish
- Dashboard displays with real-time data

## 📊 Understanding the Dashboard

When the application loads, you'll see:

### Header Section
- **Account Filter**: Switch between "All Accounts", "IBKR", "MT5", "ByBit"
- **Market Status**: Shows if markets are open/closed
- **Connection Indicators**: Green dots show connected brokers

### Key Metrics Cards
1. **Total Equity** - Combined account value across all brokers
2. **Daily P&L** - Today's profit/loss
3. **Max Drawdown** - Peak to trough decline
4. **Win Rate** - Percentage of profitable trades

### Main Sections
- **Equity Chart** - Visual representation of account growth
- **R-Multiple Distribution** - Risk-reward analysis
- **Open Positions** - Current trades across all brokers
- **Active Strategies** - Running algorithmic strategies

## 🔄 Quick Actions

### Connect to a Broker

If a broker isn't auto-connected:

1. Click **Settings** (⚙️) in the sidebar
2. Select **Broker Connections**
3. Click **Connect** next to your broker
4. Enter credentials if prompted

### Place Your First Trade

1. Click **Trade** in the sidebar
2. Select broker and symbol
3. Choose order type (Market/Limit)
4. Enter quantity
5. Click **Place Order**

### Start a Strategy

1. Go to **Strategies** in the sidebar
2. Click **New Strategy**
3. Select a template (e.g., "Gap & Go")
4. Configure parameters
5. Click **Start Strategy**

## 🎮 Keyboard Shortcuts

- `Alt + D` - Go to Dashboard
- `Alt + T` - Open Trade panel
- `Alt + S` - View Strategies
- `Alt + J` - Open Trade Journal
- `Alt + /` - Show all shortcuts

## 🔍 Monitoring Your Trades

### Real-Time Updates
- Positions update every second
- P&L calculations are live
- Charts refresh automatically

### Account Filtering
Use the account dropdown to:
- View combined data (All Accounts)
- Focus on specific broker (IBKR, MT5, ByBit)
- See broker-specific positions and metrics

## 🛡️ Paper Trading Mode

By default, the platform starts in paper trading mode:
- No real money at risk
- Test strategies safely
- Learn the platform

To switch to live trading:
1. Go to **Settings** → **Trading Mode**
2. Toggle **Paper Trading** off
3. Confirm the warning dialog
4. Enter your live account credentials

## 📈 Quick Strategy Setup

### Using Strategy Templates

1. **Gap & Go Strategy**
   ```javascript
   Parameters:
   - Gap Threshold: 3.5%
   - Volume Filter: 2M+
   - Stop Loss: 2%
   - Take Profit: 4%
   ```

2. **Momentum Breakout**
   ```javascript
   Parameters:
   - Breakout Period: 20 bars
   - Volume Multiplier: 2.0x
   - RSI Threshold: 70
   - Risk per Trade: 1.5%
   ```

3. **Mean Reversion**
   ```javascript
   Parameters:
   - Oversold RSI: 30
   - Lookback Period: 14
   - Position Size: 1% of equity
   - Max Positions: 5
   ```

## 🔧 Quick Configuration

### Essential Settings

Edit `.env` file for quick configuration:

```env
# Paper Trading (Safe Mode)
PAPER_TRADING_ONLY=true

# Default Position Size
MAX_POSITION_SIZE=0.02  # 2% of equity

# Risk Management
MAX_DAILY_LOSS=500      # Stop trading after $500 loss
MAX_DRAWDOWN=0.10       # 10% maximum drawdown

# Auto-Connect Brokers
AUTO_CONNECT_IBKR=true
AUTO_CONNECT_MT5=false
AUTO_CONNECT_BYBIT=false
```

## 📱 Mobile Access

Access your dashboard from mobile:

1. Ensure backend is running
2. Find your local IP:
   ```bash
   # macOS/Linux
   ifconfig | grep inet
   
   # Windows
   ipconfig
   ```
3. On mobile browser, visit: `http://YOUR_IP:3000`

## 🚨 Quick Troubleshooting

### Nothing Loads?
```bash
# Check if services are running
curl http://localhost:8000/health  # Backend
curl http://localhost:3000          # Frontend

# Restart everything
npm run dev
```

### Broker Won't Connect?
- **IBKR**: Ensure Gateway/TWS is running on port 7497
- **MT5**: Check if terminal is open (Windows only)
- **ByBit**: Verify API keys in `.env`

### Data Not Updating?
1. Check WebSocket connection (F12 → Network → WS)
2. Refresh the page (Ctrl/Cmd + R)
3. Clear cache (Ctrl/Cmd + Shift + R)

## 🎯 What's Next?

Now that you're up and running:

1. **[First Trade Walkthrough](./first-trade.md)** - Place your first trade
2. **[Dashboard Guide](../user-guide/dashboard.md)** - Master the interface
3. **[Strategy Development](../strategies/framework.md)** - Build custom strategies
4. **[Risk Management](../user-guide/risk-management.md)** - Set up safety controls

## 💡 Pro Tips

- **Use paper trading** for at least a week before going live
- **Set up stop losses** on all trades
- **Monitor the dashboard** during market hours
- **Keep a trade journal** for performance analysis
- **Start small** with position sizes

---

*Ready for more? Check out our [comprehensive user guide](../user-guide/dashboard.md) or [API documentation](../api/rest-api.md).*