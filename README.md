# 🚀 Edgerunner v2 - Automated Trading Platform

A production-ready trading platform with **automatic startup** - no manual configuration required!

## ⚡ Quick Start (Fully Automatic)

**One command starts everything:**

```bash
./start-app.sh
```

That's it! The app will:
- ✅ Auto-start backend server
- ✅ Auto-connect to available brokers (IBKR, MT5)
- ✅ Run system diagnostics
- ✅ Launch trading dashboard
- ✅ Handle all initialization automatically

## 🎯 What's Automatic

### Backend Services
- **Auto-startup**: Backend starts automatically with frontend
- **Health monitoring**: Continuous broker connection monitoring
- **Auto-recovery**: Automatic reconnection for failed brokers
- **Diagnostics**: Real-time system health analysis

### Broker Connections
- **IBKR**: Auto-connects if Gateway/TWS is running on port 7497
- **MT5**: Auto-connects using environment credentials (Windows)
- **Configuration**: Auto-detects available brokers and services

### User Experience
- **Startup Progress**: Visual progress indicator during initialization
- **Error Recovery**: Graceful handling of connection failures
- **Zero Configuration**: Works out of the box with sensible defaults

## 🔧 Optional Configuration

The app works with defaults, but you can customize by editing `.env`:

```bash
# IBKR (auto-created on first run)
IBKR_HOST=127.0.0.1
IBKR_PORT=7497
IBKR_CLIENT_ID=1

# MT5 (Windows only - optional)
# MT5_LOGIN=your_login
# MT5_PASSWORD=your_password  
# MT5_SERVER=your_server

# Trading Safety (recommended)
PAPER_TRADING_ONLY=true
```

## 📊 Broker Setup (Optional)

### IBKR
If you want IBKR integration:
1. Start TWS or Gateway
2. Set to Paper Trading mode
3. Configure port 7497
4. App auto-connects!

### MT5 (Windows)
If you want MT5 integration:
1. Install MetaTrader 5
2. Add credentials to `.env`
3. App auto-connects!

### No Brokers?
- App still works with mock data
- All features available for testing
- Perfect for development/learning

## 🖥️ System Requirements

- **Node.js 18+** (for frontend)
- **Python 3.8+** (for backend)
- **Any OS** (Windows/Mac/Linux)

## 📱 Features

- **Real-time Dashboard**: Live market data and positions
- **Strategy Builder**: Visual strategy development
- **Risk Management**: Position sizing and stop losses
- **Trade Journal**: Performance tracking and analytics
- **API Testing**: Built-in broker API testing tools
- **Health Monitoring**: System diagnostics and troubleshooting

## 🚨 Safety First

- **Paper Trading Only** by default
- No real money at risk
- All connections validated
- Comprehensive error handling

## 🔍 Troubleshooting

The app includes built-in diagnostics:

- Visit `http://localhost:8000/diagnostics/health/summary`
- Check startup logs in the app
- Use the "Show Details" during startup

### Common Issues

**"Backend won't start"**
- Check Python installation: `python --version`
- Run manually: `cd backend && python start.py`

**"IBKR connection failed"**  
- Ensure TWS/Gateway is running
- Check port 7497 is available
- Verify paper trading mode

**"Slow startup"**
- Normal on first run (installing dependencies)
- Subsequent starts are much faster

## 🏗️ Development

```bash
# Development with auto-reload
npm run dev

# Frontend only (if backend already running)
npm run dev:frontend-only

# Backend only
npm run backend:start

# Stop all services
npm run backend:stop
```

## 📚 Documentation

- **API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/diagnostics/health/summary`
- **System Info**: `http://localhost:8000/system/info`

## 🎉 What Makes It Different

Unlike other trading platforms that require complex setup:

- **Zero Configuration**: Works immediately after clone
- **Auto-Discovery**: Finds and connects to available brokers
- **Self-Healing**: Automatic recovery from connection issues
- **Beginner Friendly**: No technical knowledge required
- **Production Ready**: Banking-grade error handling and monitoring

## 🤝 Contributing

1. Fork the repository
2. Run `./start-app.sh` to set up development environment
3. Make changes
4. All tests and checks run automatically

## ⚖️ License

MIT License - see LICENSE file

---

**🎯 Ready to trade? Just run `./start-app.sh` and you're live in seconds!**