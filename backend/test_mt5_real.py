#!/usr/bin/env python3
"""
Test script for real MT5 connection using environment credentials
"""
import sys
import os
from pathlib import Path

# Add src directory to path
src_dir = Path(__file__).parent / "src"
sys.path.insert(0, str(src_dir))

import asyncio
from services.mt5_service import mt5_service
from config import settings

async def test_real_mt5_connection():
    """Test real MT5 connection using environment credentials"""
    print("🔧 Testing Real MT5 Connection...")
    print("=" * 50)
    
    # Check configuration
    print("📋 Configuration Status:")
    config_info = mt5_service.get_connection_info()
    print(f"  Configured: {config_info['configured']}")
    print(f"  Login: {config_info['login']}")
    print(f"  Server: {config_info['server']}")
    print(f"  Path: {config_info['path']}")
    
    if not mt5_service.is_configured():
        print("❌ MT5 not properly configured in environment variables")
        print("Please check your .env file contains:")
        print("  - MT5_LOGIN")
        print("  - MT5_PASSWORD") 
        print("  - MT5_SERVER")
        return
    
    print("\n🔐 Attempting auto-connection...")
    try:
        # Test auto-connection
        connection = await mt5_service.auto_connect()
        print(f"Connection Status: {connection.status}")
        
        if connection.status == "connected":
            print("✅ Successfully connected to real MT5 account!")
            
            # Test account information
            print("\n💰 Account Information:")
            adapter = mt5_service.get_adapter()
            
            try:
                account = await adapter.get_account_summary()
                print(f"  Account ID: {account.account_id}")
                print(f"  Balance: ${account.total_cash:,.2f}")
                print(f"  Equity: ${account.total_value:,.2f}")
                print(f"  Free Margin: ${account.buying_power:,.2f}")
                print(f"  Used Margin: ${account.margin_used:,.2f}")
                print(f"  Currency: {account.currency}")
            except Exception as e:
                print(f"  ❌ Could not get account info: {e}")
            
            # Test positions
            print("\n📈 Current Positions:")
            try:
                positions = await adapter.get_positions()
                if positions:
                    for i, pos in enumerate(positions, 1):
                        print(f"  {i}. {pos.symbol}: {pos.position:+.2f} @ ${pos.market_price:.5f}")
                        print(f"     P&L: ${pos.unrealized_pnl:+.2f}")
                else:
                    print("  No open positions")
            except Exception as e:
                print(f"  ❌ Could not get positions: {e}")
            
            # Test market data
            print("\n💹 Market Data Test:")
            test_symbols = ["EURUSD", "GBPUSD", "USDJPY"]
            for symbol in test_symbols:
                try:
                    data = await adapter.get_market_data(symbol)
                    spread = data.ask - data.bid
                    print(f"  {symbol}: {data.bid:.5f}/{data.ask:.5f} (spread: {spread:.5f})")
                except Exception as e:
                    print(f"  {symbol}: ❌ {str(e)[:50]}...")
            
            # Test available symbols
            print("\n🔍 Available Symbols (first 10):")
            try:
                symbols = await adapter.get_available_symbols(limit=10)
                print(f"  Found {len(symbols)} symbols: {', '.join(symbols[:10])}")
            except Exception as e:
                print(f"  ❌ Could not get symbols: {e}")
            
            # Connection test
            print("\n🧪 Connection Test:")
            try:
                tests = await adapter.run_all_tests(['authentication'])
                for test in tests:
                    status_icon = "✅" if test.status == "passed" else "❌"
                    print(f"  {status_icon} {test.name}: {test.status}")
                    if test.duration:
                        print(f"     Duration: {test.duration:.2f}ms")
            except Exception as e:
                print(f"  ❌ Could not run tests: {e}")
            
        else:
            print(f"❌ Connection failed: {connection.error}")
            
            if "Windows" in str(connection.error) or "terminal" in str(connection.error):
                print("\n💡 Troubleshooting Tips:")
                print("  - This test is running on macOS/Linux with mock MT5")
                print("  - Real MT5 connection requires Windows with MT5 terminal installed")
                print("  - The adapter will work correctly on Windows with proper MT5 setup")
            
        # Test disconnection
        print(f"\n🔌 Disconnecting...")
        success = await mt5_service.disconnect()
        print(f"Disconnect successful: {success}")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"\n🎉 MT5 Real Connection Test Complete!")

if __name__ == "__main__":
    asyncio.run(test_real_mt5_connection())