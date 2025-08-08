"""
Connection Health Monitor
Monitors and manages broker connection health with auto-recovery
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable
from enum import Enum

try:
    from ..services.broker_service import BrokerService
    from ..models import BrokerConnection, BrokerType
except ImportError:
    from services.broker_service import BrokerService
    from models import BrokerConnection, BrokerType

logger = logging.getLogger(__name__)


class ConnectionHealth(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded" 
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class HealthCheckResult:
    def __init__(self, broker_id: str, health: ConnectionHealth, 
                 last_check: datetime, error: Optional[str] = None,
                 details: Optional[Dict] = None):
        self.broker_id = broker_id
        self.health = health
        self.last_check = last_check
        self.error = error
        self.details = details or {}


class ConnectionHealthMonitor:
    """Monitors broker connection health and provides auto-recovery"""
    
    def __init__(self, broker_service: BrokerService):
        self.broker_service = broker_service
        self.health_checks: Dict[str, HealthCheckResult] = {}
        self.monitoring = False
        self.check_interval = 60  # seconds
        self.recovery_attempts: Dict[str, int] = {}
        self.max_recovery_attempts = 3
        self.callbacks: List[Callable[[str, ConnectionHealth], None]] = []
        
    def add_health_callback(self, callback: Callable[[str, ConnectionHealth], None]):
        """Add callback for health status changes"""
        self.callbacks.append(callback)
    
    async def start_monitoring(self, check_interval: int = 60):
        """Start continuous health monitoring"""
        if self.monitoring:
            logger.warning("Health monitoring already running")
            return
            
        self.monitoring = True
        self.check_interval = check_interval
        
        logger.info(f"Starting connection health monitoring (interval: {check_interval}s)")
        
        while self.monitoring:
            try:
                await self.check_all_brokers_health()
                await asyncio.sleep(check_interval)
            except Exception as e:
                logger.error(f"Health monitoring error: {e}")
                await asyncio.sleep(check_interval)
    
    async def stop_monitoring(self):
        """Stop health monitoring"""
        logger.info("Stopping connection health monitoring")
        self.monitoring = False
    
    async def check_all_brokers_health(self) -> Dict[str, HealthCheckResult]:
        """Check health of all configured brokers"""
        results = {}
        
        for broker_id in self.broker_service.get_supported_brokers():
            result = await self.check_broker_health(broker_id)
            results[broker_id] = result
            
            # Notify callbacks of health changes
            old_health = self.health_checks.get(broker_id)
            if old_health is None or old_health.health != result.health:
                for callback in self.callbacks:
                    try:
                        callback(broker_id, result.health)
                    except Exception as e:
                        logger.error(f"Health callback error: {e}")
            
            self.health_checks[broker_id] = result
        
        return results
    
    async def check_broker_health(self, broker_id: str) -> HealthCheckResult:
        """Perform comprehensive health check for a specific broker"""
        start_time = datetime.now()
        
        try:
            # Test 1: Connection Status
            connection = await self.broker_service.get_broker_status(broker_id)
            
            if connection.status == "connected":
                # Test 2: Account Data (if connected)
                health_details = await self._detailed_health_check(broker_id)
                health_status = self._determine_health_status(health_details)
                
                if health_status == ConnectionHealth.HEALTHY:
                    # Reset recovery attempts on success
                    self.recovery_attempts.pop(broker_id, None)
                
                return HealthCheckResult(
                    broker_id=broker_id,
                    health=health_status,
                    last_check=start_time,
                    details=health_details
                )
            
            elif connection.status == "disconnected":
                # Attempt auto-recovery if not at max attempts
                recovery_count = self.recovery_attempts.get(broker_id, 0)
                if recovery_count < self.max_recovery_attempts:
                    logger.info(f"Attempting auto-recovery for {broker_id} (attempt {recovery_count + 1})")
                    recovery_success = await self._attempt_recovery(broker_id)
                    
                    if recovery_success:
                        logger.info(f"Auto-recovery successful for {broker_id}")
                        self.recovery_attempts.pop(broker_id, None)
                        return HealthCheckResult(
                            broker_id=broker_id,
                            health=ConnectionHealth.HEALTHY,
                            last_check=start_time,
                            details={"recovery_successful": True}
                        )
                    else:
                        self.recovery_attempts[broker_id] = recovery_count + 1
                
                return HealthCheckResult(
                    broker_id=broker_id,
                    health=ConnectionHealth.UNHEALTHY,
                    last_check=start_time,
                    error="Broker disconnected",
                    details={"recovery_attempts": self.recovery_attempts.get(broker_id, 0)}
                )
            
            else:  # error status
                return HealthCheckResult(
                    broker_id=broker_id,
                    health=ConnectionHealth.UNHEALTHY,
                    last_check=start_time,
                    error=connection.error or "Connection error"
                )
                
        except Exception as e:
            logger.error(f"Health check failed for {broker_id}: {e}")
            return HealthCheckResult(
                broker_id=broker_id,
                health=ConnectionHealth.UNKNOWN,
                last_check=start_time,
                error=str(e)
            )
    
    async def _detailed_health_check(self, broker_id: str) -> Dict:
        """Perform detailed health checks for connected broker"""
        details = {}
        
        try:
            # Test account data access
            start = datetime.now()
            account_summary = await self.broker_service.get_account_summary(broker_id)
            details["account_access"] = {
                "success": True,
                "duration_ms": (datetime.now() - start).total_seconds() * 1000,
                "account_id": account_summary.account_id
            }
        except Exception as e:
            details["account_access"] = {
                "success": False,
                "error": str(e)
            }
        
        try:
            # Test market data access with common symbols
            test_symbol = "AAPL" if broker_id == "ibkr" else "EURUSD"  # MT5 uses forex symbols
            
            start = datetime.now()
            market_data = await self.broker_service.get_market_data(broker_id, test_symbol)
            details["market_data"] = {
                "success": True,
                "duration_ms": (datetime.now() - start).total_seconds() * 1000,
                "symbol": test_symbol,
                "data_quality": "good" if market_data.bid > 0 and market_data.ask > 0 else "poor"
            }
        except Exception as e:
            details["market_data"] = {
                "success": False,
                "error": str(e)
            }
        
        try:
            # Test positions access
            start = datetime.now()
            positions = await self.broker_service.get_positions(broker_id)
            details["positions_access"] = {
                "success": True,
                "duration_ms": (datetime.now() - start).total_seconds() * 1000,
                "position_count": len(positions)
            }
        except Exception as e:
            details["positions_access"] = {
                "success": False,
                "error": str(e)
            }
        
        return details
    
    def _determine_health_status(self, health_details: Dict) -> ConnectionHealth:
        """Determine overall health status from detailed checks"""
        successful_checks = 0
        total_checks = 0
        warning_conditions = 0
        
        for check_name, check_data in health_details.items():
            total_checks += 1
            
            if check_data.get("success"):
                successful_checks += 1
                
                # Check for warning conditions
                if check_name == "market_data" and check_data.get("data_quality") == "poor":
                    warning_conditions += 1
                elif check_name == "account_access" and check_data.get("duration_ms", 0) > 5000:
                    warning_conditions += 1  # Slow response
            
        if successful_checks == total_checks and warning_conditions == 0:
            return ConnectionHealth.HEALTHY
        elif successful_checks >= total_checks * 0.7:  # 70% success rate
            return ConnectionHealth.DEGRADED
        else:
            return ConnectionHealth.UNHEALTHY
    
    async def _attempt_recovery(self, broker_id: str) -> bool:
        """Attempt to recover a failed broker connection"""
        try:
            # For now, we don't have stored credentials, so we can't auto-reconnect
            # This would need to be enhanced with credential storage/retrieval
            logger.info(f"Auto-recovery not implemented for {broker_id} - requires manual reconnection")
            return False
            
        except Exception as e:
            logger.error(f"Recovery attempt failed for {broker_id}: {e}")
            return False
    
    def get_health_summary(self) -> Dict:
        """Get overall health summary"""
        if not self.health_checks:
            return {
                "overall": ConnectionHealth.UNKNOWN,
                "brokers": {},
                "last_check": None,
                "recommendations": ["Run health check to assess broker connections"]
            }
        
        healthy_count = sum(1 for result in self.health_checks.values() 
                          if result.health == ConnectionHealth.HEALTHY)
        total_count = len(self.health_checks)
        
        if healthy_count == total_count:
            overall = ConnectionHealth.HEALTHY
        elif healthy_count >= total_count * 0.5:
            overall = ConnectionHealth.DEGRADED  
        else:
            overall = ConnectionHealth.UNHEALTHY
        
        recommendations = []
        for broker_id, result in self.health_checks.items():
            if result.health == ConnectionHealth.UNHEALTHY:
                recommendations.append(f"❌ {broker_id}: {result.error or 'Connection failed'}")
            elif result.health == ConnectionHealth.DEGRADED:
                recommendations.append(f"⚠️ {broker_id}: Performance issues detected")
        
        if overall == ConnectionHealth.HEALTHY:
            recommendations.append("✅ All broker connections are healthy")
        
        return {
            "overall": overall,
            "brokers": {broker_id: {
                "health": result.health,
                "last_check": result.last_check.isoformat(),
                "error": result.error
            } for broker_id, result in self.health_checks.items()},
            "last_check": max(result.last_check for result in self.health_checks.values()).isoformat(),
            "healthy_brokers": healthy_count,
            "total_brokers": total_count,
            "recommendations": recommendations
        }
    
    def get_broker_health(self, broker_id: str) -> Optional[HealthCheckResult]:
        """Get health status for specific broker"""
        return self.health_checks.get(broker_id)
    
    async def force_health_check(self, broker_id: Optional[str] = None) -> Dict[str, HealthCheckResult]:
        """Force immediate health check"""
        if broker_id:
            result = await self.check_broker_health(broker_id)
            self.health_checks[broker_id] = result
            return {broker_id: result}
        else:
            return await self.check_all_brokers_health()


# Global health monitor instance
health_monitor: Optional[ConnectionHealthMonitor] = None


def get_health_monitor(broker_service: BrokerService) -> ConnectionHealthMonitor:
    """Get or create global health monitor instance"""
    global health_monitor
    if health_monitor is None:
        health_monitor = ConnectionHealthMonitor(broker_service)
    return health_monitor