#!/usr/bin/env python3
"""
Mock backend server for MT5 integration testing
Provides the MT5 API endpoints without full dependencies
"""
import json
import os
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

class MockBackendHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        
        if path == '/api/broker/mt5/config':
            self.handle_mt5_config()
        elif path == '/api/broker/mt5/symbols':
            self.handle_mt5_symbols()
        elif path == '/health':
            self.handle_health()
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'{"error": "Not found"}')

    def do_POST(self):
        """Handle POST requests"""
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        
        if path == '/api/broker/mt5/auto-connect':
            self.handle_mt5_auto_connect()
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'{"error": "Not found"}')

    def handle_health(self):
        """Health check endpoint"""
        self.send_response(200)
        self.end_headers()
        
        response = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0-mock",
            "uptime": 3600
        }
        self.wfile.write(json.dumps(response).encode())

    def handle_mt5_config(self):
        """MT5 configuration status"""
        self.send_response(200)
        self.end_headers()
        
        # Get environment variables
        login = os.getenv('MT5_LOGIN')
        server = os.getenv('MT5_SERVER')
        password = os.getenv('MT5_PASSWORD')
        
        configured = bool(login and server and password)
        
        response = {
            "configured": configured,
            "login": login,
            "server": server,
            "connected": False,  # Mock shows disconnected initially
            "last_check": datetime.now().isoformat(),
            "status": "ready" if configured else "needs_configuration"
        }
        
        self.wfile.write(json.dumps(response).encode())

    def handle_mt5_auto_connect(self):
        """MT5 auto-connection"""
        self.send_response(200)
        self.end_headers()
        
        # Check if configured
        login = os.getenv('MT5_LOGIN')
        server = os.getenv('MT5_SERVER')
        password = os.getenv('MT5_PASSWORD')
        
        if login and server and password:
            # Mock successful connection
            response = {
                "id": "mt5",
                "name": "MetaTrader 5",
                "status": "connected",
                "last_checked": datetime.now().isoformat()
            }
        else:
            response = {
                "id": "mt5", 
                "name": "MetaTrader 5",
                "status": "error",
                "last_checked": datetime.now().isoformat(),
                "error": "MT5 credentials not configured"
            }
        
        self.wfile.write(json.dumps(response).encode())

    def handle_mt5_symbols(self):
        """MT5 available symbols"""
        self.send_response(200)
        self.end_headers()
        
        response = {
            "symbols": ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "NZDUSD", "USDCHF", "EURGBP"],
            "count": 8,
            "timestamp": datetime.now().isoformat()
        }
        
        self.wfile.write(json.dumps(response).encode())

    def log_message(self, format, *args):
        """Override to reduce log spam"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {format % args}")

def start_mock_backend():
    """Start the mock backend server"""
    server = HTTPServer(('localhost', 8000), MockBackendHandler)
    print("🚀 Mock Backend Server Started")
    print("=" * 40)
    print(f"🌐 URL: http://localhost:8000")
    print(f"📋 Health: http://localhost:8000/health")
    print(f"🔧 MT5 Config: http://localhost:8000/api/broker/mt5/config")
    print(f"🔐 MT5 Connect: POST http://localhost:8000/api/broker/mt5/auto-connect")
    print("=" * 40)
    print("Press Ctrl+C to stop the server")
    print()
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Shutting down mock backend server...")
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    start_mock_backend()