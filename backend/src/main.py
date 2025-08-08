"""
Edgerunner Backend - FastAPI Application
Main entry point for the algorithmic trading platform backend
"""
import logging
import time
import os
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

try:
    # Try relative imports first (when run as module)
    from .config import settings
    from .models import HealthResponse
    from .routes import broker, strategy, system
    from .services.broker_service import BrokerService
except ImportError:
    # Fall back to absolute imports (when run as script)
    from config import settings
    from models import HealthResponse
    from routes import broker, strategy, system
    from services.broker_service import BrokerService

# Ensure log directories exist before configuring handlers
try:
    for path in [settings.log_file, settings.error_log_file]:
        directory = os.path.dirname(path)
        if directory:
            os.makedirs(directory, exist_ok=True)
except Exception:
    # If directory creation fails, proceed with console logging only
    pass

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(settings.log_file),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Global variables
start_time = time.time()
broker_service: BrokerService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global broker_service
    
    # Startup
    logger.info("Starting Edgerunner Backend...")
    broker_service = BrokerService()
    app.state.broker_service = broker_service
    
    yield
    
    # Shutdown
    logger.info("Shutting down Edgerunner Backend...")
    if broker_service:
        await broker_service.cleanup()


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="Algorithmic trading platform backend with multi-broker support",
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for production
if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.get_allowed_hosts()
    )

# Include routers
app.include_router(
    broker.router,
    prefix="/api",
    tags=["broker"]
)

app.include_router(
    strategy.router,
    prefix="/api",
    tags=["strategy"]
)

# System management routes (exposed under /api/system/*)
app.include_router(
    system.router,
    prefix="/api",
    tags=["system"]
)


@app.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    return {
        "message": "Edgerunner Backend API",
        "version": settings.app_version,
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    uptime = time.time() - start_time
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version=settings.app_version,
        uptime=uptime
    )


@app.get("/api/status")
async def api_status():
    """API status endpoint with broker information"""
    global broker_service
    
    broker_statuses = {}
    if broker_service:
        try:
            broker_statuses = await broker_service.get_all_broker_statuses()
        except Exception as e:
            logger.error(f"Failed to get broker statuses: {e}")
    
    return {
        "api_status": "running",
        "version": settings.app_version,
        "uptime": time.time() - start_time,
        "brokers": broker_statuses,
        "paper_trading_only": settings.paper_trading_only,
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"Paper trading only: {settings.paper_trading_only}")
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )