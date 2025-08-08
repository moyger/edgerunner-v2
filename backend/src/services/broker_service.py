"""
Broker Service - Manages all broker adapters
Central service for handling multiple broker connections and operations
"""
import logging
import platform
from typing import Dict, List, Optional, Union
from datetime import datetime

try:
    from ..adapters.base import BrokerAdapter
    from ..adapters.ibkr_adapter import IBKRAdapter
    from ..adapters.mt5_adapter import MT5Adapter
    from ..models import (
        BrokerType, BrokerConnection, BrokerCredentials, AccountSummary, 
        Position, Order, MarketData, HistoricalData, TestResult, OrderRequest,
        ConnectionStatus
    )
except ImportError:
    from adapters.base import BrokerAdapter
    from adapters.ibkr_adapter import IBKRAdapter
    from adapters.mt5_adapter import MT5Adapter
    from models import (
        BrokerType, BrokerConnection, BrokerCredentials, AccountSummary, 
        Position, Order, MarketData, HistoricalData, TestResult, OrderRequest,
        ConnectionStatus
    )

logger = logging.getLogger(__name__)


class BrokerService:
    """Central service for managing broker connections and operations"""
    
    def __init__(self):
        self.adapters: Dict[str, BrokerAdapter] = {}
        self._initialize_adapters()
    
    def _initialize_adapters(self):
        """Initialize all broker adapters"""
        try:
            # Initialize IBKR adapter
            self.adapters[BrokerType.IBKR] = IBKRAdapter()
            logger.info("IBKR adapter initialized")

            # Initialize MT5 adapter on all platforms, sharing the same instance
            # used by the MT5 service (which falls back to a mock on non-Windows).
            try:
                # Local import to avoid potential circular imports
                from ..services.mt5_service import mt5_service
            except ImportError:
                from services.mt5_service import mt5_service

            self.adapters[BrokerType.MT5] = mt5_service.get_adapter()
            if platform.system() == "Windows":
                logger.info("MT5 adapter initialized (Windows)")
            else:
                logger.info("MT5 adapter initialized using mock MT5 (non-Windows)")

            # TODO: Initialize other adapters when implemented
            # self.adapters[BrokerType.BYBIT] = ByBitAdapter()

        except Exception as e:
            logger.error(f"Failed to initialize adapters: {e}")
    
    def get_adapter(self, broker: Union[str, BrokerType]) -> BrokerAdapter:
        """Get broker adapter by name"""
        broker_key = broker if isinstance(broker, str) else broker.value
        
        if broker_key not in self.adapters:
            raise ValueError(f"Broker '{broker_key}' not supported or not initialized")
        
        return self.adapters[broker_key]
    
    async def connect_broker(self, broker: Union[str, BrokerType], credentials: BrokerCredentials) -> BrokerConnection:
        """Connect to a broker"""
        try:
            adapter = self.get_adapter(broker)
            connection = await adapter.connect(credentials)
            logger.info(f"Connected to {broker}: {connection.status}")
            return connection
        except Exception as e:
            logger.error(f"Failed to connect to {broker}: {e}")
            raise
    
    async def disconnect_broker(self, broker: Union[str, BrokerType]) -> bool:
        """Disconnect from a broker"""
        try:
            adapter = self.get_adapter(broker)
            success = await adapter.disconnect()
            logger.info(f"Disconnected from {broker}: {success}")
            return success
        except Exception as e:
            logger.error(f"Failed to disconnect from {broker}: {e}")
            return False
    
    async def get_broker_status(self, broker: Union[str, BrokerType]) -> BrokerConnection:
        """Get connection status for a broker"""
        try:
            adapter = self.get_adapter(broker)
            status = await adapter.get_connection_status()
            return status
        except Exception as e:
            logger.error(f"Failed to get status for {broker}: {e}")
            # Return error status
            return BrokerConnection(
                id=str(broker),
                name=str(broker).upper(),
                status="error",
                last_checked=datetime.now(),
                error=str(e)
            )
    
    async def get_all_broker_statuses(self) -> Dict[str, BrokerConnection]:
        """Get connection status for all brokers"""
        statuses = {}
        
        for broker_id in self.adapters.keys():
            try:
                status = await self.get_broker_status(broker_id)
                statuses[broker_id] = status
            except Exception as e:
                logger.error(f"Failed to get status for {broker_id}: {e}")
                statuses[broker_id] = BrokerConnection(
                    id=broker_id,
                    name=broker_id.upper(),
                    status="error",
                    last_checked=datetime.now(),
                    error=str(e)
                )
        
        return statuses
    
    async def get_account_summary(self, broker: Union[str, BrokerType]) -> AccountSummary:
        """Get account summary from a broker"""
        adapter = self.get_adapter(broker)
        return await adapter.get_account_summary()
    
    async def get_positions(self, broker: Union[str, BrokerType]) -> List[Position]:
        """Get positions from a broker"""
        adapter = self.get_adapter(broker)
        return await adapter.get_positions()
    
    async def get_market_data(self, broker: Union[str, BrokerType], symbol: str) -> MarketData:
        """Get market data from a broker"""
        adapter = self.get_adapter(broker)
        return await adapter.get_market_data(symbol)
    
    async def get_historical_data(
        self, 
        broker: Union[str, BrokerType], 
        symbol: str, 
        duration: str = "1 D", 
        bar_size: str = "1 min"
    ) -> HistoricalData:
        """Get historical data from a broker"""
        adapter = self.get_adapter(broker)
        return await adapter.get_historical_data(symbol, duration, bar_size)
    
    async def place_order(self, order: OrderRequest) -> Order:
        """Place an order through a broker"""
        adapter = self.get_adapter(order.broker)
        return await adapter.place_order(order)
    
    async def get_order_status(self, broker: Union[str, BrokerType], order_id: str) -> Order:
        """Get order status from a broker"""
        adapter = self.get_adapter(broker)
        return await adapter.get_order_status(order_id)
    
    async def cancel_order(self, broker: Union[str, BrokerType], order_id: str) -> bool:
        """Cancel an order through a broker"""
        adapter = self.get_adapter(broker)
        return await adapter.cancel_order(order_id)
    
    async def run_tests(self, broker: Union[str, BrokerType], categories: Optional[List[str]] = None) -> List[TestResult]:
        """Run API tests for a broker"""
        adapter = self.get_adapter(broker)
        return await adapter.run_all_tests(categories)
    
    async def run_single_test(self, broker: Union[str, BrokerType], test_id: str) -> TestResult:
        """Run a single test for a broker"""
        adapter = self.get_adapter(broker)
        
        # Map test IDs to test methods
        if test_id.endswith("-connection"):
            return await adapter.test_connection()
        elif test_id.endswith("-market-data"):
            return await adapter.test_market_data()
        elif test_id.endswith("-account-data"):
            return await adapter.test_account_data()
        else:
            raise ValueError(f"Unknown test ID: {test_id}")
    
    def get_supported_brokers(self) -> List[str]:
        """Get list of supported broker IDs"""
        return list(self.adapters.keys())
    
    def is_broker_supported(self, broker: Union[str, BrokerType]) -> bool:
        """Check if broker is supported"""
        broker_key = broker if isinstance(broker, str) else broker.value
        return broker_key in self.adapters
    
    async def cleanup(self):
        """Cleanup all broker connections"""
        logger.info("Cleaning up broker connections...")
        
        for broker_id, adapter in self.adapters.items():
            try:
                await adapter.disconnect()
                logger.info(f"Disconnected from {broker_id}")
            except Exception as e:
                logger.error(f"Failed to disconnect from {broker_id}: {e}")
        
        logger.info("Broker service cleanup complete")