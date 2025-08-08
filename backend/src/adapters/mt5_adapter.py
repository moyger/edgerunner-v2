"""
MetaTrader 5 Broker Adapter
Provides MT5 integration using the official MetaTrader5 Python package
"""
try:
    import MetaTrader5 as mt5
except ImportError:
    # Fall back to mock for development/testing on non-Windows systems
    from . import mock_mt5 as mt5
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import logging

try:
    from ..models import (
        BrokerConnection, BrokerCredentials, AccountSummary, Position, 
        Order, MarketData, HistoricalData, TestResult, OrderRequest
    )
    from .base import BrokerAdapter
    from ..config import settings
except ImportError:
    from models import (
        BrokerConnection, BrokerCredentials, AccountSummary, Position, 
        Order, MarketData, HistoricalData, TestResult, OrderRequest
    )
    from adapters.base import BrokerAdapter
    from config import settings

logger = logging.getLogger(__name__)


class MT5Adapter(BrokerAdapter):
    """MetaTrader 5 broker adapter implementation"""
    
    def __init__(self):
        super().__init__(broker_id="mt5", broker_name="MetaTrader 5")
        self.account_info: Optional[dict] = None
        self.server: Optional[str] = None
        self.login: Optional[int] = None
        
    async def connect(self, credentials: BrokerCredentials) -> BrokerConnection:
        """Establish connection to MT5 terminal"""
        try:
            # Extract credentials from Pydantic model
            login = int(getattr(credentials, 'username', 0))  # MT5 login is stored as username
            password = str(getattr(credentials, 'password', ''))
            server = str(getattr(credentials, 'server', ''))
            
            if not all([login, password, server]):
                # Try to use default credentials from settings if available
                login = login or int(getattr(settings, 'mt5_login', 0) or 0)
                password = password or getattr(settings, 'mt5_password', '')
                server = server or getattr(settings, 'mt5_server', '')
                
                if not all([login, password, server]):
                    raise ValueError("Missing required credentials: login, password, server. Configure via environment variables or provide in credentials.")
            
            # Check if we're using the mock MT5 module
            is_mock = False
            try:
                # Check if it's the mock module by looking for mock-specific attributes
                is_mock = (hasattr(mt5, '__version__') and mt5.__version__ == "5.0.45") or \
                          (hasattr(mt5, '__file__') and 'mock' in mt5.__file__.lower()) or \
                          mt5.__name__.endswith('mock_mt5')
            except AttributeError:
                # Real MT5 module might not have __file__ attribute
                pass
            
            if is_mock:
                logger.info("Using Mock MT5 module for development/testing on non-Windows system")
            
            # Initialize MT5 connection with path if available and not mock
            mt5_path = getattr(settings, 'mt5_path', None)
            if mt5_path and not is_mock:
                logger.info(f"Initializing MT5 with path: {mt5_path}")
                if not mt5.initialize(path=mt5_path):
                    error_msg = f"MT5 initialization with path failed: {mt5.last_error()}"
                    logger.error(error_msg)
                    # Try without path as fallback
                    if not mt5.initialize():
                        error_msg = f"MT5 initialization failed: {mt5.last_error()}"
                        logger.error(error_msg)
                        raise Exception(error_msg)
            else:
                # Initialize without path (or using mock)
                if not mt5.initialize():
                    if is_mock:
                        logger.warning("Mock MT5 initialization returned False, but continuing anyway")
                    else:
                        error_msg = f"MT5 initialization failed: {mt5.last_error()}. Ensure MT5 terminal is installed and running."
                        logger.error(error_msg)
                        raise Exception(error_msg)
            
            # Authorize with the trading account
            if not mt5.login(login, password, server):
                error_msg = f"MT5 login failed: {mt5.last_error()}"
                mt5.shutdown()
                logger.error(error_msg)
                raise Exception(error_msg)
            
            # Get account info to verify connection
            account_info = mt5.account_info()
            if account_info is None:
                error_msg = f"Failed to get account info: {mt5.last_error()}"
                mt5.shutdown()
                logger.error(error_msg)
                raise Exception(error_msg)
            
            # Store connection details
            self.account_info = account_info._asdict()
            self.server = server
            self.login = login
            self.connection_status = "connected"
            self.connected_at = datetime.now()
            self.last_error = None
            
            logger.info(f"Successfully connected to MT5 account {login} on {server}")
            logger.info(f"Account balance: {self.account_info.get('balance', 'N/A')} {self.account_info.get('currency', 'USD')}")
            
            return BrokerConnection(
                id="mt5",
                name="MetaTrader 5",
                status="connected",
                last_checked=datetime.now(),
            )
            
        except Exception as e:
            self.connection_status = "error"
            self.last_error = str(e)
            logger.error(f"MT5 connection failed: {e}")
            
            return BrokerConnection(
                id="mt5",
                name="MetaTrader 5",
                status="error",
                last_checked=datetime.now(),
                error=str(e)
            )
    
    async def disconnect(self) -> bool:
        """Disconnect from MT5 terminal"""
        try:
            mt5.shutdown()
            self.connection_status = "disconnected"
            self.connected_at = None
            self.account_info = None
            self.server = None
            self.login = None
            logger.info("Disconnected from MT5")
            return True
        except Exception as e:
            logger.error(f"Error disconnecting from MT5: {e}")
            return False
    
    async def get_connection_status(self) -> BrokerConnection:
        """Get current connection status"""
        try:
            if self.connection_status != "connected":
                return BrokerConnection(
                    id="mt5",
                    name="MetaTrader 5",
                    status=self.connection_status,
                    last_checked=datetime.now(),
                    error=self.last_error
                )
            
            # Verify connection is still active
            terminal_info = mt5.terminal_info()
            if terminal_info is None:
                self.connection_status = "error"
                error_msg = f"Terminal info failed: {mt5.last_error()}"
                return BrokerConnection(
                    id="mt5",
                    name="MetaTrader 5",
                    status="error",
                    last_checked=datetime.now(),
                    error=error_msg
                )
            
            return BrokerConnection(
                id="mt5",
                name="MetaTrader 5",
                status="connected",
                last_checked=datetime.now(),
            )
            
        except Exception as e:
            logger.error(f"Error checking MT5 status: {e}")
            return BrokerConnection(
                id="mt5",
                name="MetaTrader 5",
                status="error",
                last_checked=datetime.now(),
                error=str(e)
            )
    
    async def get_account_summary(self) -> AccountSummary:
        """Get account summary information"""
        if self.connection_status != "connected" or not self.account_info:
            raise Exception("Not connected to MT5")
        
        try:
            # Get fresh account info
            account_info = mt5.account_info()
            if account_info is None:
                raise Exception(f"Failed to get account info: {mt5.last_error()}")
            
            account_dict = account_info._asdict()
            
            return AccountSummary(
                account_id=str(account_dict.get('login', '')),
                total_cash=float(account_dict.get('balance', 0)),
                total_value=float(account_dict.get('equity', 0)),
                buying_power=float(account_dict.get('margin_free', 0)),
                margin_used=float(account_dict.get('margin', 0)),
                net_liquidation=float(account_dict.get('equity', 0)),
                currency=str(account_dict.get('currency', 'USD'))
            )
            
        except Exception as e:
            logger.error(f"Error getting MT5 account summary: {e}")
            raise Exception(f"Failed to get account summary: {e}")
    
    async def get_positions(self) -> List[Position]:
        """Get current positions"""
        if self.connection_status != "connected":
            raise Exception("Not connected to MT5")
        
        try:
            positions = mt5.positions_get()
            if positions is None:
                positions = ()  # Empty tuple if no positions
            
            position_list = []
            for pos in positions:
                pos_dict = pos._asdict()
                
                position_list.append(Position(
                    symbol=str(pos_dict.get('symbol', '')),
                    position=float(pos_dict.get('volume', 0)),
                    market_price=float(pos_dict.get('price_current', 0)),
                    market_value=float(pos_dict.get('volume', 0) * pos_dict.get('price_current', 0)),
                    average_cost=float(pos_dict.get('price_open', 0)),
                    unrealized_pnl=float(pos_dict.get('profit', 0)),
                    realized_pnl=0.0  # MT5 doesn't provide realized P&L in position
                ))
            
            return position_list
            
        except Exception as e:
            logger.error(f"Error getting MT5 positions: {e}")
            raise Exception(f"Failed to get positions: {e}")
    
    async def get_market_data(self, symbol: str) -> MarketData:
        """Get real-time market data for symbol"""
        if self.connection_status != "connected":
            raise Exception("Not connected to MT5")
        
        try:
            # Get symbol tick
            tick = mt5.symbol_info_tick(symbol)
            if tick is None:
                raise Exception(f"Failed to get tick data for {symbol}: {mt5.last_error()}")
            
            tick_dict = tick._asdict()
            
            # Get daily data for high/low/close
            rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_D1, 0, 2)
            if rates is None or len(rates) == 0:
                # Use tick data as fallback
                high = low = close = tick_dict.get('last', 0)
            else:
                latest = rates[-1]
                high = float(latest['high'])
                low = float(latest['low'])
                close = float(latest['close'])
            
            return MarketData(
                symbol=symbol,
                bid=float(tick_dict.get('bid', 0)),
                ask=float(tick_dict.get('ask', 0)),
                last=float(tick_dict.get('last', 0)),
                high=high,
                low=low,
                close=close,
                volume=float(tick_dict.get('volume', 0)),
                timestamp=datetime.fromtimestamp(tick_dict.get('time', 0)).isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error getting MT5 market data for {symbol}: {e}")
            raise Exception(f"Failed to get market data: {e}")
    
    async def get_historical_data(
        self, 
        symbol: str, 
        duration: str, 
        bar_size: str
    ) -> HistoricalData:
        """Get historical market data"""
        if self.connection_status != "connected":
            raise Exception("Not connected to MT5")
        
        try:
            # Map bar_size to MT5 timeframes
            timeframe_map = {
                '1 min': mt5.TIMEFRAME_M1,
                '5 mins': mt5.TIMEFRAME_M5,
                '15 mins': mt5.TIMEFRAME_M15,
                '30 mins': mt5.TIMEFRAME_M30,
                '1 hour': mt5.TIMEFRAME_H1,
                '4 hours': mt5.TIMEFRAME_H4,
                '1 day': mt5.TIMEFRAME_D1,
            }
            
            timeframe = timeframe_map.get(bar_size, mt5.TIMEFRAME_D1)
            
            # Parse duration (e.g., "1 Y", "6 M", "30 D")
            duration_parts = duration.split()
            if len(duration_parts) != 2:
                raise ValueError(f"Invalid duration format: {duration}")
            
            amount = int(duration_parts[0])
            unit = duration_parts[1].upper()
            
            # Calculate number of bars to fetch
            if unit == 'Y':
                bars_count = amount * 365  # Approximate
            elif unit == 'M':
                bars_count = amount * 30   # Approximate
            elif unit == 'D':
                bars_count = amount
            else:
                bars_count = 100  # Default
            
            # Adjust based on timeframe
            if bar_size == '1 min':
                bars_count = min(bars_count * 1440, 10000)  # Limit to prevent timeouts
            elif bar_size == '5 mins':
                bars_count = min(bars_count * 288, 10000)
            elif bar_size == '1 hour':
                bars_count = min(bars_count * 24, 10000)
            
            # Fetch historical data
            rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, int(bars_count))
            if rates is None:
                raise Exception(f"Failed to get historical data for {symbol}: {mt5.last_error()}")
            
            # Convert to required format
            data = []
            for rate in rates:
                data.append({
                    "date": datetime.fromtimestamp(rate['time']).isoformat(),
                    "open": float(rate['open']),
                    "high": float(rate['high']),
                    "low": float(rate['low']),
                    "close": float(rate['close']),
                    "volume": float(rate['tick_volume'])
                })
            
            return HistoricalData(
                symbol=symbol,
                data=data
            )
            
        except Exception as e:
            logger.error(f"Error getting MT5 historical data for {symbol}: {e}")
            raise Exception(f"Failed to get historical data: {e}")
    
    async def place_order(self, order: OrderRequest) -> Order:
        """Place a trading order"""
        if self.connection_status != "connected":
            raise Exception("Not connected to MT5")
        
        try:
            # Map order types
            action_map = {
                'BUY': mt5.ORDER_TYPE_BUY,
                'SELL': mt5.ORDER_TYPE_SELL
            }
            
            order_type_map = {
                'MKT': mt5.ORDER_TYPE_BUY if order.action == 'BUY' else mt5.ORDER_TYPE_SELL,
                'LMT': mt5.ORDER_TYPE_BUY_LIMIT if order.action == 'BUY' else mt5.ORDER_TYPE_SELL_LIMIT,
                'STP': mt5.ORDER_TYPE_BUY_STOP if order.action == 'BUY' else mt5.ORDER_TYPE_SELL_STOP
            }
            
            mt5_order_type = order_type_map.get(order.orderType, mt5.ORDER_TYPE_BUY)
            
            # Prepare order request
            request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": order.symbol,
                "volume": float(order.totalQuantity),
                "type": mt5_order_type,
                "deviation": 20,
                "magic": 234000,
                "comment": "python script order",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }
            
            # Add price for limit/stop orders
            if order.orderType in ['LMT', 'STP'] and order.lmtPrice:
                request["price"] = float(order.lmtPrice)
            
            # Send order
            result = mt5.order_send(request)
            if result is None:
                raise Exception(f"Order send failed: {mt5.last_error()}")
            
            result_dict = result._asdict()
            
            # Map MT5 result codes to status
            retcode = result_dict.get('retcode', 0)
            if retcode == mt5.TRADE_RETCODE_DONE:
                status = 'Filled'
            elif retcode in [mt5.TRADE_RETCODE_PLACED, mt5.TRADE_RETCODE_DONE_PARTIAL]:
                status = 'Submitted'
            else:
                status = 'Error'
            
            return Order(
                orderId=str(result_dict.get('order', 0)),
                symbol=order.symbol,
                action=order.action,
                orderType=order.orderType,
                totalQuantity=order.totalQuantity,
                lmtPrice=order.lmtPrice,
                auxPrice=order.auxPrice,
                status=status,
                filled=float(result_dict.get('volume', 0)),
                remaining=order.totalQuantity - float(result_dict.get('volume', 0)),
                avgFillPrice=float(result_dict.get('price', 0)),
                timestamp=datetime.now().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error placing MT5 order: {e}")
            raise Exception(f"Failed to place order: {e}")
    
    async def get_order_status(self, order_id: str) -> Order:
        """Get order status"""
        if self.connection_status != "connected":
            raise Exception("Not connected to MT5")
        
        try:
            # Try to get from history first
            orders = mt5.history_orders_get(ticket=int(order_id))
            if orders and len(orders) > 0:
                order = orders[0]
                order_dict = order._asdict()
                
                # Map MT5 states to our status
                state = order_dict.get('state', 0)
                if state == mt5.ORDER_STATE_FILLED:
                    status = 'Filled'
                elif state == mt5.ORDER_STATE_CANCELED:
                    status = 'Cancelled'
                elif state == mt5.ORDER_STATE_PARTIAL:
                    status = 'Submitted'
                else:
                    status = 'Error'
                
                return Order(
                    orderId=str(order_dict.get('ticket', '')),
                    symbol=str(order_dict.get('symbol', '')),
                    action='BUY' if order_dict.get('type', 0) in [mt5.ORDER_TYPE_BUY, mt5.ORDER_TYPE_BUY_LIMIT] else 'SELL',
                    orderType='LMT' if 'LIMIT' in str(order_dict.get('type', '')) else 'MKT',
                    totalQuantity=float(order_dict.get('volume_initial', 0)),
                    lmtPrice=float(order_dict.get('price_open', 0)),
                    status=status,
                    filled=float(order_dict.get('volume_current', 0)),
                    remaining=float(order_dict.get('volume_initial', 0)) - float(order_dict.get('volume_current', 0)),
                    avgFillPrice=float(order_dict.get('price_current', 0)),
                    timestamp=datetime.fromtimestamp(order_dict.get('time_setup', 0)).isoformat()
                )
            
            # Check active orders
            orders = mt5.orders_get(ticket=int(order_id))
            if orders and len(orders) > 0:
                order = orders[0]
                order_dict = order._asdict()
                
                return Order(
                    orderId=str(order_dict.get('ticket', '')),
                    symbol=str(order_dict.get('symbol', '')),
                    action='BUY' if order_dict.get('type', 0) in [mt5.ORDER_TYPE_BUY, mt5.ORDER_TYPE_BUY_LIMIT] else 'SELL',
                    orderType='LMT' if 'LIMIT' in str(order_dict.get('type', '')) else 'MKT',
                    totalQuantity=float(order_dict.get('volume_initial', 0)),
                    lmtPrice=float(order_dict.get('price_open', 0)),
                    status='Submitted',
                    filled=0.0,
                    remaining=float(order_dict.get('volume_current', 0)),
                    avgFillPrice=0.0,
                    timestamp=datetime.fromtimestamp(order_dict.get('time_setup', 0)).isoformat()
                )
            
            # Order not found
            raise Exception(f"Order {order_id} not found")
            
        except Exception as e:
            logger.error(f"Error getting MT5 order status: {e}")
            raise Exception(f"Failed to get order status: {e}")
    
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an order"""
        if self.connection_status != "connected":
            raise Exception("Not connected to MT5")
        
        try:
            # Prepare cancel request
            request = {
                "action": mt5.TRADE_ACTION_REMOVE,
                "order": int(order_id),
            }
            
            result = mt5.order_send(request)
            if result is None:
                return False
            
            result_dict = result._asdict()
            return result_dict.get('retcode') == mt5.TRADE_RETCODE_DONE
            
        except Exception as e:
            logger.error(f"Error canceling MT5 order: {e}")
            return False
    
    # Override test methods for MT5-specific testing
    async def test_market_data(self, symbol: str = "EURUSD") -> TestResult:
        """Test market data retrieval with MT5-appropriate symbol"""
        return await super().test_market_data(symbol)
    
    async def get_available_symbols(self, limit: int = 100) -> List[str]:
        """Get list of available symbols from MT5"""
        if self.connection_status != "connected":
            raise Exception("Not connected to MT5")
        
        try:
            symbols = mt5.symbols_get()
            if symbols is None:
                return []
            
            return [symbol.name for symbol in symbols[:limit] if symbol.visible]
            
        except Exception as e:
            logger.error(f"Error getting MT5 symbols: {e}")
            return []
    
    def __del__(self):
        """Cleanup on destruction"""
        try:
            if self.connection_status == "connected":
                mt5.shutdown()
        except:
            pass