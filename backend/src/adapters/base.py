"""
Base broker adapter interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime

try:
    from ..models import (
        BrokerConnection, BrokerCredentials, AccountSummary, Position, 
        Order, MarketData, HistoricalData, TestResult, OrderRequest
    )
except ImportError:
    from models import (
        BrokerConnection, BrokerCredentials, AccountSummary, Position, 
        Order, MarketData, HistoricalData, TestResult, OrderRequest
    )


class BrokerAdapter(ABC):
    """Abstract base class for all broker adapters"""
    
    def __init__(self, broker_id: str, broker_name: str):
        self.broker_id = broker_id
        self.broker_name = broker_name
        self.connection_status = "disconnected"
        self.last_error: Optional[str] = None
        self.connected_at: Optional[datetime] = None
    
    @abstractmethod
    async def connect(self, credentials: BrokerCredentials) -> BrokerConnection:
        """Establish connection to broker"""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Disconnect from broker"""
        pass
    
    @abstractmethod
    async def get_connection_status(self) -> BrokerConnection:
        """Get current connection status"""
        pass
    
    @abstractmethod
    async def get_account_summary(self) -> AccountSummary:
        """Get account summary information"""
        pass
    
    @abstractmethod
    async def get_positions(self) -> List[Position]:
        """Get current positions"""
        pass
    
    @abstractmethod
    async def get_market_data(self, symbol: str) -> MarketData:
        """Get real-time market data for symbol"""
        pass
    
    @abstractmethod
    async def get_historical_data(
        self, 
        symbol: str, 
        duration: str, 
        bar_size: str
    ) -> HistoricalData:
        """Get historical market data"""
        pass
    
    @abstractmethod
    async def place_order(self, order: OrderRequest) -> Order:
        """Place a trading order"""
        pass
    
    @abstractmethod
    async def get_order_status(self, order_id: str) -> Order:
        """Get order status"""
        pass
    
    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel an order"""
        pass
    
    # Testing methods
    async def test_connection(self) -> TestResult:
        """Test broker connection"""
        start_time = datetime.now()
        
        try:
            status = await self.get_connection_status()
            duration = (datetime.now() - start_time).total_seconds() * 1000
            
            return TestResult(
                test_id=f"{self.broker_id}-connection",
                category="authentication",
                name=f"{self.broker_name} Connection Test",
                status="passed" if status.status == "connected" else "failed",
                duration=duration,
                timestamp=datetime.now(),
                details={"status": status.status}
            )
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds() * 1000
            return TestResult(
                test_id=f"{self.broker_id}-connection",
                category="authentication",
                name=f"{self.broker_name} Connection Test",
                status="failed",
                duration=duration,
                timestamp=datetime.now(),
                error=str(e)
            )
    
    async def test_market_data(self, symbol: str = "AAPL") -> TestResult:
        """Test market data retrieval"""
        start_time = datetime.now()
        
        try:
            data = await self.get_market_data(symbol)
            duration = (datetime.now() - start_time).total_seconds() * 1000
            
            return TestResult(
                test_id=f"{self.broker_id}-market-data",
                category="market-data",
                name=f"{self.broker_name} Market Data Test",
                status="passed",
                duration=duration,
                timestamp=datetime.now(),
                details={
                    "symbol": symbol,
                    "bid": data.bid,
                    "ask": data.ask,
                    "last": data.last
                }
            )
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds() * 1000
            return TestResult(
                test_id=f"{self.broker_id}-market-data",
                category="market-data",
                name=f"{self.broker_name} Market Data Test",
                status="failed",
                duration=duration,
                timestamp=datetime.now(),
                error=str(e)
            )
    
    async def test_account_data(self) -> TestResult:
        """Test account data retrieval"""
        start_time = datetime.now()
        
        try:
            account = await self.get_account_summary()
            positions = await self.get_positions()
            duration = (datetime.now() - start_time).total_seconds() * 1000
            
            return TestResult(
                test_id=f"{self.broker_id}-account-data",
                category="account-data",
                name=f"{self.broker_name} Account Data Test",
                status="passed",
                duration=duration,
                timestamp=datetime.now(),
                details={
                    "account_id": account.account_id,
                    "total_value": account.total_value,
                    "positions_count": len(positions)
                }
            )
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds() * 1000
            return TestResult(
                test_id=f"{self.broker_id}-account-data",
                category="account-data",
                name=f"{self.broker_name} Account Data Test",
                status="failed",
                duration=duration,
                timestamp=datetime.now(),
                error=str(e)
            )
    
    async def run_all_tests(self, categories: Optional[List[str]] = None) -> List[TestResult]:
        """Run all available tests"""
        if categories is None:
            categories = ["authentication", "market-data", "account-data"]
        
        results = []
        
        if "authentication" in categories:
            results.append(await self.test_connection())
        
        if "market-data" in categories:
            results.append(await self.test_market_data())
        
        if "account-data" in categories:
            results.append(await self.test_account_data())
        
        return results