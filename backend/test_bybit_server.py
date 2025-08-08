#!/usr/bin/env python3
"""
Minimal HTTP server for Bybit API testing
Tests the Bybit integration with real API calls
"""
import json
import os
import asyncio
import hashlib
import hmac
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import subprocess
import sys

# Load environment
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Installing python-dotenv...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-dotenv"])
    from dotenv import load_dotenv
    load_dotenv()

# Bybit credentials from environment
API_KEY = os.getenv('BYBIT_API_KEY', 'eiHoQubUWMuPv9Ij7r')
API_SECRET = os.getenv('BYBIT_SECRET_KEY', 'aD8wOu2GfhOPbfrRMEoBy5ZaDeTldL0bsP7P')
BASE_URL = os.getenv('BYBIT_BASE_URL', 'https://api-testnet.bybit.com')
RECV_WINDOW = 5000

def make_bybit_request(endpoint, params=None):
    """Make request to Bybit API using curl"""
    url = f"{BASE_URL}{endpoint}"
    if params:
        param_str = '&'.join([f"{k}={v}" for k, v in params.items()])
        url = f"{url}?{param_str}"
    
    try:
        result = subprocess.run(['curl', '-s', url], capture_output=True, text=True)
        return json.loads(result.stdout)
    except:
        return {"error": "Failed to connect to Bybit API"}

