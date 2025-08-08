#!/usr/bin/env python3
"""
Backend startup script for Edgerunner
Handles proper imports and starts the FastAPI application
"""
import sys
import os
import logging
from pathlib import Path

# Add the src directory to Python path
backend_dir = Path(__file__).parent
src_dir = backend_dir / "src"
sys.path.insert(0, str(src_dir))

def start_server():
    """Start the FastAPI server"""
    try:
        import uvicorn
        from main import app
        
        print("🚀 Starting Edgerunner Backend...")
        print(f"📂 Backend directory: {backend_dir}")
        print(f"🐍 Python executable: {sys.executable}")
        print(f"📦 App: {app.title} v{app.version}")
        
        # Configure logging
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        
        # Start the server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="info",
            reload=False  # Set to True for development
        )
        
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    start_server()