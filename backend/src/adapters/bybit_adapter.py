"""
Bybit Exchange API Adapter - v5 API Implementation
Cryptocurrency trading platform integration with HMAC authentication
"""

import asyncio
import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging

import httpx
from pydantic import BaseModel

try:
    from .base import BrokerAdapter
    from ..models import (
        BrokerConnection, BrokerCredentials, AccountSummary, Position, 
        Order, MarketData, HistoricalData, TestResult, OrderRequest,
        ConnectionStatus
    )
    from ..config import settings
except ImportError:
    from base import BrokerAdapter
    from models import (
        BrokerConnection, BrokerCredentials, AccountSummary, Position, 
        Order, MarketData, HistoricalData, TestResult, OrderRequest,
        ConnectionStatus
    )
    from config import settings

logger = logging.getLogger(__name__)


class BybitCredentials(BaseModel):
    """Bybit API Credentials"""
    api_key: str
    api_secret: str
    testnet: bool = True
    recv_window: int = 5000


class BybitAdapter(BrokerAdapter):
    """
    Bybit Exchange API Adapter
    Implements Bybit v5 API with HMAC-SHA256 authentication
    """
    
    def __init__(self):
        super().__init__("bybit", "Bybit Exchange")
        self.credentials: Optional[BybitCredentials] = None
        self.client: Optional[httpx.AsyncClient] = None
        self.base_url = "https://api-testnet.bybit.com"  # Default to testnet
        self.websocket_url = "wss://stream-testnet.bybit.com/v5/public/spot"
        
    async def _setup_client(self, testnet: bool = True):
        """Setup HTTP client with appropriate base URL"""
        if testnet:
            self.base_url = "https://api-testnet.bybit.com"
            self.websocket_url = "wss://stream-testnet.bybit.com/v5/public/spot"
        else:
            self.base_url = "https://api.bybit.com"
            self.websocket_url = "wss://stream.bybit.com/v5/public/spot"
            
        if self.client:
            await self.client.aclose()
            
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=30.0,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Edgerunner/2.0"
            }
        )
    
    def _generate_signature(self, timestamp: int, params: str = "") -> str:
        """
        Generate HMAC-SHA256 signature for Bybit API v5
        """
        if not self.credentials:
            raise ValueError("No credentials available")
            
        # Bybit v5 signature format: timestamp + api_key + recv_window + params
        param_str = str(timestamp) + self.credentials.api_key + str(self.credentials.recv_window) + params
        
        return hmac.new(
            self.credentials.api_secret.encode('utf-8'),
            param_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    def _get_signed_headers(self, params: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate signed headers for API requests"""
        if not self.credentials:
            raise ValueError("No credentials available")
            
        timestamp = int(time.time() * 1000)
        params_str = json.dumps(params, separators=(',', ':')) if params else ""
        signature = self._generate_signature(timestamp, params_str)
        
        return {
            "X-BAPI-API-KEY": self.credentials.api_key,
            "X-BAPI-TIMESTAMP": str(timestamp),
            "X-BAPI-RECV-WINDOW": str(self.credentials.recv_window),
            "X-BAPI-SIGN": signature,
            "Content-Type": "application/json"
        }
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        params: Optional[Dict[str, Any]] = None,
        signed: bool = True
    ) -> Dict[str, Any]:
        """Make HTTP request to Bybit API"""
        if not self.client:
            raise RuntimeError("Client not initialized")
            
        url = f"{endpoint}"
        headers = self._get_signed_headers(params) if signed else {}
        
        try:
            if method.upper() == "GET":
                response = await self.client.get(url, params=params or {}, headers=headers)
            elif method.upper() == "POST":
                response = await self.client.post(url, json=params or {}, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            response.raise_for_status()
            data = response.json()
            
            # Check Bybit API response format
            if data.get("retCode") != 0:
                error_msg = data.get("retMsg", "Unknown API error")
                logger.error(f"Bybit API error: {error_msg}")
                raise Exception(f"Bybit API error: {error_msg}")
                
            return data.get("result", {})
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error calling {endpoint}: {e}")
            raise Exception(f"HTTP error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Request error calling {endpoint}: {e}")
            raise
    
    async def connect(self, credentials: BrokerCredentials) -> BrokerConnection:
        """Connect to Bybit Exchange"""
        try:
            # Validate credentials
            if not hasattr(credentials, 'api_key') or not hasattr(credentials, 'api_secret'):
                raise ValueError("Missing Bybit API key or secret")
            
            # Set up credentials
            self.credentials = BybitCredentials(
                api_key=credentials.api_key,
                api_secret=credentials.api_secret,
                testnet=getattr(credentials, 'testnet', True),
                recv_window=getattr(credentials, 'recv_window', 5000)
            )
            
            # Setup client
            await self._setup_client(self.credentials.testnet)
            
            # Test connection by getting account info
            await self._make_request("GET", "/v5/account/wallet-balance", {"accountType": "UNIFIED"})
            
            # Update connection status
            self.connection_status = "connected"
            self.connected_at = datetime.now()
            self.last_error = None
            
            logger.info(f"✅ Connected to Bybit ({'Testnet' if self.credentials.testnet else 'Mainnet'})")
            
            return BrokerConnection(
                id=self.broker_id,
                name=self.broker_name,
                status=ConnectionStatus.CONNECTED,
                last_checked=datetime.now(),
                error=None
            )
            
        except Exception as e:
            self.connection_status = "error"
            self.last_error = str(e)
            logger.error(f"❌ Failed to connect to Bybit: {e}")
            
            return BrokerConnection(
                id=self.broker_id,
                name=self.broker_name,
                status=ConnectionStatus.ERROR,
                last_checked=datetime.now(),
                error=str(e)
            )
    
    async def disconnect(self) -> bool:
        """Disconnect from Bybit"""
        try:
            if self.client:
                await self.client.aclose()
                self.client = None
            
            self.connection_status = "disconnected"
            self.credentials = None
            self.last_error = None
            
            logger.info("✅ Disconnected from Bybit")
            return True
            
        except Exception as e:
            logger.error(f"Error disconnecting from Bybit: {e}")
            return False
    
    async def get_connection_status(self) -> BrokerConnection:
        """Get current connection status"""
        if self.connection_status == "connected":
            try:
                # Quick health check
                await self._make_request("GET", "/v5/market/time")
                status = ConnectionStatus.CONNECTED
                error = None
            except Exception as e:
                status = ConnectionStatus.ERROR
                error = str(e)
                self.connection_status = "error"
                self.last_error = error
        else:
            status = ConnectionStatus.DISCONNECTED if self.connection_status == "disconnected" else ConnectionStatus.ERROR
            error = self.last_error
        
        return BrokerConnection(
            id=self.broker_id,
            name=self.broker_name,
            status=status,
            last_checked=datetime.now(),
            error=error
        )
    
    async def get_account_summary(self) -> AccountSummary:
        """Get account balance and summary"""
        if self.connection_status != "connected":
            raise Exception("Not connected to Bybit")
        
        try:
            # Get unified account wallet balance
            balance_data = await self._make_request(
                "GET", 
                "/v5/account/wallet-balance",
                {"accountType": "UNIFIED"}
            )
            
            # Parse wallet information
            account_list = balance_data.get("list", [])
            if not account_list:
                raise Exception("No account data found")
            
            account_info = account_list[0]  # First account
            account_id = account_info.get("accountIMRate", "N/A")
            
            # Parse coin balances
            coins = account_info.get("coin", [])
            total_equity = 0
            total_available = 0
            
            for coin in coins:
                if coin.get("coin") == "USDT":  # Focus on USDT for summary
                    total_equity = float(coin.get("equity", 0))
                    total_available = float(coin.get("availableToWithdraw", 0))
                    break
            
            return AccountSummary(
                account_id=str(account_id),
                total_cash=total_available,
                total_value=total_equity,
                buying_power=total_available,
                margin_used=total_equity - total_available,
                net_liquidation=total_equity,
                currency="USDT"
            )
            
        except Exception as e:
            logger.error(f"Failed to get Bybit account summary: {e}")
            raise
    
    async def get_positions(self) -> List[Position]:
        """Get current trading positions"""
        if self.connection_status != "connected":
            raise Exception("Not connected to Bybit")
        
        try:
            # Get positions for unified account
            positions_data = await self._make_request(
                "GET",
                "/v5/position/list",
                {"category": "spot"}  # Start with spot positions
            )
            
            positions = []
            position_list = positions_data.get("list", [])
            
            for pos in position_list:
                size = float(pos.get("size", 0))
                if size == 0:  # Skip empty positions
                    continue
                    
                symbol = pos.get("symbol", "")
                avg_price = float(pos.get("avgPrice", 0))
                mark_price = float(pos.get("markPrice", avg_price))
                unrealized_pnl = float(pos.get("unrealisedPnl", 0))
                
                positions.append(Position(
                    symbol=symbol,
                    position=size,
                    market_price=mark_price,
                    market_value=size * mark_price,
                    average_cost=avg_price,
                    unrealized_pnl=unrealized_pnl,
                    realized_pnl=0  # Not available in position endpoint
                ))
            
            return positions
            
        except Exception as e:
            logger.error(f"Failed to get Bybit positions: {e}")
            raise
    
    async def get_market_data(self, symbol: str) -> MarketData:
        """Get real-time market data for a symbol"""
        try:
            # Get ticker data (public endpoint, no authentication needed)
            ticker_data = await self._make_request(
                "GET",
                "/v5/market/tickers",
                {"category": "spot", "symbol": symbol},
                signed=False
            )
            
            ticker_list = ticker_data.get("list", [])
            if not ticker_list:
                raise Exception(f"No market data found for {symbol}")
            
            ticker = ticker_list[0]
            
            return MarketData(
                symbol=ticker.get("symbol", symbol),
                bid=float(ticker.get("bid1Price", 0)),
                ask=float(ticker.get("ask1Price", 0)),
                last=float(ticker.get("lastPrice", 0)),
                high=float(ticker.get("highPrice24h", 0)),
                low=float(ticker.get("lowPrice24h", 0)),
                close=float(ticker.get("prevPrice24h", 0)),
                volume=float(ticker.get("volume24h", 0)),
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Failed to get market data for {symbol}: {e}")
            raise
    
    async def get_historical_data(self, symbol: str, duration: str, bar_size: str) -> HistoricalData:
        """Get historical kline/candlestick data"""
        try:
            # Convert duration and bar_size to Bybit format
            interval_map = {
                "1 min": "1",
                "5 min": "5", 
                "15 min": "15",
                "30 min": "30",
                "1 hour": "60",
                "4 hour": "240",
                "1 day": "D"
            }
            
            interval = interval_map.get(bar_size, "15")
            
            # Calculate start time based on duration
            if "D" in duration:
                days = int(duration.split()[0])
                start_time = int((datetime.now() - timedelta(days=days)).timestamp() * 1000)
            else:
                start_time = int((datetime.now() - timedelta(hours=24)).timestamp() * 1000)
            
            kline_data = await self._make_request(
                "GET",
                "/v5/market/kline",
                {
                    "category": "spot",
                    "symbol": symbol,
                    "interval": interval,
                    "start": start_time,
                    "limit": 200
                },
                signed=False
            )
            
            klines = kline_data.get("list", [])
            historical_data = []
            
            for kline in klines:
                historical_data.append({
                    "date": datetime.fromtimestamp(int(kline[0]) / 1000),
                    "open": float(kline[1]),
                    "high": float(kline[2]),
                    "low": float(kline[3]),
                    "close": float(kline[4]),
                    "volume": float(kline[5])
                })
            
            return HistoricalData(
                symbol=symbol,
                data=list(reversed(historical_data))  # Bybit returns newest first
            )
            
        except Exception as e:
            logger.error(f"Failed to get historical data for {symbol}: {e}")
            raise
    
    async def place_order(self, order: OrderRequest) -> Order:
        """Place a trading order"""
        if self.connection_status != "connected":
            raise Exception("Not connected to Bybit")
        
        try:
            # Convert order parameters to Bybit format
            side = "Buy" if order.action.upper() == "BUY" else "Sell"
            order_type = "Market" if order.order_type == "MKT" else "Limit"
            
            order_params = {
                "category": "spot",
                "symbol": order.symbol,
                "side": side,
                "orderType": order_type,
                "qty": str(order.quantity),
            }
            
            if order_type == "Limit" and order.price:
                order_params["price"] = str(order.price)
            
            # Place the order
            order_result = await self._make_request("POST", "/v5/order/create", order_params)
            
            order_id = order_result.get("orderId", "")
            
            return Order(
                order_id=order_id,
                symbol=order.symbol,
                action=order.action,
                order_type=order.order_type,
                total_quantity=order.quantity,
                lmt_price=order.price,
                aux_price=None,
                status="Submitted",
                filled=0,
                remaining=order.quantity,
                avg_fill_price=0,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Failed to place Bybit order: {e}")
            raise
    
    async def get_order_status(self, order_id: str) -> Order:
        """Get order status"""
        if self.connection_status != "connected":
            raise Exception("Not connected to Bybit")
        
        try:
            order_data = await self._make_request(
                "GET",
                "/v5/order/realtime",
                {"category": "spot", "orderId": order_id}
            )
            
            orders = order_data.get("list", [])
            if not orders:
                raise Exception(f"Order {order_id} not found")
            
            order = orders[0]
            
            return Order(
                order_id=order.get("orderId", order_id),
                symbol=order.get("symbol", ""),
                action="BUY" if order.get("side") == "Buy" else "SELL",
                order_type="MKT" if order.get("orderType") == "Market" else "LMT",
                total_quantity=float(order.get("qty", 0)),
                lmt_price=float(order.get("price", 0)) if order.get("price") else None,
                aux_price=None,
                status=order.get("orderStatus", "Unknown"),
                filled=float(order.get("cumExecQty", 0)),
                remaining=float(order.get("qty", 0)) - float(order.get("cumExecQty", 0)),
                avg_fill_price=float(order.get("avgPrice", 0)),
                timestamp=datetime.fromtimestamp(int(order.get("updatedTime", 0)) / 1000)
            )
            
        except Exception as e:
            logger.error(f"Failed to get Bybit order status: {e}")
            raise
    
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an order"""
        if self.connection_status != "connected":
            raise Exception("Not connected to Bybit")
        
        try:
            await self._make_request(
                "POST",
                "/v5/order/cancel",
                {"category": "spot", "orderId": order_id}
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to cancel Bybit order {order_id}: {e}")
            return False
    
    # Override test methods for Bybit-specific symbols
    async def test_market_data(self, symbol: str = "BTCUSDT") -> TestResult:
        """Test market data with crypto symbol"""
        return await super().test_market_data(symbol)
    
    async def cleanup(self):
        """Cleanup resources"""
        await self.disconnect()


# Factory function for easy instantiation
def create_bybit_adapter() -> BybitAdapter:
    """Create and return a new Bybit adapter instance"""
    return BybitAdapter()