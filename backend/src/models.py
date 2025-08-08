"""
Pydantic models for API requests and responses
"""
from typing import Dict, List, Optional, Union, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class BrokerType(str, Enum):
    """Supported broker types"""
    IBKR = "ibkr"
    MT5 = "mt5"
    BYBIT = "bybit"


class ConnectionStatus(str, Enum):
    """Connection status values"""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    ERROR = "error"


class OrderAction(str, Enum):
    """Order actions"""
    BUY = "BUY"
    SELL = "SELL"


class OrderType(str, Enum):
    """Order types"""
    MARKET = "MKT"
    LIMIT = "LMT"
    STOP = "STP"
    STOP_LIMIT = "STP_LMT"


class OrderStatus(str, Enum):
    """Order status values"""
    PENDING_SUBMIT = "PendingSubmit"
    SUBMITTED = "Submitted"
    FILLED = "Filled"
    CANCELLED = "Cancelled"
    ERROR = "Error"


class TestStatus(str, Enum):
    """Test execution status"""
    PASSED = "passed"
    FAILED = "failed"
    RUNNING = "running"
    NOT_RUN = "not-run"


# Request Models
class BrokerCredentials(BaseModel):
    """Generic broker credentials"""
    username: Optional[str] = None
    password: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    client_id: Optional[int] = None
    api_key: Optional[str] = None
    secret_key: Optional[str] = None
    server: Optional[str] = None
    path: Optional[str] = None
    base_url: Optional[str] = None
    recv_window: Optional[int] = None


class BrokerConnectionRequest(BaseModel):
    """Request to establish broker connection"""
    broker: BrokerType
    credentials: BrokerCredentials


class BrokerDisconnectionRequest(BaseModel):
    """Request to disconnect from broker"""
    broker: BrokerType


class OrderRequest(BaseModel):
    """Order placement request"""
    broker: BrokerType
    symbol: str
    action: OrderAction
    order_type: OrderType
    quantity: float
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None


class TestRequest(BaseModel):
    """API test execution request"""
    broker: BrokerType
    categories: Optional[List[str]] = None


# Response Models
class BrokerConnection(BaseModel):
    """Broker connection status response"""
    id: str
    name: str
    status: ConnectionStatus
    last_checked: datetime
    error: Optional[str] = None


class AccountSummary(BaseModel):
    """Account summary information"""
    account_id: str
    total_cash: float
    total_value: float
    buying_power: float
    margin_used: float
    net_liquidation: float
    currency: str


class Position(BaseModel):
    """Trading position information"""
    symbol: str
    position: float
    market_price: float
    market_value: float
    average_cost: float
    unrealized_pnl: float
    realized_pnl: float


class Order(BaseModel):
    """Order information"""
    order_id: str
    symbol: str
    action: OrderAction
    order_type: OrderType
    total_quantity: float
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None
    status: OrderStatus
    filled: float
    remaining: float
    avg_fill_price: float
    timestamp: datetime


class MarketData(BaseModel):
    """Market data snapshot"""
    symbol: str
    bid: float
    ask: float
    last: float
    high: float
    low: float
    close: float
    volume: int
    timestamp: datetime


class HistoricalBar(BaseModel):
    """Single historical data bar"""
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int


class HistoricalData(BaseModel):
    """Historical market data"""
    symbol: str
    data: List[HistoricalBar]


class TestResult(BaseModel):
    """API test result"""
    test_id: str
    category: str
    name: str
    status: TestStatus
    duration: Optional[float] = None
    timestamp: Optional[datetime] = None
    error: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


# WebSocket Models
class RealTimeUpdate(BaseModel):
    """Real-time data update"""
    type: str
    symbol: Optional[str] = None
    data: Dict[str, Any]
    timestamp: datetime


# IBKR Flex Query Models
class FlexQueryStatus(str, Enum):
    """Flex query execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class FlexQueryRequest(BaseModel):
    """Request to execute a flex query"""
    query_id: str
    token: str
    broker: str = "ibkr"


class FlexQueryResponse(BaseModel):
    """Flex query execution response"""
    query_id: str
    reference_code: Optional[str] = None
    status: FlexQueryStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class FlexQueryData(BaseModel):
    """Parsed flex query data"""
    query_id: str
    data_type: str  # "trades", "positions", "cash_transactions", etc.
    records: List[Dict[str, Any]]
    total_records: int
    generated_at: datetime


class TradeRecord(BaseModel):
    """Individual trade record from flex query"""
    symbol: str
    trade_date: datetime
    settle_date: datetime
    quantity: float
    price: float
    proceeds: float
    commission: float
    fees: float
    realized_pnl: float
    order_id: str
    execution_id: str
    currency: str = "USD"
    asset_category: str
    buy_sell: str
    open_close: str


class CashTransaction(BaseModel):
    """Cash transaction record from flex query"""
    transaction_id: str
    date: datetime
    description: str
    amount: float
    currency: str = "USD"
    type: str  # "Deposits & Withdrawals", "Dividends", "Interest", etc.
    symbol: Optional[str] = None


class PositionRecord(BaseModel):
    """Position record from flex query"""
    symbol: str
    position: float
    mark_price: float
    position_value: float
    open_price: float
    unrealized_pnl: float
    currency: str = "USD"
    asset_category: str
    report_date: datetime


class PerformanceMetrics(BaseModel):
    """Performance analytics from flex query data"""
    total_realized_pnl: float
    total_unrealized_pnl: float
    total_commissions: float
    total_fees: float
    net_pnl: float
    win_rate: float
    profit_factor: float
    sharpe_ratio: Optional[float] = None
    max_drawdown: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    avg_winning_trade: float
    avg_losing_trade: float
    largest_win: float
    largest_loss: float
    period_start: datetime
    period_end: datetime


# Strategy Models (for future use)
class StrategySignal(BaseModel):
    """Trading strategy signal"""
    strategy_id: str
    symbol: str
    action: OrderAction
    quantity: float
    confidence: float
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


class StrategyPerformance(BaseModel):
    """Strategy performance metrics"""
    strategy_id: str
    total_return: float
    daily_return: float
    win_rate: float
    sharpe_ratio: float
    max_drawdown: float
    total_trades: int
    winning_trades: int
    losing_trades: int


# Response wrappers
class SuccessResponse(BaseModel):
    """Generic success response"""
    success: bool = True
    message: str
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Generic error response"""
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None


# Health check
class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    timestamp: datetime
    version: str
    uptime: float