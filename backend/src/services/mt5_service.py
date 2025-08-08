"""
MetaTrader 5 Service
Handles MT5 connection management and configuration from environment variables
"""
import logging
from typing import Optional
from datetime import datetime

try:
    from ..config import settings
    from ..models import BrokerCredentials, BrokerConnection
    from ..adapters.mt5_adapter import MT5Adapter
except ImportError:
    from config import settings
    from models import BrokerCredentials, BrokerConnection
    from adapters.mt5_adapter import MT5Adapter

logger = logging.getLogger(__name__)


class MT5Service:
    """Service for managing MT5 connections with environment configuration"""
    
    def __init__(self):
        self.adapter = MT5Adapter()
        self._is_connected = False
        self._last_connection_check: Optional[datetime] = None
    
    def get_credentials_from_env(self) -> Optional[BrokerCredentials]:
        """Get MT5 credentials from environment variables"""
        if not all([settings.mt5_login, settings.mt5_password, settings.mt5_server]):
            logger.warning("MT5 credentials not fully configured in environment variables")
            return None
        
        return BrokerCredentials(
            username=str(settings.mt5_login),  # MT5 login stored as username
            password=settings.mt5_password,
            server=settings.mt5_server,
            path=settings.mt5_path
        )
    
    def is_configured(self) -> bool:
        """Check if MT5 is properly configured via environment variables"""
        return all([
            settings.mt5_login,
            settings.mt5_password, 
            settings.mt5_server
        ])
    
    async def auto_connect(self) -> BrokerConnection:
        """Attempt to connect to MT5 using environment credentials"""
        if not self.is_configured():
            return BrokerConnection(
                id="mt5",
                name="MetaTrader 5",
                status="error",
                last_checked=datetime.now(),
                error="MT5 credentials not configured in environment variables"
            )
        
        try:
            credentials = self.get_credentials_from_env()
            connection = await self.adapter.connect(credentials)
            
            if connection.status == "connected":
                self._is_connected = True
                logger.info(f"Successfully auto-connected to MT5 account {settings.mt5_login}")
            else:
                self._is_connected = False
                logger.error(f"Failed to auto-connect to MT5: {connection.error}")
            
            self._last_connection_check = datetime.now()
            return connection
            
        except Exception as e:
            error_msg = f"MT5 auto-connection error: {str(e)}"
            logger.error(error_msg)
            
            return BrokerConnection(
                id="mt5",
                name="MetaTrader 5",
                status="error",
                last_checked=datetime.now(),
                error=error_msg
            )
    
    async def get_connection_status(self) -> BrokerConnection:
        """Get current MT5 connection status"""
        try:
            return await self.adapter.get_connection_status()
        except Exception as e:
            return BrokerConnection(
                id="mt5",
                name="MetaTrader 5",
                status="error",
                last_checked=datetime.now(),
                error=str(e)
            )
    
    async def ensure_connected(self) -> bool:
        """Ensure MT5 is connected, auto-connect if needed"""
        status = await self.get_connection_status()
        
        if status.status != "connected":
            logger.info("MT5 not connected, attempting auto-connection...")
            connection = await self.auto_connect()
            return connection.status == "connected"
        
        return True
    
    async def disconnect(self) -> bool:
        """Disconnect from MT5"""
        try:
            success = await self.adapter.disconnect()
            if success:
                self._is_connected = False
                logger.info("Disconnected from MT5")
            return success
        except Exception as e:
            logger.error(f"Error disconnecting from MT5: {e}")
            return False
    
    def get_adapter(self) -> MT5Adapter:
        """Get the MT5 adapter instance"""
        return self.adapter
    
    def get_connection_info(self) -> dict:
        """Get connection information for debugging/status"""
        return {
            "configured": self.is_configured(),
            "connected": self._is_connected,
            "last_check": self._last_connection_check.isoformat() if self._last_connection_check else None,
            "login": settings.mt5_login,
            "server": settings.mt5_server,
            "path": settings.mt5_path
        }


# Global MT5 service instance
mt5_service = MT5Service()