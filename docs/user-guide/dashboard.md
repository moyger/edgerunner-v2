# 📊 Dashboard Guide

The Edgerunner v2 dashboard is your command center for monitoring trading performance, managing positions, and controlling strategies across multiple brokers.

## 🎯 Dashboard Overview

The dashboard provides a real-time, comprehensive view of your trading activity with automatic updates every second.

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Dashboard    [Account Filter ▼]   Market Open  │  ← Header
├─────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │  ← Metrics
│  │Equity│ │ P&L  │ │ Draw │ │ Win% │          │    Cards
│  └──────┘ └──────┘ └──────┘ └──────┘          │
├─────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────┐           │  ← Charts
│  │  Equity Chart   │ │ R-Multiple  │           │
│  └─────────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────┤
│  ┌────────────────────────────────────┐         │  ← Account
│  │      Account Health Metrics        │         │    Health
│  └────────────────────────────────────┘         │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐             │  ← Positions
│  │Open Positions│ │Active Strategy│             │    & Strategies
│  └──────────────┘ └──────────────┘             │
└─────────────────────────────────────────────────┘
```

## 🔍 Key Components

### 1. Header Section

#### Account Filter (New Feature!)
Select which broker account to view:
- **All Accounts** - Combined view of all connected brokers
- **Interactive Brokers** - IBKR-specific data
- **MetaTrader 5** - MT5-specific data
- **ByBit** - Crypto trading data

Connection indicators:
- 🟢 Green dot = Connected
- 🔴 Gray dot = Disconnected

#### Market Status
Shows current market conditions:
- **Market Open** (Green) - Regular trading hours
- **Pre-Market** (Yellow) - Extended hours
- **Market Closed** (Red) - Outside trading hours

### 2. Performance Metrics Cards

#### Total Equity
```
Total Equity          $
$127,450.32
↑ +27.45% all time
```
- **Current Value**: Total account value across selected broker(s)
- **All-Time Change**: Percentage gain/loss since inception
- **Updates**: Real-time with market data

#### Daily P&L
```
Daily P&L             📈
+$2,340.12
↑ +1.87% today
```
- **Today's Profit/Loss**: Net result for current trading day
- **Percentage Change**: Relative to starting equity
- **Color Coding**: Green (profit) / Red (loss)

#### Max Drawdown
```
Max Drawdown          📉
-8.2%
Peak to trough
```
- **Maximum Decline**: Largest equity drop from peak
- **Risk Indicator**: Lower is better
- **Calculation**: (Peak - Trough) / Peak × 100

#### Win Rate
```
Win Rate              🎯
68.4%
347 total trades
```
- **Success Percentage**: Profitable trades / Total trades
- **Trade Count**: Number of closed positions
- **Filtered by Broker**: Updates based on account selection

### 3. Charts Section

#### Equity Chart (Interactive)
- **Time Periods**: 1D, 1W, 1M, 3M, 1Y, ALL
- **Chart Types**: Line, Area, Candlestick
- **Overlays**: 
  - Moving averages (SMA/EMA)
  - Drawdown periods (shaded red)
  - Trade markers (buy/sell points)
- **Zoom & Pan**: Click and drag to explore
- **Hover Details**: Shows exact values and dates

#### R-Multiple Distribution
Visualizes risk-reward performance:
```
Trade Distribution by R-Multiple:
-3R to -2R: ████ (12 trades)
-2R to -1R: ████████ (28 trades)
-1R to 0R:  ████████████ (45 trades)
0R to 1R:   ██████████████ (52 trades)
1R to 2R:   ████████████████████ (89 trades)
2R to 3R:   ████████████████ (67 trades)
3R+:        █████████████ (54 trades)
```

**Understanding R-Multiples:**
- **1R** = One unit of risk (your stop loss distance)
- **2R** = Twice your risk in profit
- **Negative R** = Losing trades
- **Goal**: More trades above 1R than below -1R

### 4. Account Health Metrics

#### Sharpe Ratio
```
Sharpe Ratio: 1.84
Risk-adjusted return
```
- **> 1.0**: Good risk-adjusted returns
- **> 2.0**: Excellent performance
- **< 0**: Losing money

#### Profit Factor
```
Profit Factor: 2.12
Gross profit / loss
```
- **> 1.0**: Profitable system
- **> 2.0**: Strong profitability
- **Formula**: Total Wins / Total Losses

#### Average R-Multiple
```
Avg R-Multiple: 1.85R
Risk-reward ratio
```
- **Target**: Above 1.0R
- **Meaning**: Average trade makes 1.85× the risk

#### Recovery Factor
```
Recovery Factor: 4.21
Net profit / max DD
```
- **Higher is Better**: Shows resilience
- **Formula**: Total Profit / Max Drawdown

### 5. Open Positions Panel

Real-time view of active trades:

```
┌─────────────────────────────────────────┐
│ AAPL   LONG  100 shares  [IBKR]        │
│ Entry: $175.20  Current: $178.45        │
│ P&L: +$325.00 (+1.85%)  ▲              │
├─────────────────────────────────────────┤
│ EURUSD  LONG  10,000 units  [MT5]      │
│ Entry: 1.0850  Current: 1.0875          │
│ P&L: +$250.00 (+0.23%)  ▲              │
├─────────────────────────────────────────┤
│ BTC/USDT  LONG  0.5 BTC  [ByBit]       │
│ Entry: $42,000  Current: $42,850        │
│ P&L: +$425.00 (+2.02%)  ▲              │
└─────────────────────────────────────────┘
```

**Position Details:**
- **Symbol & Side**: Ticker and direction (LONG/SHORT)
- **Quantity**: Number of shares/units/contracts
- **Broker Badge**: Shows which broker (when "All" selected)
- **Entry & Current**: Purchase price vs market price
- **P&L**: Unrealized profit/loss (amount & percentage)

**Position Actions** (Right-click menu):
- **Close Position** - Market close
- **Modify Stop** - Adjust stop loss
- **Add to Position** - Scale in
- **View Chart** - Open detailed chart

### 6. Active Strategies Panel

Monitor algorithmic trading strategies:

```
┌─────────────────────────────────────────┐
│ ▶ Gap & Go                              │
│ 23 trades • 74% win rate                │
│ P&L: +$1,450.20  [RUNNING]             │
├─────────────────────────────────────────┤
│ ⏸ Mean Reversion                       │
│ 12 trades • 42% win rate                │
│ P&L: -$245.30  [PAUSED]                │
└─────────────────────────────────────────┘
```

**Strategy Information:**
- **Status Icons**: ▶ (Running), ⏸ (Paused), ⏹ (Stopped)
- **Performance**: Trade count and win rate
- **P&L**: Strategy-specific profit/loss
- **Status Badge**: Current operational state

**Strategy Actions** (⋮ menu):
- **View Config** - See strategy parameters
- **Edit Parameters** - Modify settings
- **Backtest vs Live** - Compare performance
- **View Trades** - Strategy-specific journal
- **Force Close/Halt** - Emergency stop

## 🎨 Customization Options

### Theme Selection
- **Dark Mode** (Default) - Easier on eyes for long sessions
- **Light Mode** - Better for bright environments

### Dashboard Layouts
- **Compact** - Maximum information density
- **Standard** - Balanced view (default)
- **Expanded** - Larger charts and spacing

### Metric Preferences
Configure which metrics to display:
```javascript
Settings → Dashboard → Visible Metrics
☑ Total Equity
☑ Daily P&L
☑ Max Drawdown
☑ Win Rate
☐ Sortino Ratio
☐ Calmar Ratio
```

## 📊 Understanding the Metrics

### Key Performance Indicators (KPIs)

#### For Day Traders
Focus on:
- **Daily P&L** - Track intraday performance
- **Win Rate** - Consistency matters
- **Average R** - Risk management

#### For Swing Traders
Monitor:
- **Total Equity** - Long-term growth
- **Max Drawdown** - Risk tolerance
- **Sharpe Ratio** - Risk-adjusted returns

#### For Algo Traders
Analyze:
- **Profit Factor** - System efficiency
- **Recovery Factor** - Drawdown recovery
- **R-Distribution** - Strategy edge

### Color Coding System

The dashboard uses intuitive colors:
- **Green** 🟢 - Positive/Good/Profitable
- **Red** 🔴 - Negative/Bad/Loss
- **Yellow** 🟡 - Warning/Caution
- **Blue** 🔵 - Neutral/Information
- **Gray** ⚫ - Inactive/Disabled

## 🔄 Real-Time Updates

### Update Frequencies
- **Positions**: Every 1 second
- **Account Values**: Every 5 seconds
- **Charts**: Every 10 seconds
- **Strategy Status**: Every 2 seconds

### WebSocket Indicators
Bottom-right corner shows connection status:
- **🟢 Connected** - Real-time data flowing
- **🟡 Reconnecting** - Temporary interruption
- **🔴 Disconnected** - No live data

## 🎯 Pro Tips

### Optimize Your Workflow

1. **Use Keyboard Shortcuts**
   - `Space` - Refresh dashboard
   - `F` - Toggle fullscreen chart
   - `P` - Quick position overview
   - `Esc` - Close dialogs

2. **Set Up Alerts**
   - Drawdown warnings
   - Profit targets
   - Strategy errors
   - Connection issues

3. **Customize Your View**
   - Hide unused brokers
   - Arrange panels by priority
   - Save layout presets

### Performance Monitoring

**Daily Routine:**
1. Check overnight positions
2. Review pre-market movers
3. Verify strategy status
4. Monitor risk metrics

**Weekly Analysis:**
1. Review R-multiple distribution
2. Analyze losing trades
3. Adjust strategy parameters
4. Update risk limits

## 🚨 Alerts and Notifications

### Built-in Alerts
- **Drawdown Alert**: Exceeds threshold (default 10%)
- **Daily Loss Limit**: Stops trading at max loss
- **Margin Warning**: Low buying power
- **Disconnect Alert**: Broker connection lost

### Custom Alerts
Create your own:
```javascript
Settings → Alerts → New Alert
Condition: P&L < -$500
Action: Send notification + Pause strategies
```

## 📱 Mobile Dashboard

Access from mobile devices:
- **Responsive Design**: Adapts to screen size
- **Touch Gestures**: Swipe to navigate
- **Essential View**: Shows key metrics only
- **Read-Only Mode**: View but don't trade

---

*Next: Learn about [Account Filtering](./account-filtering.md) or explore [Strategy Management](./strategies.md)*