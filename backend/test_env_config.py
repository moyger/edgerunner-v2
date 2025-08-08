#!/usr/bin/env python3
"""
Simple test to verify MT5 environment configuration
"""
import os
from pathlib import Path
import sys

# Add src directory to path
src_dir = Path(__file__).parent / "src"
sys.path.insert(0, str(src_dir))

# Load environment variables from .env file
from dotenv import load_dotenv
env_path = Path(__file__).parent / '.env'
print(f"Looking for .env file at: {env_path}")
print(f".env file exists: {env_path.exists()}")
load_dotenv(env_path)

def test_env_config():
    """Test environment configuration loading"""
    print("🔧 Testing MT5 Environment Configuration...")
    print("=" * 50)
    
    # Check MT5 environment variables
    mt5_config = {
        'MT5_LOGIN': os.getenv('MT5_LOGIN'),
        'MT5_PASSWORD': os.getenv('MT5_PASSWORD'), 
        'MT5_SERVER': os.getenv('MT5_SERVER'),
        'MT5_PATH': os.getenv('MT5_PATH', 'C:\\Program Files\\MetaTrader 5\\terminal64.exe')
    }
    
    print("📋 MT5 Configuration from .env:")
    for key, value in mt5_config.items():
        if key == 'MT5_PASSWORD':
            # Mask password for security
            display_value = '*' * len(value) if value else 'Not Set'
        else:
            display_value = value if value else 'Not Set'
        print(f"  {key}: {display_value}")
    
    # Check if all required variables are set
    required_vars = ['MT5_LOGIN', 'MT5_PASSWORD', 'MT5_SERVER']
    missing_vars = [var for var in required_vars if not mt5_config[var]]
    
    if missing_vars:
        print(f"\n❌ Missing required environment variables: {', '.join(missing_vars)}")
        return False
    else:
        print(f"\n✅ All required MT5 environment variables are configured!")
        
        # Test the values
        try:
            login_id = int(mt5_config['MT5_LOGIN'])
            print(f"\n🔍 Configuration Details:")
            print(f"  Login ID: {login_id} (valid integer)")
            print(f"  Server: {mt5_config['MT5_SERVER']}")
            print(f"  Password: {'✅ Set' if mt5_config['MT5_PASSWORD'] else '❌ Not Set'}")
            print(f"  Terminal Path: {mt5_config['MT5_PATH']}")
            
            return True
            
        except ValueError:
            print(f"❌ Invalid login ID format: {mt5_config['MT5_LOGIN']} (must be numeric)")
            return False

if __name__ == "__main__":
    success = test_env_config()
    
    if success:
        print(f"\n🎉 Environment configuration test passed!")
        print(f"\nNOTE: This test only verifies environment variables are set.")
        print(f"Real MT5 connection requires:")
        print(f"  - Windows operating system")
        print(f"  - MT5 terminal installed and running")
        print(f"  - Valid account credentials")
        print(f"  - Network connection to MT5 servers")
    else:
        print(f"\n❌ Environment configuration test failed!")
        print(f"Please check your .env file in the backend directory.")