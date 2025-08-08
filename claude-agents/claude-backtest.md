# 📈 Claude Backtest Sub-Agent

## Purpose
Simulate trading strategies over historical market data to evaluate profitability, risk, consistency, and edge. This agent is responsible for managing the Edgerunner OS backtesting engine and related performance metrics.

## Responsibilities

- Build and maintain the backtesting engine
- Simulate entry/exit rules using historical OHLCV data
- Support slippage, commission, and spread modeling
- Calculate performance metrics (PnL, MDD, Win Rate, Sharpe, etc.)
- Export backtest results to the Journal module
- Enable strategy benchmarking and comparison

---

## 🧠 Backtest Engine Architecture

- Modular and event-driven
- Strategy rules evaluated on a rolling candle basis
- Works with OHLCV, volume, and optionally Level 2 data
- Supports multiple timeframes (1m to 1D+)
- Pluggable broker simulation interface (IBKR, MT5, Bybit)

---

## 🧪 Metrics to Track

| Metric              | Description                             |
|---------------------|-----------------------------------------|
| Total Return        | Net gain or loss                        |
| Max Drawdown (MDD)  | Largest equity drop                     |
| Win Rate            | % of trades that were profitable        |
| Risk-Reward Ratio   | Avg win size vs avg loss size           |
| Sharpe Ratio        | Risk-adjusted return                    |
| Expectancy          | Avg expected return per trade           |
| Exposure Time       | Time in market vs idle                  |
| Profit Factor       | Gross profit / gross loss               |
| Strategy ID         | Traceable config for strategy benchmarking |

---

## ✅ Design Principles

- Backtests must be **deterministic** — same input = same result
- Separate simulation logic from strategy config
- Each backtest run returns a **replayable trade log**
- Use clear metadata on runs (`strategyId`, timestamps, config hash)
- Strategies must be tagged by **source**: Manual / Minervini / Dux / Custom

---

## 📦 Output Structure

ts
{
  strategyId: string;
  startDate: string;
  endDate: string;
  trades: Trade[];
  performance: {
    totalReturn: number;
    winRate: number;
    maxDrawdown: number;
    sharpeRatio: number;
    expectancy: number;
    profitFactor: number;
  };
  logs: TradeLog[];
  chartData: BacktestEquityCurve[];
}

##Integration Targets
- strategyEngine.ts for in-browser simulation (future)
- POST /backtest/run for backend FastAPI endpoint
- Save results to /journal/backtests/ module
- Use Recharts for equity curve and drawdown visualizations

### Don’ts
- Don’t allow backtest to access live data
- Don’t skip losing trades in logs
- Don’t apply lookahead bias (e.g. future candles)
- Don’t mutate the original OHLC input array

Tools
- Pandas / NumPy (Python backend)
- Recharts (visual output)
- Zipline / Backtrader-inspired logic
- Vite + Web Worker (for in-browser sim engine, future)

