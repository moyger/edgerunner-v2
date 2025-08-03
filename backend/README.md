# Edgerunner IBKR Proxy Server

This is the backend proxy server for the Edgerunner trading platform's Interactive Brokers integration. It provides a secure bridge between the React frontend and IBKR's TWS/Gateway API.

## Features

- **IBKR API Integration**: Direct connection to TWS/IB Gateway using @stoqey/ib
- **WebSocket Server**: Real-time data streaming to frontend clients
- **Authentication & Security**: JWT-based authentication with encrypted credential storage
- **Market Data Management**: Subscribe to real-time market data feeds
- **Order Management**: Place, modify, and cancel orders through IBKR
- **Portfolio Tracking**: Real-time position and account updates
- **Error Handling**: Comprehensive error handling with automatic reconnection
- **Rate Limiting**: Built-in rate limiting to comply with IBKR API limits

## Prerequisites

Before running the proxy server, ensure you have:

1. **Node.js 18+** installed
2. **TWS (Trader Workstation)** or **IB Gateway** running
3. **API Access Enabled** in TWS/Gateway settings
4. **Valid IBKR Account** (Paper or Live)

## Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit the configuration file
nano .env
```

## Configuration

Edit the `.env` file to configure your setup:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# IBKR Configuration
IBKR_HOST=127.0.0.1
IBKR_PORT=7497
IBKR_CLIENT_ID=1

# Paper Trading Configuration
IBKR_PAPER_HOST=127.0.0.1
IBKR_PAPER_PORT=7497
IBKR_PAPER_CLIENT_ID=2

# Security (Change in production!)
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key

# WebSocket Configuration
WS_PORT=3002
WS_HEARTBEAT_INTERVAL=30000

# CORS
CORS_ORIGIN=http://localhost:5173
```

## TWS/Gateway Setup

### For TWS (Trader Workstation):
1. Open TWS and log in to your account
2. Go to **File > Global Configuration > API > Settings**
3. Check **"Enable ActiveX and Socket Clients"**
4. Set **Socket port** to `7497`
5. Add `127.0.0.1` to **Trusted IPs** if connecting locally
6. Uncheck **"Read-Only API"** if you want to place orders
7. Click **OK** and restart TWS

### For IB Gateway:
1. Start IB Gateway and log in
2. The API is enabled by default on port `4001`
3. Update your `.env` file to use port `4001`

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run clean` - Clean build directory

## API Endpoints

### Authentication
- `POST /api/auth/login` - Authenticate and get JWT token

### IBKR Connection
- `POST /api/ibkr/connect` - Connect to IBKR
- `POST /api/ibkr/disconnect` - Disconnect from IBKR

### Market Data
- `POST /api/market-data/subscribe` - Subscribe to market data
- `DELETE /api/market-data/subscribe/:id` - Unsubscribe from market data

### Orders
- `POST /api/orders` - Place order
- `DELETE /api/orders/:id` - Cancel order
- `GET /api/orders` - Get all orders

### Portfolio
- `GET /api/positions` - Get positions
- `GET /api/account` - Get account summary

### Health Check
- `GET /health` - Server health status

## WebSocket Events

The WebSocket server provides real-time updates for:

- **Market Data**: Live price updates
- **Order Status**: Order fills, cancellations, modifications
- **Positions**: Real-time position changes
- **Account**: Account balance and buying power updates
- **Errors**: IBKR error notifications
- **Connection Status**: Connection health updates

### WebSocket URL
```
ws://localhost:3001/ws
```

### Authentication
Send authentication message after connecting:
```json
{
  "type": "authenticate",
  "payload": { "token": "your-jwt-token" }
}
```

## Security Features

- **JWT Authentication**: All API endpoints require valid JWT tokens
- **Encrypted Credentials**: IBKR credentials are encrypted before storage
- **Rate Limiting**: Protects against API abuse
- **CORS Protection**: Configurable CORS policy
- **Input Validation**: Zod schema validation for all inputs
- **Security Headers**: Helmet.js for security headers

## Error Handling

The server implements comprehensive error handling:

- **Connection Errors**: Automatic reconnection with exponential backoff
- **IBKR Errors**: Categorized by severity with appropriate responses
- **Validation Errors**: Detailed validation error messages
- **Network Errors**: Graceful degradation and retry logic

## Logging

Structured logging with different levels:
- **Error**: Critical errors requiring attention
- **Warn**: Warning conditions
- **Info**: Informational messages
- **Debug**: Detailed debugging information

Log files are stored in the `logs/` directory.

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use strong, unique values for `JWT_SECRET` and `ENCRYPTION_KEY`
3. Configure proper CORS origins
4. Set up SSL certificates for WSS connections
5. Use a process manager like PM2
6. Set up log rotation
7. Configure firewall rules

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify TWS/Gateway is running
   - Check API settings are enabled
   - Confirm port numbers match
   - Ensure client ID is unique

2. **Authentication Errors**
   - Verify IBKR credentials are correct
   - Check if account is active
   - Ensure two-factor authentication is set up properly

3. **WebSocket Connection Issues**
   - Check CORS settings
   - Verify WebSocket port is not blocked
   - Ensure JWT token is valid

4. **Market Data Issues**
   - Confirm market data subscriptions are active
   - Check if market is open
   - Verify symbol formats are correct

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

### Health Check

Monitor server health at:
```
GET http://localhost:3001/health
```

## Support

For issues and questions:
1. Check the logs in `logs/app.log`
2. Verify TWS/Gateway configuration
3. Review IBKR API documentation
4. Check network connectivity

## License

This software is part of the Edgerunner trading platform.