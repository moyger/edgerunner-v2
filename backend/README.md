# 🚀 Edgerunner Backend

**Algorithmic Trading Platform Backend** with multi-broker support and real-time data streaming.

## 🏗️ Architecture

- **FastAPI** - High-performance async web framework
- **Multi-Broker Support** - IBKR, MetaTrader 5, ByBit
- **Real-time Data** - WebSocket streaming
- **Quant Libraries** - pandas, numpy, scipy, TA-Lib
- **Safety First** - Paper trading mode by default

## 🔧 Setup

### 1. Install Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### 3. Interactive Brokers Setup

1. **Install TWS or IB Gateway**
   - Download from [Interactive Brokers](https://www.interactivebrokers.com/en/index.php?f=16457)
   - Enable API connections in TWS settings
   - Set socket port (default: 7497 for paper, 7496 for live)

2. **Configure API Settings**
   ```
   IBKR_HOST=127.0.0.1
   IBKR_PORT=7497  # Paper trading port
   IBKR_CLIENT_ID=1
   PAPER_TRADING_ONLY=true
   ```

## 🚀 Start the Backend

```bash
# Using the startup script (recommended)
python start.py

# Or directly with uvicorn
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

## 📡 API Endpoints

### Health & Status
- `GET /health` - Health check
- `GET /api/status` - API status with broker information

### Broker Management
- `POST /api/broker/connect` - Connect to broker
- `POST /api/broker/disconnect` - Disconnect from broker
- `GET /api/broker/status` - Get connection status
- `GET /api/broker/status/all` - Get all broker statuses

### Trading Data
- `GET /api/account/summary` - Account information
- `GET /api/positions` - Current positions
- `GET /api/market-data` - Real-time market data
- `GET /api/historical-data` - Historical data

### Order Management
- `POST /api/trade` - Place order
- `GET /api/orders/status` - Get order status
- `POST /api/orders/cancel` - Cancel order

### API Testing
- `POST /api/broker/test` - Run API tests
- `POST /api/broker/test/{test_id}` - Run specific test

### Real-time Data
- `WS /api/ws/broker/{broker}` - WebSocket for real-time updates

## 🧪 API Testing

Test your broker connections:

```bash
# Test IBKR connection
curl -X POST "http://localhost:8000/api/broker/test" \
  -H "Content-Type: application/json" \
  -d '{"broker": "ibkr", "categories": ["authentication", "market-data"]}'
```

## 🛡️ Safety Features

- **Paper Trading Only** - Default configuration prevents live trading
- **Connection Validation** - Extensive API testing before operations
- **Error Handling** - Comprehensive error reporting and logging
- **Rate Limiting** - Built-in protection against API limits

## 📊 Broker Configuration

### Interactive Brokers
```json
{
  "broker": "ibkr",
  "credentials": {
    "host": "127.0.0.1",
    "port": 7497,
    "client_id": 1
  }
}
```

### MetaTrader 5 (Coming Soon)
```json
{
  "broker": "mt5",
  "credentials": {
    "login": "your_account",
    "password": "your_password",
    "server": "your_server"
  }
}
```

### ByBit (Coming Soon)
```json
{
  "broker": "bybit",
  "credentials": {
    "api_key": "your_api_key",
    "secret_key": "your_secret_key"
  }
}
```

## 🔍 Monitoring

### Logs
- Application logs: `logs/app.log`
- Error logs: `logs/app.error.log`

### Health Checks
```bash
# Check if API is running
curl http://localhost:8000/health

# Check broker statuses
curl http://localhost:8000/api/broker/status/all
```

## 🧑‍💻 Development

### Project Structure
```
backend/
├── src/
│   ├── adapters/          # Broker adapters
│   │   ├── base.py       # Base adapter interface
│   │   └── ibkr_adapter.py
│   ├── routes/           # API routes
│   │   ├── broker.py     # Broker endpoints
│   │   └── strategy.py   # Strategy endpoints
│   ├── services/         # Business logic
│   │   └── broker_service.py
│   ├── config.py         # Configuration
│   ├── models.py         # Pydantic models
│   └── main.py           # FastAPI app
├── requirements.txt      # Dependencies
├── .env.example          # Environment template
└── start.py             # Startup script
```

### Adding New Brokers

1. Create adapter in `src/adapters/`
2. Implement `BrokerAdapter` interface
3. Register in `BrokerService`
4. Add configuration options

## 📈 Algorithmic Trading Features

### Current
- Real-time market data streaming
- Order management with paper trading
- Multi-broker connection management
- Comprehensive API testing framework

### Planned
- Strategy engine with backtesting
- Risk management system
- Portfolio optimization
- Machine learning integration
- Performance analytics

## ⚠️ Important Notes

- **Paper Trading Mode**: Always test with paper trading first
- **API Limits**: Be aware of broker API rate limits
- **Data Fees**: Some market data may incur fees
- **Security**: Never commit API keys to version control

## 🆘 Troubleshooting

### Common Issues

1. **TWS Connection Failed**
   - Ensure TWS/IB Gateway is running
   - Check API settings are enabled
   - Verify host/port configuration

2. **Import Errors**
   - Install all requirements: `pip install -r requirements.txt`
   - Activate virtual environment

3. **Permission Errors**
   - Check file permissions
   - Ensure logs directory exists

### Getting Help

1. Check logs in `logs/` directory
2. Verify broker API settings
3. Test with `/health` endpoint
4. Review error messages in API responses

---

**Ready to start algorithmic trading!** 🎯