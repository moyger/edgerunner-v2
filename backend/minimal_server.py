#!/usr/bin/env python3
"""
Minimal HTTP server for MT5 testing
"""
import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from datetime import datetime

# Load environment
from dotenv import load_dotenv
load_dotenv()

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        path = self.path
        
        if path == '/api/broker/mt5/config':
            login = os.getenv('MT5_LOGIN')
            server = os.getenv('MT5_SERVER') 
            password = os.getenv('MT5_PASSWORD')
            configured = bool(login and server and password)
            
            response = {
                "configured": configured,
                "login": login,
                "server": server,
                "connected": False,
                "last_check": datetime.now().isoformat(),
                "status": "ready" if configured else "needs_configuration"
            }
            
        elif path == '/health':
            response = {
                "status": "healthy",
                "timestamp": datetime.now().isoformat()
            }
        else:
            response = {"error": "Not found"}
            
        self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        if self.path == '/api/broker/mt5/auto-connect':
            login = os.getenv('MT5_LOGIN')
            password = os.getenv('MT5_PASSWORD')
            
            if login and password:
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
                    "error": "No credentials"
                }
        else:
            response = {"error": "Not found"}
            
        self.wfile.write(json.dumps(response).encode())

    def log_message(self, format, *args):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {format % args}")

if __name__ == "__main__":
    server = HTTPServer(('localhost', 8001), Handler)  # Use port 8001
    print("🚀 Minimal MT5 Server Running on http://localhost:8001")
    print("📋 Test: http://localhost:8001/api/broker/mt5/config")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()