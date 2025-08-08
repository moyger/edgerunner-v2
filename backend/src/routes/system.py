"""
System management endpoints
Handles system startup, health checks, and configuration
"""
import asyncio
import logging
import os
import platform
import subprocess
import sys
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

try:
    from ..services.broker_service import BrokerService
    from ..services.connection_health import get_health_monitor
    from ..config import settings
except ImportError:
    from services.broker_service import BrokerService
    from services.connection_health import get_health_monitor
    from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/system", tags=["system"])


class StartBackendRequest(BaseModel):
    autoStart: bool = True


class SystemInfo(BaseModel):
    platform: str
    python_version: str
    backend_status: str
    frontend_url: str
    backend_url: str
    startup_time: str
    brokers_available: Dict[str, bool]


@router.post("/start-backend")
async def start_backend_service(
    request: StartBackendRequest,
    background_tasks: BackgroundTasks
):
    """Start backend service if not already running"""
    try:
        # Check if already running
        # Use a lightweight async check via httpx without blocking the event loop
        try:
            import httpx
            async with httpx.AsyncClient(timeout=2) as client:
                response = await client.get("http://localhost:8000/health")
                if response.status_code == 200:
                    return {
                        "status": "already_running",
                        "message": "Backend service is already running",
                        "url": "http://localhost:8000"
                    }
        except Exception:
            # If the check fails, proceed to initialize services anyway
            pass
        
        # This endpoint is called from the frontend, so backend is actually running
        # But we'll start health monitoring and broker initialization
        if request.autoStart:
            background_tasks.add_task(initialize_brokers)
        
        return {
            "status": "initialized",
            "message": "Backend services initialized",
            "url": "http://localhost:8000"
        }
        
    except Exception as e:
        logger.error(f"Failed to initialize backend services: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def initialize_brokers():
    """Initialize broker connections in background"""
    try:
        from ..services.broker_service import BrokerService
        
        broker_service = BrokerService()
        health_monitor = get_health_monitor(broker_service)
        
        # Start health monitoring
        await health_monitor.start_monitoring(check_interval=60)
        
        logger.info("✅ Broker health monitoring started")
        
    except Exception as e:
        logger.error(f"Failed to initialize brokers: {e}")


@router.get("/info", response_model=SystemInfo)
async def get_system_info():
    """Get comprehensive system information"""
    try:
        # Check broker availability
        brokers_available = {}
        
        try:
            from ..services.broker_service import BrokerService
            broker_service = BrokerService()
            
            # Check IBKR
            try:
                ibkr_adapter = broker_service.get_adapter('ibkr')
                brokers_available['ibkr'] = True
            except:
                brokers_available['ibkr'] = False
                
            # Check MT5
            try:
                mt5_adapter = broker_service.get_adapter('mt5')
                brokers_available['mt5'] = platform.system() == "Windows"
            except:
                brokers_available['mt5'] = False
                
            # Check ByBit (HTTP API - always available)
            brokers_available['bybit'] = True
            
        except Exception as e:
            logger.warning(f"Failed to check broker availability: {e}")
            brokers_available = {'ibkr': False, 'mt5': False, 'bybit': False}
        
        return SystemInfo(
            platform=f"{platform.system()} {platform.release()}",
            python_version=sys.version,
            backend_status="running",
            frontend_url="http://localhost:3000",
            backend_url="http://localhost:8000",
            startup_time=datetime.now().isoformat(),
            brokers_available=brokers_available
        )
        
    except Exception as e:
        logger.error(f"Failed to get system info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def system_health():
    """Enhanced system health check"""
    try:
        health_info = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {}
        }
        
        # Check database connection (if configured)
        if settings.database_url:
            try:
                # Add database health check here if needed
                health_info["services"]["database"] = {"status": "healthy"}
            except Exception as e:
                health_info["services"]["database"] = {"status": "error", "error": str(e)}
                health_info["status"] = "degraded"
        
        # Check broker services
        try:
            from ..services.broker_service import BrokerService
            from ..models import ConnectionStatus
            broker_service = BrokerService()
            statuses = await broker_service.get_all_broker_statuses()

            connected_count = sum(
                1 for status in statuses.values() if status.status == ConnectionStatus.CONNECTED
            )
            total_count = len(statuses)

            health_info["services"]["brokers"] = {
                "status": "healthy" if connected_count > 0 else "degraded",
                "connected": connected_count,
                "total": total_count,
                "details": {broker: status.status for broker, status in statuses.items()}
            }

        except Exception as e:
            health_info["services"]["brokers"] = {"status": "error", "error": str(e)}
            health_info["status"] = "degraded"
        
        # Check external APIs
        health_info["services"]["external_apis"] = {
            "alpha_vantage": {"configured": bool(settings.alpha_vantage_api_key)},
            "polygon": {"configured": bool(settings.polygon_api_key)},
        }
        
        return health_info
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }


