#!/usr/bin/env python3
"""
Simple FastAPI server for MT5 testing
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uvicorn

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="MT5 Mock Server", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0-simple",
        "uptime": 3600
    }

@app.get("/api/broker/mt5/config")
async def get_mt5_config():
    # Get environment variables
    login = os.getenv('MT5_LOGIN')
    server = os.getenv('MT5_SERVER')
    password = os.getenv('MT5_PASSWORD')
    
    configured = bool(login and server and password)
    
    return {
        "configured": configured,
        "login": login,
        "server": server,
        "connected": False,
        "last_check": datetime.now().isoformat(),
        "status": "ready" if configured else "needs_configuration"
    }

@app.post("/api/broker/mt5/auto-connect")
async def mt5_auto_connect():
    # Check if configured
    login = os.getenv('MT5_LOGIN')
    server = os.getenv('MT5_SERVER')
    password = os.getenv('MT5_PASSWORD')
    
    if login and server and password:
        return {
            "id": "mt5",
            "name": "MetaTrader 5",
            "status": "connected",
            "last_checked": datetime.now().isoformat()
        }
    else:
        return {
            "id": "mt5", 
            "name": "MetaTrader 5",
            "status": "error",
            "last_checked": datetime.now().isoformat(),
            "error": "MT5 credentials not configured"
        }

@app.get("/api/broker/mt5/symbols")
async def get_mt5_symbols():
    return {
        "symbols": ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD"],
        "count": 5,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    print("🚀 Simple MT5 Backend Server")
    print("=" * 40)
    print("🌐 URL: http://localhost:8000")
    print("📋 Health: http://localhost:8000/health") 
    print("🔧 MT5 Config: http://localhost:8000/api/broker/mt5/config")
    print("=" * 40)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")