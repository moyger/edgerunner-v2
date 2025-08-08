# 💰 First Trade Walkthrough

This step-by-step guide will help you place your first trade using Edgerunner v2.

## 📋 Prerequisites

Before placing your first trade, ensure:
- ✅ Application is running (`npm run dev`)
- ✅ At least one broker is connected (green indicator)
- ✅ You're in paper trading mode (recommended for first trade)

## 🎯 Step 1: Navigate to Trading Interface

### Option A: Quick Trade Panel
1. Click **Trade** in the left sidebar
2. The quick trade panel opens

### Option B: From Dashboard
1. On the dashboard, find **Quick Actions**
2. Click **New Trade** button

## 🔍 Step 2: Select Your Broker

In the trade panel, you'll see a broker dropdown:

```
Broker: [Interactive Brokers ▼]
        - Interactive Brokers ✓ (Connected)
        - MetaTrader 5 (Disconnected)
        - ByBit (Disconnected)
```

Select the broker showing a green checkmark (✓).

## 📈 Step 3: Choose Your Symbol

### For Stocks (IBKR)
Enter a stock symbol:
- **AAPL** - Apple Inc.
- **TSLA** - Tesla Inc.
- **SPY** - S&P 500 ETF

### For Forex (MT5)
Enter a currency pair:
- **EURUSD** - Euro/US Dollar
- **GBPJPY** - British Pound/Japanese Yen

### For Crypto (ByBit)
Enter a crypto pair:
- **BTCUSDT** - Bitcoin/USDT
- **ETHUSDT** - Ethereum/USDT

## 💵 Step 4: Configure Your Order

### Order Type Selection

**Market Order** (Recommended for first trade)
- Executes immediately at current price
- Fastest execution
- May have slight slippage

```
Order Type: [Market ▼]
```

**Limit Order**
- Executes at specified price or better
- More control over entry price
- May not fill immediately

```
Order Type: [Limit ▼]
Limit Price: [175.50]
```

### Position Size

Calculate your position size:

**Method 1: Fixed Shares/Units**
```
Quantity: [100] shares
```

**Method 2: Dollar Amount**
```
Investment Amount: [$1,000]
→ Calculated Shares: 5.71 @ $175.00
```

**Method 3: Risk-Based (Recommended)**
```
Risk Amount: [$100] (1% of $10,000 account)
Stop Loss: [$170.00]
→ Calculated Shares: 20
```

## 🛡️ Step 5: Set Risk Management

### Stop Loss (Strongly Recommended)

Protect your capital with a stop loss:

```
☑ Enable Stop Loss
Stop Price: [$170.00]
Stop Type: [Stop Market ▼]
```

**Stop Loss Guidelines:**
- **Stocks**: 2-5% below entry
- **Forex**: 20-50 pips
- **Crypto**: 3-10% below entry

### Take Profit (Optional)

Lock in gains automatically:

```
☑ Enable Take Profit
Target Price: [$180.00]
Limit Type: [Limit ▼]
```

**Risk-Reward Ratios:**
- Minimum 1:1 (risk $100 to make $100)
- Recommended 1:2 or better
- Example: Risk $100 to make $200

## 📝 Step 6: Review Your Order

Before submitting, review the order summary:

```
=================================
ORDER SUMMARY
=================================
Broker:        Interactive Brokers
Symbol:        AAPL
Side:          BUY
Type:          MARKET
Quantity:      100 shares
Est. Price:    $175.00
Total Value:   $17,500.00

Risk Management:
Stop Loss:     $170.00 (-2.86%)
Take Profit:   $180.00 (+2.86%)
Max Risk:      $500.00
Max Reward:    $500.00
Risk-Reward:   1:1

Commissions:   $1.00 (estimated)
=================================
```

## ✅ Step 7: Place the Order

1. **Final Check:**
   - ✓ Correct symbol?
   - ✓ Right direction (Buy/Sell)?
   - ✓ Appropriate size?
   - ✓ Stop loss set?

