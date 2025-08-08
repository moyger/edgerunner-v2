"""
Diagnostics API endpoints for connection testing and troubleshooting
"""
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime
import logging

try:
    from ..services.broker_service import BrokerService
    from ..services.connection_health import get_health_monitor, ConnectionHealthMonitor
    from ..models import TestResult
    from ..dependencies import get_broker_service
except ImportError:
    from services.broker_service import BrokerService
    from services.connection_health import get_health_monitor, ConnectionHealthMonitor
    from models import TestResult
    from dependencies import get_broker_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/diagnostics", tags=["diagnostics"])


@router.get("/health/summary")
async def get_health_summary(
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Get overall health summary for all brokers"""
    try:
        health_monitor = get_health_monitor(broker_service)
        summary = health_monitor.get_health_summary()
        return summary
    except Exception as e:
        logger.error(f"Health summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/broker/{broker_id}")
async def get_broker_health(
    broker_id: str,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Get detailed health information for a specific broker"""
    try:
        health_monitor = get_health_monitor(broker_service)
        result = health_monitor.get_broker_health(broker_id)
        
        if result is None:
            # Force a health check if no data available
            results = await health_monitor.force_health_check(broker_id)
            result = results.get(broker_id)
        
        if result is None:
            raise HTTPException(status_code=404, detail=f"Broker {broker_id} not found")
        
        return {
            "broker_id": result.broker_id,
            "health": result.health.value,
            "last_check": result.last_check.isoformat(),
            "error": result.error,
            "details": result.details
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Broker health check error for {broker_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/health/check")
async def force_health_check(
    broker_id: Optional[str] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Force immediate health check for all brokers or specific broker"""
    try:
        health_monitor = get_health_monitor(broker_service)
        
        if broker_id:
            if not broker_service.is_broker_supported(broker_id):
                raise HTTPException(status_code=404, detail=f"Broker {broker_id} not supported")
        
        # Run health check in background
        background_tasks.add_task(health_monitor.force_health_check, broker_id)
        
        return {
            "message": f"Health check initiated for {'all brokers' if not broker_id else broker_id}",
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Force health check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/health/monitoring/start")
async def start_health_monitoring(
    check_interval: int = 60,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Start continuous health monitoring"""
    try:
        health_monitor = get_health_monitor(broker_service)
        
        if health_monitor.monitoring:
            return {
                "message": "Health monitoring already running",
                "interval": health_monitor.check_interval
            }
        
        # Start monitoring in background
        background_tasks.add_task(health_monitor.start_monitoring, check_interval)
        
        return {
            "message": "Health monitoring started",
            "interval": check_interval,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Start monitoring error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/health/monitoring/stop")
async def stop_health_monitoring(
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Stop health monitoring"""
    try:
        health_monitor = get_health_monitor(broker_service)
        await health_monitor.stop_monitoring()
        
        return {
            "message": "Health monitoring stopped",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Stop monitoring error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system/info")
async def get_system_info():
    """Get system diagnostic information"""
    import platform
    import sys
    import psutil
    from datetime import datetime
    
    try:
        return {
            "system": {
                "platform": platform.system(),
                "platform_version": platform.version(),
                "architecture": platform.architecture()[0],
                "python_version": sys.version,
                "timestamp": datetime.now().isoformat()
            },
            "resources": {
                "cpu_count": psutil.cpu_count(),
                "memory_total": psutil.virtual_memory().total,
                "memory_available": psutil.virtual_memory().available,
                "disk_usage": psutil.disk_usage('/').percent
            },
            "broker_adapters": {
                "ibkr_available": True,  # Always available via ib_insync
                "mt5_available": platform.system() == "Windows",  # MT5 only on Windows
                "bybit_available": True,  # HTTP API, always available
            }
        }
    except Exception as e:
        logger.error(f"System info error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/broker/test/{broker_id}")
async def test_broker_functionality(
    broker_id: str,
    test_categories: Optional[list] = None,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Test specific broker functionality"""
    try:
        if not broker_service.is_broker_supported(broker_id):
            raise HTTPException(status_code=404, detail=f"Broker {broker_id} not supported")
        
        # Run broker tests
        test_results = await broker_service.run_tests(broker_id, test_categories)
        
        return {
            "broker_id": broker_id,
            "test_count": len(test_results),
            "passed": sum(1 for t in test_results if t.status == "passed"),
            "failed": sum(1 for t in test_results if t.status == "failed"),
            "results": test_results,
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Broker test error for {broker_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connection/analyze")
async def analyze_connection_issues():
    """Analyze common connection issues and provide recommendations"""
    import socket
    import requests
    
    analysis = {
        "checks": {},
        "issues": [],
        "recommendations": [],
        "timestamp": datetime.now().isoformat()
    }
    
    # Check 1: Backend server accessibility
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        analysis["checks"]["backend_server"] = {
            "status": "ok" if response.ok else "error",
            "response_time": response.elapsed.total_seconds(),
            "status_code": response.status_code
        }
    except Exception as e:
        analysis["checks"]["backend_server"] = {
            "status": "error",
            "error": str(e)
        }
        analysis["issues"].append("Backend server not accessible on port 8000")
        analysis["recommendations"].append("Start the backend server: cd backend && python start.py")
    
    # Check 2: IBKR Gateway/TWS connection
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex(('127.0.0.1', 7497))
        sock.close()
        
        analysis["checks"]["ibkr_gateway"] = {
            "status": "ok" if result == 0 else "error",
            "port_7497_open": result == 0
        }
        
        if result != 0:
            analysis["issues"].append("IBKR Gateway/TWS not accessible on port 7497")
            analysis["recommendations"].append("Start IBKR Gateway or TWS in paper trading mode")
    except Exception as e:
        analysis["checks"]["ibkr_gateway"] = {
            "status": "error", 
            "error": str(e)
        }
        analysis["issues"].append("Cannot test IBKR Gateway connection")
    
    # Check 3: MT5 terminal (Windows only)
    if platform.system() == "Windows":
        import shutil
        mt5_path = shutil.which("terminal64.exe") or "C:\\Program Files\\MetaTrader 5\\terminal64.exe"
        import os
        
        analysis["checks"]["mt5_terminal"] = {
            "status": "ok" if os.path.exists(mt5_path) else "error",
            "terminal_path": mt5_path,
            "exists": os.path.exists(mt5_path)
        }
        
        if not os.path.exists(mt5_path):
            analysis["issues"].append("MT5 terminal not found at expected location")
            analysis["recommendations"].append("Install MetaTrader 5 from https://www.metatrader5.com/")
    else:
        analysis["checks"]["mt5_terminal"] = {
            "status": "warning",
            "message": "MT5 only supported on Windows"
        }
    
    # Check 4: Internet connectivity
    try:
        response = requests.get("https://httpbin.org/get", timeout=10)
        analysis["checks"]["internet"] = {
            "status": "ok" if response.ok else "error",
            "external_connectivity": response.ok
        }
    except Exception as e:
        analysis["checks"]["internet"] = {
            "status": "error",
            "error": str(e)
        }
        analysis["issues"].append("Internet connectivity issues")
        analysis["recommendations"].append("Check network connection and firewall settings")
    
    # Overall assessment
    error_count = sum(1 for check in analysis["checks"].values() if check.get("status") == "error")
    if error_count == 0:
        analysis["overall"] = "healthy"
        analysis["recommendations"].insert(0, "✅ All connection checks passed")
    elif error_count <= 2:
        analysis["overall"] = "degraded"
        analysis["recommendations"].insert(0, "⚠️ Some connection issues detected")
    else:
        analysis["overall"] = "unhealthy"
        analysis["recommendations"].insert(0, "❌ Multiple connection issues require attention")
    
    return analysis


@router.get("/logs/recent")
async def get_recent_logs(lines: int = 50):
    """Get recent application logs for debugging"""
    import os
    
    try:
        log_file = "logs/app.log"
        if not os.path.exists(log_file):
            return {
                "message": "Log file not found",
                "log_file": log_file,
                "exists": False
            }
        
        with open(log_file, 'r') as f:
            # Read last N lines
            lines_list = f.readlines()
            recent_lines = lines_list[-lines:] if len(lines_list) > lines else lines_list
        
        return {
            "log_file": log_file,
            "total_lines": len(lines_list),
            "returned_lines": len(recent_lines),
            "lines": [line.strip() for line in recent_lines],
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Log retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))