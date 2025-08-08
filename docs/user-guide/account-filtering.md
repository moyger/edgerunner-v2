# 🔍 Account Filtering Guide

Master the multi-broker account filtering system to manage and monitor your trading accounts across Interactive Brokers, MetaTrader 5, and ByBit from a single dashboard.

## 🎯 Overview

Account filtering allows you to:
- View combined data from all brokers
- Focus on individual broker performance
- Compare metrics across accounts
- Manage positions by broker
- Track strategy performance per account

## 🏦 Account Filter Dropdown

Located in the dashboard header, the account filter provides instant switching between broker views:

```
Dashboard  [All Accounts ▼]              Market Open
           ├─ 🟢 All Accounts
           ├─ 🟢 Interactive Brokers
           ├─ ⚫ MetaTrader 5
           └─ 🟢 ByBit
```

### Status Indicators
- **🟢 Green Dot** - Broker connected and active
- **🟡 Yellow Dot** - Connection issues/reconnecting
- **⚫ Gray Dot** - Broker disconnected
- **🔴 Red Dot** - Connection error

## 📊 Filter Modes

### 1. All Accounts View

Shows aggregated data from all connected brokers:

```
Total Equity: $127,450.32  (Combined)
├─ IBKR:     $85,200.45  (66.9%)
├─ MT5:      $32,100.87  (25.2%)
└─ ByBit:    $10,149.00  (7.9%)
```

**What You See:**
- Combined total equity
- Aggregated P&L across all accounts
- All open positions with broker badges
- Combined win rate and metrics
- Unified strategy performance

**Best For:**
- Overall portfolio monitoring
- Cross-broker analysis
- Total exposure assessment
- Combined risk management

### 2. Individual Broker View

Focus on a single broker's performance:

#### Interactive Brokers View
```
Selected: Interactive Brokers
Total Equity: $85,200.45
Daily P&L: +$1,580.30
Win Rate: 72.1%
Positions: 15 open
```

**Specific Features:**
- Stock and options trading
- Flex Query integration
- Advanced order types
- Portfolio margin details

#### MetaTrader 5 View
```
Selected: MetaTrader 5
Total Equity: $32,100.87
Daily P&L: +$560.82
Win Rate: 61.8%
Positions: 8 open
```

**Specific Features:**
- Forex pairs
- CFD positions
- Margin requirements
- Swap rates

#### ByBit View
```
Selected: ByBit
Total Equity: $10,149.00
Daily P&L: +$199.00
Win Rate: 68.9%
Positions: 3 open
```

**Specific Features:**
- Crypto holdings
- USDT pairs
- Funding rates
- Leverage display

## 🔄 Dynamic Data Updates

### What Changes When You Switch

#### Performance Metrics
When filtering, these metrics update instantly:
- **Total Equity** - Account-specific balance
- **Daily P&L** - Filtered profit/loss
- **Max Drawdown** - Per-broker drawdown
- **Win Rate** - Broker-specific success rate
- **Trade Count** - Number of trades per broker

#### Open Positions
Position list filters to show:
- Only positions from selected broker
- Broker-specific P&L calculations
- Relevant position sizes and types
- Appropriate currency display

#### Charts
Visual representations adjust to show:
- Filtered equity curve
- Broker-specific R-multiple distribution
- Relevant timeframes
- Account-specific drawdowns

## 🏷️ Broker Badges

When viewing "All Accounts", positions show broker badges:

```
┌─────────────────────────────────────┐
│ AAPL  LONG  100 shares  [IBKR]     │
│ Entry: $175.20  P&L: +$325.00      │
├─────────────────────────────────────┤
│ EURUSD  LONG  10K units  [MT5]     │
│ Entry: 1.0850  P&L: +$250.00       │
├─────────────────────────────────────┤
│ BTC/USDT  LONG  0.5  [BYBIT]       │
│ Entry: $42,000  P&L: +$425.00      │
└─────────────────────────────────────┘
```

Badge colors match broker identity:
- **[IBKR]** - Blue badge
- **[MT5]** - Green badge
- **[BYBIT]** - Orange badge

## 🎮 Filter Controls

### Keyboard Shortcuts
- `Alt + A` - Show all accounts
- `Alt + 1` - Switch to IBKR
- `Alt + 2` - Switch to MT5
- `Alt + 3` - Switch to ByBit
- `Tab` - Cycle through accounts

### Quick Switch Menu
Right-click on the filter dropdown:
```
Quick Switch:
├─ Previous Account (Alt + ←)
├─ Next Account (Alt + →)
├─ ──────────────
├─ Pin to All Accounts
└─ Settings
```

## 📈 Use Cases

### Portfolio Management
**Scenario**: Managing diverse portfolio across brokers

**All Accounts View**:
- Monitor total exposure
- Check combined drawdown
- Balance risk across brokers
- View total P&L