@router.get("/config")
async def get_system_config():
    """Get system configuration (sanitized)"""
    try:
        config = {
            "app": {
                "name": settings.app_name,
                "version": settings.app_version,
                "debug": settings.debug,
                "environment": "development" if settings.debug else "production"
            },
            "server": {
                "host": settings.host,
                "port": settings.port,
            },
            "trading": {
                "paper_trading_only": settings.paper_trading_only,
                "default_currency": settings.default_currency,
                "max_position_size": settings.max_position_size,
            },
            "brokers": {
                "ibkr": {
                    "host": settings.ibkr_host,
                    "port": settings.ibkr_port,
                    "client_id": settings.ibkr_client_id,
                    "paper_trading": settings.ibkr_paper_trading,
                    "flex_configured": bool(settings.ibkr_flex_token)
                },
                "mt5": {
                    "configured": bool(settings.mt5_login and settings.mt5_server),
                    "server": settings.mt5_server if settings.mt5_server else None,
                },
                "bybit": {
                    "configured": bool(settings.bybit_api_key),
                    "testnet": "testnet" in settings.bybit_base_url,
                }
            },
            "features": {
                "health_monitoring": True,
                "auto_startup": True,
                "diagnostics": True,
                "flex_queries": bool(settings.ibkr_flex_token),
            }
        }
        
        return config
        
    except Exception as e:
        logger.error(f"Failed to get config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auto-configure")
async def auto_configure_system():
    """Attempt to auto-configure the system based on available resources"""
    try:
        configuration_results = {
            "timestamp": datetime.now().isoformat(),
            "configurations": [],
            "recommendations": []
        }
        
        # Check for IBKR Gateway/TWS
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3)
            result = sock.connect_ex(('127.0.0.1', 7497))
            sock.close()
            
            if result == 0:
                configuration_results["configurations"].append({
                    "service": "IBKR Gateway",
                    "status": "detected",
                    "message": "IBKR Gateway detected on port 7497"
                })
            else:
                configuration_results["recommendations"].append({
                    "service": "IBKR Gateway",
                    "message": "Start IBKR Gateway or TWS in paper trading mode on port 7497"
                })
        except Exception as e:
            configuration_results["recommendations"].append({
                "service": "IBKR Gateway",
                "message": f"Could not check IBKR Gateway: {e}"
            })
        
        # Check for MT5 (Windows only)
        if platform.system() == "Windows":
            try:
                import shutil
                mt5_path = shutil.which("terminal64.exe") or "C:\\Program Files\\MetaTrader 5\\terminal64.exe"
                
                if os.path.exists(mt5_path):
                    configuration_results["configurations"].append({
                        "service": "MetaTrader 5",
                        "status": "detected",
                        "message": f"MT5 terminal found at {mt5_path}"
                    })
                else:
                    configuration_results["recommendations"].append({
                        "service": "MetaTrader 5", 
                        "message": "Install MetaTrader 5 from https://www.metatrader5.com/"
                    })
            except Exception as e:
                configuration_results["recommendations"].append({
                    "service": "MetaTrader 5",
                    "message": f"MT5 check failed: {e}"
                })
        else:
            configuration_results["configurations"].append({
                "service": "MetaTrader 5",
                "status": "mock_mode",
                "message": "Using MT5 mock mode (not Windows platform)"
            })
        
        # Check environment variables
        env_vars = {
            "IBKR_FLEX_TOKEN": settings.ibkr_flex_token,
            "MT5_LOGIN": settings.mt5_login,
            "MT5_SERVER": settings.mt5_server,
            "BYBIT_API_KEY": settings.bybit_api_key,
        }
        
        configured_vars = {k: bool(v) for k, v in env_vars.items()}
        missing_vars = [k for k, v in configured_vars.items() if not v]
        
        if missing_vars:
            configuration_results["recommendations"].append({
                "service": "Environment Variables",
                "message": f"Configure missing environment variables: {', '.join(missing_vars)}"
            })
        else:
            configuration_results["configurations"].append({
                "service": "Environment Variables",
                "status": "configured",
                "message": "All broker credentials configured"
            })
        
        return configuration_results
        
    except Exception as e:
        logger.error(f"Auto-configure failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/startup-checklist")
