#!/usr/bin/env python3
"""
Test script for configuration loading
"""
import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_imports():
    """Test basic imports"""
    try:
        import pydantic
        print(f"✅ pydantic version: {pydantic.__version__}")
    except ImportError as e:
        print(f"❌ Failed to import pydantic: {e}")
        return False
    
    try:
        import pydantic_settings
        print(f"✅ pydantic_settings version: {pydantic_settings.__version__}")
    except ImportError as e:
        print(f"❌ Failed to import pydantic_settings: {e}")
        return False
    
    try:
        import dotenv
        print(f"✅ python-dotenv available")
    except ImportError as e:
        print(f"❌ Failed to import dotenv: {e}")
        return False
    
    return True

def test_config():
    """Test configuration loading"""
    try:
        from config import settings
        print("✅ Configuration loaded successfully")
        print(f"   App Name: {settings.app_name}")
        print(f"   Debug Mode: {settings.debug}")
        print(f"   Paper Trading: {settings.paper_trading_only}")
        print(f"   IBKR Host: {settings.ibkr_host}")
        print(f"   IBKR Port: {settings.ibkr_port}")
        return True
    except Exception as e:
        print(f"❌ Failed to load configuration: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Testing Python Backend Configuration")
    print("=" * 50)
    
    if not test_imports():
        print("❌ Import tests failed")
        sys.exit(1)
    
    print("\n📝 Testing configuration loading...")
    if not test_config():
        print("❌ Configuration tests failed")
        sys.exit(1)
    
    print("\n✅ All tests passed!")