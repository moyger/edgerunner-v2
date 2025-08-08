#!/usr/bin/env python3
"""
Edgerunner Backend Startup Script
"""
import sys
import os
import logging
import asyncio
from pathlib import Path

# Add src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

try:
    import uvicorn
    from src.config import settings
    from src.main import app
except ImportError as e:
    print(f"Import error: {e}")
    print("Please install dependencies: pip install -r requirements.txt")
    sys.exit(1)

def setup_directories():
    """Create necessary directories"""
    directories = [
        "logs",
        "data",
        "strategies",
        "backtests"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"Created directory: {directory}")

def main():
    """Main startup function"""
    print("=" * 60)
    print(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    print("=" * 60)
    
    # Setup directories
    setup_directories()
    
    # Configuration summary
    print(f"📊 Configuration:")
    print(f"   Host: {settings.host}")
    print(f"   Port: {settings.port}")
    print(f"   Debug: {settings.debug}")
    print(f"   Paper Trading Only: {settings.paper_trading_only}")
    print(f"   IBKR Host: {settings.ibkr_host}:{settings.ibkr_port}")
    print(f"   Log Level: {settings.log_level}")
    print()
    
    # Safety warnings
    if not settings.paper_trading_only:
        print("⚠️  WARNING: Live trading is ENABLED!")
        print("   This could result in real money transactions.")
        response = input("   Continue? (y/N): ")
        if response.lower() != 'y':
            print("   Aborted.")
            sys.exit(0)
    else:
        print("✅ Paper trading mode enabled - Safe for testing")
    
    print()
    print("🔌 Supported Brokers:")
    print("   • Interactive Brokers (IBKR)")
    print("   • MetaTrader 5 (Coming Soon)")
    print("   • ByBit (Coming Soon)")
    print()
    
    print("📡 API Endpoints will be available at:")
    print(f"   Health Check: http://{settings.host}:{settings.port}/health")
    print(f"   API Docs: http://{settings.host}:{settings.port}/docs")
    print(f"   Broker Status: http://{settings.host}:{settings.port}/api/broker/status/all")
    print()
    
    # Start the server
    try:
        uvicorn.run(
            "src.main:app",
            host=settings.host,
            port=settings.port,
            reload=settings.debug,
            log_level=settings.log_level.lower(),
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()