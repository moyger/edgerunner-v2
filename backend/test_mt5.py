#!/usr/bin/env python3
"""
Test script for MT5 adapter functionality
"""
import sys
import os
from pathlib import Path

# Add src directory to path
src_dir = Path(__file__).parent / "src"
sys.path.insert(0, str(src_dir))

import asyncio
from adapters.mt5_adapter import MT5Adapter
from models import BrokerCredentials

async def test_mt5_adapter():
    """Test MT5 adapter functionality"""
    print("🔧 Testing MT5 Adapter...")
    
    try:
        # Create adapter instance
        adapter = MT5Adapter()
        print("✅ MT5Adapter created successfully")
        
        # Test connection status (should be disconnected initially)
        status = await adapter.get_connection_status()
        print(f"📊 Initial connection status: {status.status}")
        
        # Test connection with mock credentials
        credentials = BrokerCredentials(
            username="12345",  # MT5 uses username as login ID
            password="test_password",
            server="MetaQuotes-Demo"
        )
        
        print("🔐 Testing connection with mock credentials...")
        connection = await adapter.connect(credentials)
        print(f"✅ Connection result: {connection.status}")
        
        if connection.status == "connected":
            # Test account summary
            print("💰 Getting account summary...")
            account = await adapter.get_account_summary()
            print(f"Account ID: {account.account_id}")
            print(f"Total Value: ${account.total_value:,.2f}")
            print(f"Currency: {account.currency}")
            
            # Test positions
            print("📈 Getting positions...")
            positions = await adapter.get_positions()
            print(f"Number of positions: {len(positions)}")
            
            # Test market data
            print("💹 Getting market data for EURUSD...")
            market_data = await adapter.get_market_data("EURUSD")
            print(f"EURUSD: Bid={market_data.bid}, Ask={market_data.ask}, Last={market_data.last}")
            
            # Test available symbols
            print("🔍 Getting available symbols...")
            symbols = await adapter.get_available_symbols(limit=5)
            print(f"Available symbols (first 5): {symbols[:5]}")
            
            # Test connection tests
            print("🧪 Running connection tests...")
            tests = await adapter.run_all_tests(['authentication'])
            for test in tests:
                print(f"Test {test.name}: {test.status}")
        
        print("\n🎉 MT5 Adapter test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during MT5 test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mt5_adapter())