"""
Interactive Brokers adapter using ib_insync
"""
import asyncio
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from ib_insync import IB, Stock, MarketOrder, LimitOrder, Contract
from ib_insync.objects import Position as IBPosition, AccountValue, TickData

try:
    from .base import BrokerAdapter
except ImportError:
    from adapters.base import BrokerAdapter
try:
    from ..models import (
        BrokerConnection, BrokerCredentials, AccountSummary, Position, 
        Order, MarketData, HistoricalData, HistoricalBar, OrderRequest,
        OrderAction, OrderType, OrderStatus
    )
except ImportError:
    from models import (
        BrokerConnection, BrokerCredentials, AccountSummary, Position, 
        Order, MarketData, HistoricalData, HistoricalBar, OrderRequest,
        OrderAction, OrderType, OrderStatus
    )
try:
    from ..config import settings
except ImportError:
    from config import settings

logger = logging.getLogger(__name__)


class IBKRAdapter(BrokerAdapter):
    """Interactive Brokers API adapter using ib_insync"""
    
    def __init__(self):
        super().__init__("ibkr", "Interactive Brokers")
        self.ib = IB()
        self.ib.errorEvent += self._on_error
        self.ib.disconnectedEvent += self._on_disconnected
        
        # Auto-connect on initialization
        self._auto_connect()
    
    def _auto_connect(self):
        """Attempt to auto-connect to IBKR Gateway on startup"""
        try:
            # Try to connect using default settings
            host = settings.ibkr_host
            port = settings.ibkr_port  
            client_id = settings.ibkr_client_id
            
            logger.info(f"Auto-connecting to IBKR at {host}:{port} with client ID {client_id}")
            
            # Use synchronous connect for initialization with timeout
            self.ib.connect(host=host, port=port, clientId=client_id, timeout=5)
            
            if self.ib.isConnected():
                self.connection_status = "connected"
                self.connected_at = datetime.now()
                logger.info("✅ Successfully auto-connected to IBKR Gateway")
                
                # Verify we can get account info
                try:
                    accounts = self.ib.managedAccounts()
                    if accounts:
                        logger.info(f"📊 Connected to accounts: {accounts}")
                    else:
                        logger.warning("⚠️ Connected but no accounts available")
                except Exception as account_error:
                    logger.warning(f"⚠️ Connected but account verification failed: {account_error}")
            else:
                self.connection_status = "disconnected"
                logger.warning("⚠️ Auto-connect to IBKR failed - Gateway may not be running")
                
        except Exception as e:
            self.connection_status = "disconnected"
            self.last_error = str(e)
            logger.warning(f"⚠️ Auto-connect to IBKR failed: {e}")
            logger.info("💡 This is normal if IBKR Gateway/TWS is not running yet")
            logger.info("💡 To resolve: 1) Start TWS/Gateway 2) Ensure paper trading mode 3) Check port 7497")
        
    def _on_error(self, reqId, errorCode, errorString, contract):
        """Handle IB API errors"""
        logger.error(f"IBKR Error {errorCode}: {errorString}")
        self.last_error = f"Error {errorCode}: {errorString}"
    
    def _on_disconnected(self):
        """Handle disconnection"""
        logger.info("IBKR disconnected")
        self.connection_status = "disconnected"
        self.connected_at = None
        
        # Try to reconnect after a short delay
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            loop.call_later(5, self._attempt_reconnect)  # Reconnect after 5 seconds
        except:
            pass  # Ignore if no event loop
    
    def _attempt_reconnect(self):
        """Attempt to reconnect to IBKR"""
        try:
            if not self.ib.isConnected():
                logger.info("Attempting to reconnect to IBKR...")
                self._auto_connect()
        except Exception as e:
            logger.warning(f"Reconnection attempt failed: {e}")
    
    async def connect(self, credentials: BrokerCredentials) -> BrokerConnection:
        """Connect to Interactive Brokers TWS/Gateway"""
        try:
            self.connection_status = "connecting"
            
            # Use provided credentials or defaults from settings
            host = credentials.host or settings.ibkr_host
            port = credentials.port or settings.ibkr_port
            client_id = credentials.client_id or settings.ibkr_client_id
            
            logger.info(f"Connecting to IBKR at {host}:{port} with client ID {client_id}")
            
            # Connect to TWS/Gateway
            await self.ib.connectAsync(host=host, port=port, clientId=client_id)
            
            # Verify connection
            if self.ib.isConnected():
                self.connection_status = "connected"
                self.connected_at = datetime.now()
                logger.info("Successfully connected to IBKR")
                
                return BrokerConnection(
                    id=self.broker_id,
                    name=self.broker_name,
                    status="connected",
                    last_checked=datetime.now()
                )
            else:
                raise Exception("Failed to establish connection")
                
        except Exception as e:
            self.connection_status = "error"
            self.last_error = str(e)
            logger.error(f"IBKR connection failed: {e}")
            
            return BrokerConnection(
                id=self.broker_id,
                name=self.broker_name,
                status="error",
                last_checked=datetime.now(),
                error=str(e)
            )
    
    async def disconnect(self) -> bool:
        """Disconnect from IBKR"""
        try:
            if self.ib.isConnected():
                self.ib.disconnect()
            
            self.connection_status = "disconnected"
            self.connected_at = None
            logger.info("Disconnected from IBKR")
            return True
            
        except Exception as e:
            logger.error(f"IBKR disconnection error: {e}")
            return False
    
    async def get_connection_status(self) -> BrokerConnection:
        """Get current connection status"""
        is_connected = self.ib.isConnected()
        
        return BrokerConnection(
            id=self.broker_id,
            name=self.broker_name,
            status="connected" if is_connected else "disconnected",
            last_checked=datetime.now(),
            error=self.last_error
        )
    
    async def get_account_summary(self) -> AccountSummary:
        """Get account summary from IBKR"""
        if not self.ib.isConnected():
            raise Exception("Not connected to IBKR")
        
        try:
            # Get account values
            account_values = self.ib.accountValues()
            
            # Extract key values
            values_dict = {av.tag: float(av.value) for av in account_values if av.value.replace('-', '').replace('.', '').isdigit()}
            
            # Get account ID
            accounts = self.ib.managedAccounts()
            account_id = accounts[0] if accounts else "Unknown"
            
            return AccountSummary(
                account_id=account_id,
                total_cash=values_dict.get('TotalCashValue', 0.0),
                total_value=values_dict.get('NetLiquidation', 0.0),
                buying_power=values_dict.get('BuyingPower', 0.0),
                margin_used=values_dict.get('InitMarginReq', 0.0),
                net_liquidation=values_dict.get('NetLiquidation', 0.0),
                currency=values_dict.get('Currency', 'USD')
            )
            
        except Exception as e:
            logger.error(f"Failed to get account summary: {e}")
            raise
    
    async def get_positions(self) -> List[Position]:
        """Get current positions"""
        if not self.ib.isConnected():
            raise Exception("Not connected to IBKR")
        
        try:
            positions = self.ib.positions()
            result = []
            
            for pos in positions:
                if pos.position != 0:  # Only include non-zero positions
                    # Get current market data for the contract
                    ticker = self.ib.reqMktData(pos.contract)
                    await asyncio.sleep(2)  # Wait longer for data
                    
                    # Try multiple price sources
                    market_price = None
                    if hasattr(ticker, 'marketPrice') and ticker.marketPrice():
                        market_price = ticker.marketPrice()
                    elif ticker.close and str(ticker.close).lower() != 'nan':
                        market_price = ticker.close
                    elif ticker.last and str(ticker.last).lower() != 'nan':
                        market_price = ticker.last
                    elif ticker.bid and ticker.ask:
                        market_price = (ticker.bid + ticker.ask) / 2
                    
                    if market_price is None or str(market_price).lower() == 'nan':
                        market_price = 0.0
                        logger.warning(f"No market data available for {pos.contract.symbol}")
                    market_value = pos.position * market_price
                    unrealized_pnl = getattr(pos, 'unrealizedPNL', 0.0)
                    if unrealized_pnl is None or str(unrealized_pnl).lower() == 'nan':
                        unrealized_pnl = 0.0
                    
                    avg_cost = pos.avgCost
                    if avg_cost is None or str(avg_cost).lower() == 'nan':
                        avg_cost = 0.0
                        
                    result.append(Position(
                        symbol=pos.contract.symbol,
                        position=pos.position,
                        market_price=market_price,
                        market_value=market_value,
                        average_cost=avg_cost,
                        unrealized_pnl=unrealized_pnl,
                        realized_pnl=0.0  # IBKR doesn't provide this directly
                    ))
                    
                    # Cancel market data to avoid data fees
                    self.ib.cancelMktData(pos.contract)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get positions: {e}")
            raise
    
    async def get_market_data(self, symbol: str) -> MarketData:
        """Get real-time market data"""
        if not self.ib.isConnected():
            raise Exception("Not connected to IBKR")
        
        try:
            # Create contract (assuming US stocks for now)
            contract = Stock(symbol, 'SMART', 'USD')
            
            # Request market data
            ticker = self.ib.reqMktData(contract)
            
            # Wait for data to arrive
            await asyncio.sleep(2)
            
            if not ticker.bid or not ticker.ask:
                # Try to get delayed data if live data is not available
                await asyncio.sleep(3)
            
            # Handle NaN values in market data
            bid = ticker.bid or 0.0
            if str(bid).lower() == 'nan':
                bid = 0.0
            ask = ticker.ask or 0.0
            if str(ask).lower() == 'nan':
                ask = 0.0
            last = ticker.last or ticker.close or 0.0
            if str(last).lower() == 'nan':
                last = 0.0
            high = ticker.high or 0.0
            if str(high).lower() == 'nan':
                high = 0.0
            low = ticker.low or 0.0
            if str(low).lower() == 'nan':
                low = 0.0
            close = ticker.close or 0.0
            if str(close).lower() == 'nan':
                close = 0.0
            volume = ticker.volume or 0
            if str(volume).lower() == 'nan':
                volume = 0
            
            return MarketData(
                symbol=symbol,
                bid=bid,
                ask=ask,
                last=last,
                high=high,
                low=low,
                close=close,
                volume=int(volume),
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Failed to get market data for {symbol}: {e}")
            raise
        finally:
            try:
                self.ib.cancelMktData(contract)
            except:
                pass
    
    async def get_historical_data(
        self, 
        symbol: str, 
        duration: str = "1 D", 
        bar_size: str = "1 min"
    ) -> HistoricalData:
        """Get historical market data"""
        if not self.ib.isConnected():
            raise Exception("Not connected to IBKR")
        
        try:
            contract = Stock(symbol, 'SMART', 'USD')
            
            # Request historical data
            bars = self.ib.reqHistoricalData(
                contract,
                endDateTime='',
                durationStr=duration,
                barSizeSetting=bar_size,
                whatToShow='TRADES',
                useRTH=True,
                formatDate=1
            )
            
            # Convert to our format
            historical_bars = []
            for bar in bars:
                historical_bars.append(HistoricalBar(
                    date=bar.date,
                    open=bar.open,
                    high=bar.high,
                    low=bar.low,
                    close=bar.close,
                    volume=int(bar.volume)
                ))
            
            return HistoricalData(
                symbol=symbol,
                data=historical_bars
            )
            
        except Exception as e:
            logger.error(f"Failed to get historical data for {symbol}: {e}")
            raise
    
    async def place_order(self, order_request: OrderRequest) -> Order:
        """Place a trading order"""
        if not self.ib.isConnected():
            raise Exception("Not connected to IBKR")
        
        if not settings.paper_trading_only:
            logger.warning("Live trading is disabled for safety")
            raise Exception("Live trading is disabled. Only paper trading is allowed.")
        
        try:
            # Create contract
            contract = Stock(order_request.symbol, 'SMART', 'USD')
            
            # Create order
            if order_request.order_type == OrderType.MARKET:
                ib_order = MarketOrder(
                    action=order_request.action.value,
                    totalQuantity=order_request.quantity
                )
            elif order_request.order_type == OrderType.LIMIT:
                if not order_request.limit_price:
                    raise Exception("Limit price required for limit orders")
                ib_order = LimitOrder(
                    action=order_request.action.value,
                    totalQuantity=order_request.quantity,
                    lmtPrice=order_request.limit_price
                )
            else:
                raise Exception(f"Order type {order_request.order_type} not implemented")
            
            # Place order
            trade = self.ib.placeOrder(contract, ib_order)
            
            # Wait for order to be submitted
            await asyncio.sleep(1)
            
            return Order(
                order_id=str(trade.order.orderId),
                symbol=order_request.symbol,
                action=order_request.action,
                order_type=order_request.order_type,
                total_quantity=order_request.quantity,
                limit_price=order_request.limit_price,
                stop_price=order_request.stop_price,
                status=self._convert_order_status(trade.orderStatus.status),
                filled=trade.orderStatus.filled,
                remaining=trade.orderStatus.remaining,
                avg_fill_price=trade.orderStatus.avgFillPrice,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Failed to place order: {e}")
            raise
    
    async def get_order_status(self, order_id: str) -> Order:
        """Get order status"""
        if not self.ib.isConnected():
            raise Exception("Not connected to IBKR")
        
        try:
            # Find the trade by order ID
            trades = self.ib.trades()
            for trade in trades:
                if str(trade.order.orderId) == order_id:
                    return Order(
                        order_id=order_id,
                        symbol=trade.contract.symbol,
                        action=OrderAction(trade.order.action),
                        order_type=OrderType.MARKET,  # Simplified
                        total_quantity=trade.order.totalQuantity,
                        limit_price=getattr(trade.order, 'lmtPrice', None),
                        stop_price=getattr(trade.order, 'auxPrice', None),
                        status=self._convert_order_status(trade.orderStatus.status),
                        filled=trade.orderStatus.filled,
                        remaining=trade.orderStatus.remaining,
                        avg_fill_price=trade.orderStatus.avgFillPrice,
                        timestamp=datetime.now()
                    )
            
            raise Exception(f"Order {order_id} not found")
            
        except Exception as e:
            logger.error(f"Failed to get order status: {e}")
            raise
    
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an order"""
        if not self.ib.isConnected():
            raise Exception("Not connected to IBKR")
        
        try:
            # Find the trade by order ID
            trades = self.ib.trades()
            for trade in trades:
                if str(trade.order.orderId) == order_id:
                    self.ib.cancelOrder(trade.order)
                    return True
            
            raise Exception(f"Order {order_id} not found")
            
        except Exception as e:
            logger.error(f"Failed to cancel order: {e}")
            return False
    
    def _convert_order_status(self, ib_status: str) -> OrderStatus:
        """Convert IB order status to our enum"""
        status_map = {
            'PendingSubmit': OrderStatus.PENDING_SUBMIT,
            'Submitted': OrderStatus.SUBMITTED,
            'Filled': OrderStatus.FILLED,
            'Cancelled': OrderStatus.CANCELLED,
            'ApiCancelled': OrderStatus.CANCELLED,
        }
        return status_map.get(ib_status, OrderStatus.ERROR)