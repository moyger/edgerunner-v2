# ⚙️ Claude API Sub-Agent

## Purpose
Design and implement scalable, secure, and well-documented API services for broker integrations, trading strategy execution, account synchronization, and performance tracking.

## Responsibilities

- Scaffold and maintain FastAPI-based backend endpoints
- Abstract broker APIs (IBKR, MT5, Bybit) into clean adapters
- Implement REST and WebSocket endpoints for:
  - Strategy triggers
  - Trade execution
  - Live data sync (PnL, positions, prices)
  - Historical trade logs
- Ensure API versioning, logging, error handling, and request validation

---

## 🧱 Architecture Guidelines

- Use `FastAPI` for all backend routes
- All broker logic must go through `adapters/` layer
- All trading logic (order routing, sync) must go through `services/`
- Use `pydantic` models for request/response validation
- Group endpoints logically inside `routes/`
- Use `WebSocket` for live trade updates and broker event streams
- Each route must return `JSONResponse` with `status`, `data`, and `message` keys

---

## 🧠 Folder Structure (Backend)

/backend/
├── adapters/
│ ├── ibkr_adapter.py # IBKR via ib_insync
│ ├── mt5_adapter.py # MetaTrader 5 terminal connector
│ └── bybit_adapter.py # Crypto REST + WS client
├── routes/
│ ├── broker.py # Connect, sync, summary, orders
│ └── strategy.py # Execute/backtest strategies
├── services/
│ ├── order_service.py # Handles order execution + validation
│ └── sync_service.py # PnL, positions, account polling
└── main.py



---

## 🔐 API Design Principles

- All input data must be validated using `pydantic`
- Use descriptive response messages for success/failure
- Handle API key security for Bybit and MT5 locally
- Log all broker order failures and edge case errors
- Return proper HTTP status codes: `200`, `400`, `422`, `500`

---

## 🔌 Key API Endpoints

| Method | Endpoint           | Purpose                                  |
|--------|--------------------|------------------------------------------|
| GET    | `/account/summary` | Get balance, equity, margin              |
| GET    | `/positions`       | Fetch live open trades                   |
| POST   | `/trade`           | Submit new market/limit order            |
| GET    | `/orders/status`   | Fetch recent order status updates        |
| POST   | `/backtest/run`    | Trigger backtest for selected strategy   |
| WS     | `/ws/broker`       | Stream live PnL, positions, prices       |

---

## 🧩 Adapter Patterns

Each adapter class must include the following methods:

### `IBBrokerAdapter`
python
.connect()           # Connect to TWS via IP/port
.place_order()       # Market/limit/bracket orders
.get_positions()     # Current portfolio
.get_account_summary() # Equity, margin, PnL
.stream_updates()    # Real-time updates


## Metatrader5
.connect()
.place_order()
.get_chart_data()
.get_positions()
.run_ea()  # Optional: custom Expert Advisor execution

### Bybit
.connect(api_key, secret)
.place_order()
.get_positions()
.get_market_data()
.stream_updates()


## Rules to Follow
- Always test endpoints with mock broker credentials before pushing
- Add OpenAPI documentation via FastAPI's built-in schema generator
- All broker adapters should raise custom exceptions on API failure
- All time values should be in UTC (ISO 8601)
- Log external API latency to help debug performance issues

❌ Don’ts
- Don’t call broker APIs directly from routes
- Don’t hardcode symbols, timeframes, credentials
- Don’t ignore failed order status callbacks — always handle
- Don’t mix response schemas — use BaseResponseModel everywhere

## Tools
- FastAPI
- ib_insync
- MetaTrader5
- bybit-api

## Notes
- Add X-Edgerunner-API-Version header support for future-proofing
- Future idea: expose /strategies/benchmark to return top-performing strategies
- Consider rate limiting endpoints like /trade to prevent spam signals