def generate_signature(timestamp, params=""):
    """Generate HMAC-SHA256 signature for Bybit API v5"""
    param_str = str(timestamp) + API_KEY + str(RECV_WINDOW) + params
    return hmac.new(
        API_SECRET.encode('utf-8'),
        param_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def make_signed_request(endpoint, params=None):
    """Make signed request to Bybit API"""
    timestamp = int(time.time() * 1000)
    params_str = json.dumps(params, separators=(',', ':')) if params else ""
    signature = generate_signature(timestamp, params_str)
    
    headers = [
        f"X-BAPI-API-KEY: {API_KEY}",
        f"X-BAPI-TIMESTAMP: {timestamp}",
        f"X-BAPI-RECV-WINDOW: {RECV_WINDOW}",
        f"X-BAPI-SIGN: {signature}",
        "Content-Type: application/json"
    ]
    
    url = f"{BASE_URL}{endpoint}"
    
    try:
        curl_cmd = ['curl', '-s']
        for header in headers:
            curl_cmd.extend(['-H', header])
        curl_cmd.append(url)
        
        result = subprocess.run(curl_cmd, capture_output=True, text=True)
        return json.loads(result.stdout)
    except Exception as e:
        return {"error": f"Failed to make signed request: {str(e)}"}

class BybitTestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        path = self.path
        parsed = urlparse(path)
        query_params = parse_qs(parsed.query)
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] GET {path}")
        
        try:
            if parsed.path == '/health':
                response = {
                    "status": "healthy",
                    "timestamp": datetime.now().isoformat(),
                    "bybit_configured": bool(API_KEY and API_SECRET)
                }
                
            elif parsed.path == '/api/broker/bybit/config':
                response = {
                    "configured": bool(API_KEY and API_SECRET),
                    "api_key": API_KEY[:8] + "..." if API_KEY else None,
                    "base_url": BASE_URL,
                    "testnet": 'testnet' in BASE_URL,
                    "recv_window": RECV_WINDOW,
                    "status": "ready" if (API_KEY and API_SECRET) else "needs_configuration"
                }
                
            elif parsed.path == '/api/broker/bybit/symbols':
                category = query_params.get('category', ['spot'])[0]
                limit = int(query_params.get('limit', ['20'])[0])
                
                # Popular crypto symbols for testing
                popular_symbols = [
                    "BTCUSDT", "ETHUSDT", "ADAUSDT", "BNBUSDT", "DOTUSDT",
                    "XRPUSDT", "LINKUSDT", "LTCUSDT", "BCHUSDT", "XLMUSDT",
                    "UNIUSDT", "VETUSDT", "FILUSDT", "TRXUSDT", "ETCUSDT",
                    "THETAUSDT", "KLAYUSDT", "AVAXUSDT", "ATOMUSDT", "NEOUSDT"
                ]
                
                response = {
                    "symbols": popular_symbols[:limit],
                    "category": category,
                    "count": min(len(popular_symbols), limit),
                    "timestamp": datetime.now().isoformat()
                }
                
            elif parsed.path == '/api/broker/bybit/test/market-data':
                # Test market data endpoint
                data = make_bybit_request('/v5/market/tickers', {'category': 'spot', 'symbol': 'BTCUSDT'})
                response = {
                    "test": "market_data",
                    "endpoint": "/v5/market/tickers",
                    "success": data.get("retCode") == 0,
                    "data": data
                }
                
            elif parsed.path == '/api/broker/bybit/test/server-time':
                # Test server time endpoint
                data = make_bybit_request('/v5/market/time')
                response = {
                    "test": "server_time", 
                    "endpoint": "/v5/market/time",
                    "success": data.get("retCode") == 0,
                    "data": data
                }
                
            elif parsed.path == '/api/broker/bybit/test/account-balance':
                # Test account balance (signed request)
                data = make_signed_request('/v5/account/wallet-balance?accountType=UNIFIED')
                response = {
                    "test": "account_balance",
                    "endpoint": "/v5/account/wallet-balance",
                    "success": data.get("retCode") == 0,
                    "data": data
                }
                
            else:
                response = {"error": "Endpoint not found", "path": parsed.path}
                
        except Exception as e:
            response = {"error": str(e), "path": parsed.path}
        
        # Send response
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response, indent=2).encode())

    def do_POST(self):
        path = self.path
        print(f"[{datetime.now().strftime('%H:%M:%S')}] POST {path}")
        
        try:
            if path == '/api/broker/bybit/auto-connect':
                if API_KEY and API_SECRET:
                    # Test connection with server time
                    test_data = make_bybit_request('/v5/market/time')
                    
                    if test_data.get("retCode") == 0:
                        response = {
                            "id": "bybit",
                            "name": "Bybit Exchange",
                            "status": "connected",
                            "last_checked": datetime.now().isoformat(),
                            "server_time": test_data.get("result", {}).get("timeSecond"),
                            "testnet": 'testnet' in BASE_URL
                        }
                    else:
                        response = {
                            "id": "bybit",
                            "name": "Bybit Exchange",
                            "status": "error",
                            "last_checked": datetime.now().isoformat(),
                            "error": "Failed to connect to Bybit API"
                        }
                else:
                    response = {
                        "id": "bybit",
                        "name": "Bybit Exchange",
                        "status": "error",
                        "last_checked": datetime.now().isoformat(),
                        "error": "Bybit API credentials not configured"
                    }
            else:
                response = {"error": "Endpoint not found", "path": path}
                
        except Exception as e:
            response = {"error": str(e), "path": path}
        
        # Send response
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response, indent=2).encode())

    def log_message(self, format, *args):
        # Custom logging to avoid duplicate output
        pass

if __name__ == "__main__":
    server = HTTPServer(('localhost', 8000), BybitTestHandler)
    print("=" * 60)
    print("🚀 Bybit Integration Test Server")
    print("=" * 60)
    print(f"📡 Server: http://localhost:8000")
    print(f"🔑 API Key: {API_KEY[:8]}..." if API_KEY else "❌ No API Key")
    print(f"🌐 Base URL: {BASE_URL}")
    print(f"🧪 Environment: {'Testnet' if 'testnet' in BASE_URL else 'Mainnet'}")
    print()
    print("📋 Test Endpoints:")
    print("   GET  /health                              - Health check")
    print("   GET  /api/broker/bybit/config            - Configuration status")
    print("   POST /api/broker/bybit/auto-connect      - Test auto-connection")
    print("   GET  /api/broker/bybit/symbols           - Available symbols")
    print("   GET  /api/broker/bybit/test/server-time  - Test server time")
    print("   GET  /api/broker/bybit/test/market-data  - Test market data")
    print("   GET  /api/broker/bybit/test/account-balance - Test account balance")
    print()
    print("🎯 Ready for testing!")
    print("=" * 60)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
        server.shutdown()