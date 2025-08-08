# IBKR Flex Query Setup Guide

## Overview

Your IBKR Flex Query integration is now fully implemented and ready to use. You just need to configure your IBKR Flex Query token to access your historical trading data.

## Current Status ✅

- ✅ **Flex Query Service**: Complete implementation with XML parsing and performance metrics
- ✅ **API Endpoints**: 5 Flex Query endpoints added to `/api/flex-query/...`
- ✅ **Data Models**: Comprehensive models for trades, positions, cash transactions, and performance metrics
- ✅ **Configuration**: Backend configured to use your "Edgerunner" query for all data types
- ❌ **Token**: IBKR_FLEX_TOKEN needs to be set in your `.env` file

## Step 1: Get Your IBKR Flex Query Token

1. **Log into IBKR**: Go to your Interactive Brokers account
2. **Navigate to Settings**: Account Management → Settings → API → Settings
3. **Find Flex Web Service**: Look for "Flex Web Service" section
4. **Generate/Copy Token**: Get your Flex Web Service token
5. **Update .env file**: Add this line to your `.env` file:
   ```
   IBKR_FLEX_TOKEN=your_actual_token_here
   ```

## Step 2: Test Your Setup

Run the test script to verify everything works:

```bash
cd /Users/karlomarceloestrada/Documents/@Projects/edgerunner-v2/backend
python3 test_flex_query.py
```

This will:
- Validate your token setup
- Execute your "Edgerunner" Flex Query
- Show you sample data from your trading history

## Step 3: Start Using the API

### Start the Backend Server
```bash
python3 -m uvicorn src.main:app --reload
```

### Available Flex Query Endpoints

1. **Execute Flex Query**
   ```
   POST /api/flex-query/execute
   Body: {"query_id": "Edgerunner", "token": "your_token", "broker": "ibkr"}
   ```

2. **Get Query Data**
   ```
   GET /api/flex-query/{reference_code}/data?token=your_token
   ```

3. **Get Trade History (Convenience)**
   ```
   GET /api/flex-query/trades/Edgerunner?token=your_token&broker=ibkr
   ```

4. **Calculate Performance Metrics**
   ```
   POST /api/flex-query/performance?reference_code={code}&token={token}&start_date=2024-01-01&end_date=2024-12-31
   ```

5. **Check Query Status**
   ```
   GET /api/flex-query/{reference_code}/status
   ```

## Data Types You Can Access

Based on your "Edgerunner" Flex Query, you can access:

- **Trades**: Complete trade history with commissions, P&L, dates
- **Positions**: Current and historical position data
- **Cash Transactions**: Deposits, withdrawals, dividends, fees
- **Performance Metrics**: Automated calculation of:
  - Total P&L (realized and unrealized)
  - Win rate and profit factor
  - Maximum drawdown
  - Average winning/losing trades
  - Total commissions and fees

## Data Structure Example

```json
{
  "query_id": "reference_code_123",
  "data_type": "trades",
  "total_records": 245,
  "records": [
    {
      "trade_date": "2024-01-15",
      "symbol": "AAPL",
      "quantity": 100,
      "price": 185.50,
      "proceeds": 18550.00,
      "commission": 1.00,
      "realized_pnl": 1250.00
    }
  ],
  "generated_at": "2024-01-20T10:30:00"
}
```

## Next Steps After Token Setup

1. **View Your Data**: Run the test script to see your actual trading data
2. **API Integration**: Use the Flex Query endpoints in your frontend
3. **Build Visualizations**: Create charts and dashboards using the comprehensive data
4. **Performance Analysis**: Use the automated performance metrics calculations

## Troubleshooting

- **Token Issues**: Make sure you're using the Flex Web Service token (not API token)
- **Query Timeout**: IBKR queries can take 30-60 seconds to complete
- **No Data**: Verify your "Edgerunner" query includes the data types you want
- **Server Issues**: Make sure backend is running on port 8000

## Configuration Summary

Your `.env` file should include:
```
IBKR_FLEX_TOKEN=your_actual_token_here
IBKR_FLEX_QUERY_TRADES=Edgerunner
IBKR_FLEX_QUERY_POSITIONS=Edgerunner
IBKR_FLEX_QUERY_CASH_TRANSACTIONS=Edgerunner
```

You now have access to comprehensive historical data for:
- ✅ Trade analysis and performance tracking
- ✅ Commission and fee analysis  
- ✅ P&L reporting with daily/monthly breakdowns
- ✅ Advanced performance metrics (Sharpe ratio, drawdown, etc.)

**Ready to view your data!** Just add your IBKR_FLEX_TOKEN and run the test script.