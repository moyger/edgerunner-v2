#!/usr/bin/env python3
"""
Quick setup and test script for Edgerunner Backend
"""
import sys
import subprocess
import requests
import time
import json
from pathlib import Path

def run_command(command, description):
    """Run a command and return success status"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} - Success")
            return True
        else:
            print(f"❌ {description} - Failed")
            print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} - Exception: {e}")
        return False

def check_python_version():
    """Check Python version"""
    version = sys.version_info
    print(f"🐍 Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ required")
        return False
    else:
        print("✅ Python version OK")
        return True

def install_dependencies():
    """Install required dependencies"""
    print("\n📦 Installing dependencies...")
    
    # Check if we're in a virtual environment
    if sys.prefix == sys.base_prefix:
        print("⚠️  Warning: Not in a virtual environment")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            print("Please create a virtual environment first:")
            print("  python -m venv venv")
            print("  source venv/bin/activate  # On Windows: venv\\Scripts\\activate")
            return False
    
    # Install basic requirements
    basic_deps = [
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0",
        "pydantic==2.5.0",
        "pydantic-settings==2.1.0",
        "python-dotenv==1.0.0",
        "httpx==0.25.2"
    ]
    
    for dep in basic_deps:
        if not run_command(f"pip install {dep}", f"Installing {dep.split('==')[0]}"):
            return False
    
    print("✅ Basic dependencies installed")
    return True

def create_directories():
    """Create necessary directories"""
    print("\n📁 Creating directories...")
    directories = ["logs", "data"]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Created directory: {directory}")
    
    return True

def test_backend_startup():
    """Test if backend can start"""
    print("\n🚀 Testing backend startup...")
    
    # Start backend in background
    print("Starting backend server...")
    process = None
    
    try:
        process = subprocess.Popen([
            sys.executable, "-c",
            """
import sys
sys.path.insert(0, 'src')
import uvicorn
from src.main import app
uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info')
"""
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait for startup
        print("Waiting for server to start...")
        time.sleep(5)
        
        # Test health endpoint
        try:
            response = requests.get("http://localhost:8000/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Backend is running!")
                print(f"   Status: {data.get('status')}")
                print(f"   Version: {data.get('version')}")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return False
    
    finally:
        if process:
            process.terminate()
            process.wait()

def test_api_endpoints():
    """Test key API endpoints"""
    print("\n🧪 Testing API endpoints...")
    
    base_url = "http://localhost:8000"
    
    # Start server for testing
    process = None
    try:
        process = subprocess.Popen([
            sys.executable, "-c",
            """
import sys
sys.path.insert(0, 'src')
import uvicorn
from src.main import app
uvicorn.run(app, host='0.0.0.0', port=8000, log_level='error')
"""
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        time.sleep(5)
        
        # Test endpoints
        endpoints = [
            ("/", "Root endpoint"),
            ("/health", "Health check"),
            ("/api/status", "API status"),
            ("/api/broker/status/all", "Broker statuses")
        ]
        
        success_count = 0
        for endpoint, description in endpoints:
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
                if response.status_code == 200:
                    print(f"✅ {description}: OK")
                    success_count += 1
                else:
                    print(f"❌ {description}: {response.status_code}")
            except Exception as e:
                print(f"❌ {description}: {e}")
        
        print(f"\n📊 API Test Results: {success_count}/{len(endpoints)} endpoints working")
        return success_count == len(endpoints)
    
    finally:
        if process:
            process.terminate()
            process.wait()

def main():
    """Main setup and test function"""
    print("=" * 60)
    print("🚀 Edgerunner Backend Setup & Test")
    print("=" * 60)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Install dependencies
    if not install_dependencies():
        return False
    
    # Create directories
    if not create_directories():
        return False
    
    # Test backend startup
    if not test_backend_startup():
        print("\n❌ Backend startup test failed")
        return False
    
    # Test API endpoints
    if not test_api_endpoints():
        print("\n❌ API endpoint tests failed")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 Backend setup and testing complete!")
    print("=" * 60)
    print("\n📋 Next steps:")
    print("1. Start the backend: python start.py")
    print("2. Open API docs: http://localhost:8000/docs")
    print("3. Test with frontend: Start React app")
    print("4. For IBKR testing: Install and configure TWS/IB Gateway")
    print("\n✅ Your backend is ready for algorithmic trading!")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)