2. **Submit Order:**
   ```
   [Cancel] [Place Order →]
   ```

3. **Confirmation:**
   You'll see a confirmation message:
   ```
   ✅ Order Placed Successfully
   Order ID: 12345
   Status: PENDING
   ```

## 📊 Step 8: Monitor Your Trade

### On the Dashboard

Your new position appears in **Open Positions**:

```
AAPL    LONG    100 shares    Entry: $175.00
Current: $175.25    P&L: +$25.00 (+0.14%)
```

### Real-Time Updates
- **Green**: Profitable position
- **Red**: Losing position
- **Updates**: Every second

### Position Details
Click on the position to see:
- Entry time
- Current bid/ask
- Volume traded
- Time in position
- Unrealized P&L

## 🔄 Step 9: Managing Your Trade

### Modify Orders
Right-click on your position:
- **Adjust Stop Loss** - Trail your stop
- **Modify Target** - Update take profit
- **Add to Position** - Scale in
- **Partial Close** - Take partial profits

### Close Position
Three ways to close:

1. **Market Close** (Immediate)
   ```
   [Close Position] → [Confirm]
   ```

2. **Limit Close** (At specific price)
   ```
   [Close at Limit] → Enter Price → [Submit]
   ```

3. **Let Stop/Target Execute** (Automatic)
   Wait for price to hit your levels

## 📈 Step 10: Review Your Trade

After closing, check your trade journal:

1. Go to **Journal** in sidebar
2. Find your trade in the list
3. Review the details:

```
Trade #12345 - AAPL
===================
Entry:      $175.00 @ 10:30 AM
Exit:       $176.50 @ 11:15 AM
Duration:   45 minutes
Quantity:   100 shares
Gross P&L:  +$150.00
Commission: -$2.00
Net P&L:    +$148.00
Return:     +0.85%
```

## 🎓 Example Trades

### Conservative Stock Trade
```
Symbol:      SPY (S&P 500 ETF)
Direction:   BUY
Quantity:    10 shares
Entry:       $440.00
Stop Loss:   $435.00 (-1.14%)
Take Profit: $445.00 (+1.14%)
Risk:        $50
Reward:      $50
```

### Momentum Trade
```
Symbol:      TSLA
Direction:   BUY
Quantity:    5 shares
Entry:       $240.00
Stop Loss:   $235.00 (-2.08%)
Take Profit: $250.00 (+4.17%)
Risk:        $25
Reward:      $50
```

### Forex Scalp
```
Symbol:      EURUSD
Direction:   BUY
Quantity:    10,000 units
Entry:       1.0850
Stop Loss:   1.0830 (-20 pips)
Take Profit: 1.0890 (+40 pips)
Risk:        $20
Reward:      $40
```

## ⚠️ Common Mistakes to Avoid

1. **No Stop Loss** - Never trade without protection
2. **Too Large Position** - Start with 1-2% risk per trade
3. **Chasing Price** - Wait for your setup
4. **Emotional Trading** - Stick to your plan
5. **Overtrading** - Quality over quantity

## 🚀 Next Steps

Congratulations on your first trade! Here's what to do next:

1. **Practice More** - Place 10-20 paper trades
2. **Track Performance** - Use the trade journal
3. **Develop a Strategy** - See [Strategy Templates](../strategies/templates.md)
4. **Set Risk Rules** - Configure [Risk Management](../user-guide/risk-management.md)
5. **Automate** - Learn about [Algorithmic Trading](../strategies/framework.md)

## 💡 Pro Tips for New Traders

- **Start Small**: Risk only 1% per trade initially
- **Journal Everything**: Note your thoughts and emotions
- **Focus on Process**: Don't chase quick profits
- **Learn from Losses**: They're tuition for trading education
- **Be Patient**: Profitable trading takes time to develop

---

*Ready to level up? Explore [Strategy Development](../strategies/framework.md) or dive into [Advanced Trading Features](../user-guide/strategies.md).*