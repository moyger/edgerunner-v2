# 🔌 Edgerunner OS: Broker API Integration PRD

This document outlines how Edgerunner OS will integrate with broker APIs—specifically **Interactive Brokers (IBKR)**, **MetaTrader 5 (MT5)**, and **Bybit**—to enable live trading, strategy automation, account synchronization, and backtesting.

---

## 🎯 Objective

Build seamless, production-grade API connections between Edgerunner OS and supported broker platforms to power automated trading features:

- Real-time market data
- Live & paper trading
- Automated strategy execution
- Portfolio and PnL synchronization

---

## 🛠️ Key Integration Goals

- Abstract broker APIs into unified adapter classes
- Route strategy signals to broker endpoints via FastAPI backend
- Enable WebSocket-based streaming for PnL, price, and position data
- Ensure compatibility with both demo and live accounts

---

## 🔍 Integration Scope

### 🟢 IBKR (Interactive Brokers)

- Connect via TWS or IB Gateway using `ib_insync`
- Fetch account summary, open positions, historical & real-time data
- Place market, limit, stop, and bracket orders
- Monitor order updates and account PnL in real time

### 🟢 MetaTrader 5 (MT5)

- Connect locally using `MetaTrader5` Python API
- Interface with Expert Advisors (EAs) and trade directly from scripts
- Retrieve historical OHLC, equity, and trade logs
- Enable automated order execution from strategy triggers

### 🟢 Bybit (Crypto Derivatives Exchange)

- Connect using REST and WebSocket APIs (V5)
- Authenticate using API key and secret
- Retrieve market depth, OHLC, ticker, and funding data
- Submit spot/futures orders and track open positions
- Subscribe to WebSocket channels for price/position updates

---

## 🧱 Tech Stack Overview

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Backend       | FastAPI (Python)                            |
| Broker APIs   | `ib_insync`, `MetaTrader5`, `bybit-api` SDK |
| Realtime Data | WebSockets via FastAPI                      |
| State Sync    | Zustand (frontend) + optional Redis         |
| Deployment    | Docker + Vercel + Railway/Render            |

---

## 📁 Backend Folder Structure

```bash
/backend
  ├── adapters/
  │   ├── ibkr_adapter.py
  │   ├── mt5_adapter.py
  │   └── bybit_adapter.py
  ├── routes/
  │   ├── broker.py
  │   └── strategy.py
  ├── services/
  │   ├── order_service.py
  │   └── sync_service.py
  └── main.py
```

---

## 📡 API Endpoints

| Method | Endpoint           | Description                            |
| ------ | ------------------ | -------------------------------------- |
| POST   | `/broker/connect`  | Establish broker connection            |
| GET    | `/account/summary` | Fetch account balance, margin, equity  |
| GET    | `/positions`       | Get current open positions             |
| POST   | `/trade`           | Execute market/limit orders            |
| GET    | `/orders/status`   | Fetch order status                     |
| POST   | `/backtest/run`    | Initiate a backtest from strategy data |
| WS     | `/ws/broker`       | Stream real-time data (PnL, price)     |

---

## 📚 Recommended API Resources

### ✅ IBKR (Interactive Brokers)

- [Official TWS API Docs](https://interactivebrokers.github.io/tws-api/introduction.html)
- [`ib_insync`](https://github.com/erdewit/ib_insync)[ GitHub](https://github.com/erdewit/ib_insync)
- [`ib_async`](https://github.com/ib-api-reloaded/ib_async)[ GitHub](https://github.com/ib-api-reloaded/ib_async)
- [IB Gateway Setup Guide](https://www.interactivebrokers.com/en/index.php?f=16457)
- Example Projects:
  - [IB Demo by hackingthemarkets](https://github.com/hackingthemarkets/interactive-brokers-demo)
  - [cosmoarunn/ib\_insync\_examples](https://github.com/cosmoarunn/ib_insync_examples)
  - [westonplatter/ib\_insync\_options](https://github.com/westonplatter/ib_insync_options)

### ✅ MetaTrader 5

- [Python API Docs](https://www.mql5.com/en/docs/integration/python_metatrader5)
- [MT5 Terminal Download](https://www.metatrader5.com/en)
- [MetaTrader5 SDK GitHub](https://github.com/metaquotes/MetaTrader5-SDK)

### ✅ Bybit

- [Bybit V5 API Docs](https://bybit-exchange.github.io/docs/v5/intro)
- [Official GitHub SDK (Python)](https://github.com/bybit-exchange/bybit-api)
- [WS Stream Reference](https://bybit-exchange.github.io/docs/v5/websocket/public/orderbook)
- Example integrations:
  - [Bybit Quickstart Python](https://github.com/robertzml/bybit-api)
  - [CryptoAlgoBot/Bybit](https://github.com/markbro/cryptobot-bybit)

---

## ⚙️ Broker Adapter Class Overview

### `IBBrokerAdapter`

- `.connect()` – Connect via TWS Gateway
- `.place_order()` – Send market/limit/bracket orders
- `.get_positions()` – Retrieve open positions
- `.get_account_summary()` – Account balance, margin, and PnL
- `.stream_updates()` – Real-time order/status events

### `MT5Adapter`

- `.connect()` – Launch MT5 terminal
- `.place_order()` – Submit trade orders
- `.get_chart_data()` – Fetch OHLC data
- `.get_positions()` – Current trade exposure
- `.run_ea()` – Launch custom EA logic (optional)

### `BybitAdapter`

- `.connect()` – Auth with API key + secret
- `.place_order()` – Submit spot/futures order
- `.get_positions()` – Open orders and exposure
- `.get_market_data()` – Tickers, depth, OHLC
- `.stream_updates()` – Live price and account updates

---