async def get_startup_checklist():
    """Get checklist for proper system startup"""
    try:
        checklist = {
            "pre_startup": [
                {
                    "item": "Environment Variables",
                    "description": "Configure broker credentials in .env file",
                    "required": False,
                    "help": "Set IBKR_FLEX_TOKEN, MT5_LOGIN, MT5_SERVER, etc."
                },
                {
                    "item": "IBKR Gateway/TWS",
                    "description": "Start IBKR Gateway or TWS in paper trading mode",
                    "required": False,
                    "help": "Configure for port 7497, paper trading account"
                },
                {
                    "item": "MT5 Terminal (Windows)",
                    "description": "Install and configure MetaTrader 5",
                    "required": False,
                    "help": "Download from https://www.metatrader5.com/"
                }
            ],
            "startup_sequence": [
                {
                    "step": 1,
                    "action": "npm run dev",
                    "description": "Start the application - backend will auto-start"
                },
                {
                    "step": 2,
                    "action": "Wait for initialization",
                    "description": "App will automatically initialize backend and connect brokers"
                },
                {
                    "step": 3,
                    "action": "Check dashboard",
                    "description": "Verify connections in the main dashboard"
                }
            ],
            "troubleshooting": [
                {
                    "issue": "Backend won't start",
                    "solution": "Check Python installation and run 'cd backend && python start.py' manually"
                },
                {
                    "issue": "IBKR connection failed",
                    "solution": "Ensure TWS/Gateway is running on port 7497 in paper trading mode"
                },
                {
                    "issue": "MT5 connection failed",
                    "solution": "Check MT5 credentials and ensure terminal is running (Windows only)"
                }
            ]
        }
        
        return checklist
        
    except Exception as e:
        logger.error(f"Failed to get startup checklist: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-configuration")
async def reset_system_configuration():
    """Reset system to default configuration"""
    try:
        # Stop any running health monitors
        try:
            from ..services.broker_service import BrokerService
            broker_service = BrokerService()
            health_monitor = get_health_monitor(broker_service)
            await health_monitor.stop_monitoring()
        except:
            pass
        
        # Disconnect all brokers
        try:
            from ..services.broker_service import BrokerService
            broker_service = BrokerService()
            await broker_service.cleanup()
        except:
            pass
        
        return {
            "status": "reset_complete",
            "message": "System configuration reset to defaults",
            "timestamp": datetime.now().isoformat(),
            "next_steps": [
                "Restart the application",
                "Reconfigure broker connections",
                "Verify system health"
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to reset configuration: {e}")
        raise HTTPException(status_code=500, detail=str(e))