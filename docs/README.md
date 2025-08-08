# 📚 Edgerunner v2 Documentation

Welcome to the comprehensive documentation for Edgerunner v2, your automated algorithmic trading platform.

## 🎯 Quick Navigation

### Getting Started
- [Installation Guide](./getting-started/installation.md) - System requirements and setup
- [Quick Start Tutorial](./getting-started/quick-start.md) - Get trading in 5 minutes
- [First Trade Walkthrough](./getting-started/first-trade.md) - Place your first trade
- [Troubleshooting](./troubleshooting/common-issues.md) - Common issues and solutions

### User Guides
- [Dashboard Guide](./user-guide/dashboard.md) - Understanding your trading dashboard
- [Account Filtering](./user-guide/account-filtering.md) - Managing multiple broker accounts
- [Strategy Management](./user-guide/strategies.md) - Creating and monitoring strategies
- [Trade Journal](./user-guide/trade-journal.md) - Logging and analyzing trades
- [Risk Management](./user-guide/risk-management.md) - Position sizing and limits

### API Documentation
- [REST API Reference](./api/rest-api.md) - Complete endpoint documentation
- [WebSocket API](./api/websocket.md) - Real-time data streaming
- [Authentication](./api/authentication.md) - API keys and security
- [Rate Limiting](./api/rate-limiting.md) - Broker-specific limits
- [Postman Collection](./api/postman-collection.md) - API testing tools

### Broker Integration
- [Interactive Brokers Setup](./brokers/ibkr-setup.md) - Gateway/TWS configuration
- [MetaTrader 5 Integration](./brokers/mt5-setup.md) - Terminal setup
- [ByBit Connection](./brokers/bybit-setup.md) - API configuration
- [Flex Query Setup](./brokers/flex-queries.md) - IBKR reporting
- [Multi-Broker Trading](./brokers/multi-broker.md) - Managing multiple accounts

### Strategy Development
- [Strategy Framework](./strategies/framework.md) - Building custom strategies
- [Backtesting Guide](./strategies/backtesting.md) - Testing with historical data
- [Performance Metrics](./strategies/metrics.md) - Understanding key metrics
- [Strategy Templates](./strategies/templates.md) - Example strategies
- [Risk Parameters](./strategies/risk-parameters.md) - Position sizing formulas

### Configuration
- [Environment Variables](./configuration/environment.md) - Complete .env reference
- [Broker Credentials](./configuration/credentials.md) - Security best practices
- [Feature Flags](./configuration/features.md) - Live vs paper trading
- [Custom Settings](./configuration/settings.md) - Platform customization

### Development
- [Architecture Overview](./development/architecture.md) - System design
- [Contributing Guide](./development/contributing.md) - How to contribute
- [Development Setup](./development/setup.md) - Local environment
- [Testing Guide](./development/testing.md) - Unit and E2E testing
- [Build & Deployment](./development/deployment.md) - Production deployment

## 📖 Documentation Structure

```
docs/
├── README.md                 # This file - main documentation index
├── getting-started/          # Installation and quick start guides
│   ├── installation.md       # System requirements and setup
│   ├── quick-start.md        # 5-minute getting started guide
│   └── first-trade.md        # First trade walkthrough
├── user-guide/               # End-user documentation
│   ├── dashboard.md          # Dashboard features and metrics
│   ├── account-filtering.md  # Multi-broker account management
│   ├── strategies.md         # Strategy creation and management
│   ├── trade-journal.md      # Trade logging and analysis
│   └── risk-management.md    # Risk controls and position sizing
├── api/                      # API documentation
│   ├── rest-api.md          # REST endpoint reference
│   ├── websocket.md         # WebSocket streaming API
│   ├── authentication.md    # API authentication guide
│   ├── rate-limiting.md     # Rate limit handling
│   └── postman-collection.md # API testing with Postman
├── brokers/                  # Broker integration guides
│   ├── ibkr-setup.md        # Interactive Brokers setup
│   ├── mt5-setup.md         # MetaTrader 5 configuration
│   ├── bybit-setup.md       # ByBit API setup
│   ├── flex-queries.md      # IBKR Flex Query configuration
│   └── multi-broker.md      # Managing multiple brokers
├── strategies/               # Strategy development
│   ├── framework.md         # Strategy framework overview
│   ├── backtesting.md       # Backtesting guide
│   ├── metrics.md           # Performance metrics explained
│   ├── templates.md         # Strategy templates and examples
│   └── risk-parameters.md   # Risk management parameters
├── configuration/            # Configuration guides
│   ├── environment.md       # Environment variables
│   ├── credentials.md       # Credential security
│   ├── features.md          # Feature flags
│   └── settings.md          # Custom settings
├── development/              # Developer documentation
│   ├── architecture.md      # System architecture
│   ├── contributing.md      # Contribution guidelines
│   ├── setup.md            # Development setup
│   ├── testing.md          # Testing guide
│   └── deployment.md       # Deployment guide
└── troubleshooting/         # Troubleshooting guides
    ├── common-issues.md     # Common problems and solutions
    ├── broker-errors.md     # Broker-specific errors
    └── api-errors.md        # API error reference
```

## 🚀 Key Features

### Zero-Configuration Startup
The platform features automatic initialization:
- Auto-starts backend services
- Auto-connects to available brokers
- Auto-configures based on environment
- Visual progress indicators

### Multi-Broker Support
Trade across multiple brokers simultaneously:
- **Interactive Brokers (IBKR)** - Full support with Flex Queries
- **MetaTrader 5** - Forex and CFD trading
- **ByBit** - Cryptocurrency trading

### Advanced Trading Features
- Real-time market data streaming
- Automated strategy execution
- Comprehensive backtesting
- Risk management controls
- Performance analytics

## 💡 Quick Tips

### For Traders
1. Start with paper trading to test strategies
2. Use the account filter to focus on specific brokers
3. Monitor the dashboard for real-time performance
4. Keep a trade journal for analysis

### For Developers
1. Check the architecture guide for system overview
2. Follow the contributing guidelines for pull requests
3. Run tests before submitting changes
4. Use the development setup for local testing

## 🔗 Additional Resources

- [API Postman Collection](../Edgerunner_Backend_API_v2.postman_collection.json)
- [Claude.md](../CLAUDE.md) - AI assistant guidance
- [Security Audit](./archive/SECURITY_AUDIT_REPORT.md) - Security assessment

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/edgerunner-v2/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/edgerunner-v2/discussions)
- **Email**: support@edgerunner.trading

---

*Last updated: December 2024*
*Version: 2.0.0*