### Broker Comparison
**Scenario**: Comparing performance between brokers

**Switch Between Views**:
```
IBKR:  Win Rate: 72.1%, Avg R: 2.05
MT5:   Win Rate: 61.8%, Avg R: 1.52
ByBit: Win Rate: 68.9%, Avg R: 1.95
```

### Strategy Isolation
**Scenario**: Running different strategies per broker

**Individual Views**:
- IBKR: Gap & Go strategy (stocks)
- MT5: Forex scalping strategy
- ByBit: Crypto momentum strategy

### Risk Assessment
**Scenario**: Checking exposure per broker

**Filtered Metrics**:
```
IBKR:  Max Position: $10,000 (11.7% of account)
MT5:   Max Position: $5,000 (15.6% of account)
ByBit: Max Position: $2,000 (19.7% of account)
```

## ⚙️ Configuration

### Default View Settings
Set your preferred default view:

```javascript
// settings.json
{
  "dashboard": {
    "defaultAccountFilter": "all",  // or "ibkr", "mt5", "bybit"
    "rememberLastFilter": true,
    "showDisconnectedBrokers": false
  }
}
```

### Filter Persistence
Options for filter behavior:
- **Remember Last** - Keeps previous selection
- **Always All** - Resets to all accounts
- **Primary Broker** - Defaults to main broker

### Custom Filters
Create advanced filters:

```javascript
// Custom filter example
{
  "name": "High Performers",
  "condition": "winRate > 70",
  "brokers": ["ibkr", "bybit"]
}
```

## 📊 Metrics Calculation

### Aggregated Metrics (All Accounts)

**Total Equity**:
```
Total = IBKR_Equity + MT5_Equity + ByBit_Equity
```

**Combined Win Rate**:
```
Win Rate = (IBKR_Wins + MT5_Wins + ByBit_Wins) / 
           (IBKR_Trades + MT5_Trades + ByBit_Trades)
```

**Weighted Averages**:
```
Avg Sharpe = (IBKR_Sharpe × IBKR_Weight) + 
             (MT5_Sharpe × MT5_Weight) + 
             (ByBit_Sharpe × ByBit_Weight)
```

### Individual Metrics

Each broker maintains separate:
- Trade history
- Performance metrics
- Risk calculations
- Strategy results

## 🔔 Filter-Based Alerts

Set alerts specific to filtered views:

### All Accounts Alerts
- Total drawdown exceeds 15%
- Combined daily loss > $1,000
- Any broker disconnects

### Per-Broker Alerts
- IBKR margin call warning
- MT5 high spread alert
- ByBit funding rate spike

## 🎨 Visual Indicators

### Color Coding by Performance
Brokers in dropdown show performance colors:
- **Green Text** - Profitable today
- **Red Text** - Loss today
- **White Text** - Flat/unchanged

### Quick Stats Preview
Hover over broker in dropdown:
```
┌──────────────────────────┐
│ Interactive Brokers      │
│ ────────────────────     │
│ Equity: $85,200.45       │
│ Today: +$1,580.30        │
│ Positions: 15            │
│ Status: Connected        │
└──────────────────────────┘
```

## 💡 Best Practices

### Daily Workflow
1. **Start with All Accounts** - Get overall picture
2. **Check Individual Brokers** - Identify issues
3. **Focus on Active Trading** - Filter to active broker
4. **End with All Accounts** - Final portfolio check

### Performance Analysis
- Compare win rates across brokers
- Identify best-performing account
- Analyze strategy effectiveness per broker
- Balance capital allocation

### Risk Management
- Monitor exposure per broker
- Check margin usage individually
- Set broker-specific limits
- Diversify across accounts

## 🚨 Troubleshooting

### Filter Not Showing Broker
**Issue**: Broker missing from dropdown

**Solutions**:
1. Check broker connection status
2. Verify credentials in settings
3. Restart application
4. Check `showDisconnectedBrokers` setting

### Data Not Updating
**Issue**: Metrics frozen when switching

**Solutions**:
1. Check WebSocket connection
2. Refresh dashboard (F5)
3. Re-select filter
4. Check broker API status

### Incorrect Totals
**Issue**: All Accounts sum doesn't match

**Solutions**:
1. Refresh all broker connections
2. Check for pending trades
3. Verify time zone settings
4. Clear cache and reload

## 🔗 Related Features

- [Dashboard Guide](./dashboard.md) - Main dashboard features
- [Multi-Broker Trading](../brokers/multi-broker.md) - Managing multiple accounts
- [Risk Management](./risk-management.md) - Per-broker risk controls
- [Trade Journal](./trade-journal.md) - Filter trades by broker

---

*Pro Tip: Use keyboard shortcuts to quickly switch between accounts during active trading sessions. Set up workspace layouts for different trading styles per broker.*