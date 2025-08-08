#!/usr/bin/env python3
"""
IBKR Flex Query Setup and Testing Script
"""
import os
import sys
import asyncio
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

print("=== IBKR Flex Query Token Setup Guide ===")
print()
print("To get your IBKR Flex Query token:")
print("1. Log into your IBKR account at client.schwab.com or ibkr.com")
print("2. Go to Account Management > Settings > API > Settings")
print("3. Look for 'Flex Web Service' section")
print("4. Generate or copy your Flex Web Service Token")
print("5. Update your .env file with: IBKR_FLEX_TOKEN=your_token_here")
print()

# Load environment configuration
try:
    from config import settings
    
    print("=== Current Configuration ===")
    print(f"IBKR_FLEX_TOKEN: {'SET' if settings.ibkr_flex_token else 'EMPTY'}")
    print(f"IBKR_FLEX_QUERY_TRADES: {settings.ibkr_flex_query_trades}")
    print(f"IBKR_FLEX_QUERY_POSITIONS: {settings.ibkr_flex_query_positions}")
    print(f"IBKR_FLEX_QUERY_CASH_TRANSACTIONS: {settings.ibkr_flex_query_cash_transactions}")
    print()
    
    if not settings.ibkr_flex_token:
        print("❌ IBKR_FLEX_TOKEN not set in .env file")
        print("Please add your token to continue with testing.")
        print()
        print("Your .env file should include:")
        print("IBKR_FLEX_TOKEN=your_actual_token_here")
        sys.exit(1)
    
    print("✅ Configuration looks good!")
    print()
    
    # Test the Flex Query service
    async def test_flex_query():
        try:
            from services.flex_query_service import FlexQueryService
            from models import FlexQueryRequest
            
            service = FlexQueryService()
            
            print("=== Testing Flex Query Execution ===")
            
            # Test with your Edgerunner query
            request = FlexQueryRequest(
                query_id=settings.ibkr_flex_query_trades or "Edgerunner",
                token=settings.ibkr_flex_token,
                broker="ibkr"
            )
            
            print(f"Executing Flex Query: {request.query_id}")
            response = await service.execute_flex_query(request)
            
            if response.status.value == "running":
                print(f"✅ Flex query executed successfully!")
                print(f"Reference code: {response.reference_code}")
                print(f"Query ID: {response.query_id}")
                print(f"Status: {response.status.value}")
                print()
                
                print("=== Waiting for Query to Complete ===")
                print("(This may take 30-60 seconds...)")
                
                # Wait for completion with timeout
                max_attempts = 60  # 60 seconds
                attempt = 0
                
                while attempt < max_attempts:
                    await asyncio.sleep(1)
                    status = await service.get_query_status(response.reference_code)
                    
                    if status and status.status.value == "completed":
                        print(f"✅ Query completed successfully!")
                        
                        # Get the data
                        data = await service.get_flex_query_data(response.reference_code, request.token)
                        
                        print(f"📊 Data Type: {data.data_type}")
                        print(f"📊 Total Records: {data.total_records}")
                        print(f"📊 Generated At: {data.generated_at}")
                        print()
                        
                        if data.records:
                            print("=== Sample Data (First 3 Records) ===")
                            for i, record in enumerate(data.records[:3]):
                                print(f"Record {i + 1}:")
                                for key, value in record.items():
                                    print(f"  {key}: {value}")
                                print()
                        else:
                            print("No records found in the query result.")
                        
                        break
                        
                    elif status and status.status.value == "failed":
                        print(f"❌ Query failed: {status.error_message}")
                        break
                    
                    attempt += 1
                    if attempt % 10 == 0:
                        print(f"Still waiting... ({attempt}/60 seconds)")
                
                if attempt >= max_attempts:
                    print("⏰ Query execution timeout (60 seconds)")
                    print("This is normal - IBKR queries can take several minutes.")
                    print(f"You can check status later using reference code: {response.reference_code}")
                
            else:
                print(f"❌ Flex query execution failed:")
                print(f"Status: {response.status.value}")
                if response.error_message:
                    print(f"Error: {response.error_message}")
            
            # Cleanup
            await service.cleanup()
            
        except Exception as e:
            print(f"❌ Error testing Flex Query: {e}")
            import traceback
            traceback.print_exc()
    
    print("=== Starting Flex Query Test ===")
    asyncio.run(test_flex_query())
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this from the backend directory")
    print("and all dependencies are installed.")
except Exception as e:
    print(f"❌ Configuration error: {e}")
    import traceback
    traceback.print_exc()

print()
print("=== Next Steps ===")
print("1. If the token setup worked, you now have access to your IBKR historical data")
print("2. You can use the Flex Query API endpoints:")
print("   - POST /api/flex-query/execute")
print("   - GET /api/flex-query/{reference_code}/data")
print("   - GET /api/flex-query/trades/{query_id}")
print("3. Start the backend server to access via API: python3 -m uvicorn src.main:app --reload")
print("4. Test the endpoints via your frontend or API testing tool")