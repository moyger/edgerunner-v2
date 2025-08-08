#!/usr/bin/env python3
"""
Test Flex Query API Endpoints
Run this after setting up your IBKR_FLEX_TOKEN
"""
import asyncio
import aiohttp
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

async def test_flex_query_endpoints():
    """Test the Flex Query API endpoints"""
    
    print("=== Testing IBKR Flex Query API Endpoints ===")
    print("Make sure your backend server is running:")
    print("python3 -m uvicorn src.main:app --reload")
    print()
    
    async with aiohttp.ClientSession() as session:
        
        # Test 1: Execute Flex Query
        print("1. Testing Flex Query Execution...")
        try:
            query_data = {
                "query_id": "Edgerunner",  # Your query name
                "token": "YOUR_TOKEN_HERE",  # Replace with actual token
                "broker": "ibkr"
            }
            
            async with session.post(f"{BASE_URL}/flex-query/execute", json=query_data) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Query executed successfully!")
                    print(f"Reference Code: {result['reference_code']}")
                    print(f"Status: {result['status']}")
                    
                    reference_code = result['reference_code']
                    token = query_data['token']
                    
                    # Test 2: Get Query Data (after waiting)
                    print("\n2. Waiting for query to complete...")
                    await asyncio.sleep(5)  # Wait a bit
                    
                    async with session.get(f"{BASE_URL}/flex-query/{reference_code}/data?token={token}") as data_response:
                        if data_response.status == 200:
                            data = await data_response.json()
                            print(f"✅ Data retrieved successfully!")
                            print(f"Data Type: {data['data_type']}")
                            print(f"Total Records: {data['total_records']}")
                            
                            if data['records']:
                                print("\n📊 Sample Records:")
                                for i, record in enumerate(data['records'][:2]):
                                    print(f"Record {i+1}: {json.dumps(record, indent=2)}")
                        else:
                            error = await data_response.text()
                            print(f"❌ Failed to get data: {error}")
                    
                else:
                    error = await response.text()
                    print(f"❌ Failed to execute query: {error}")
                    
        except aiohttp.ClientConnectorError:
            print("❌ Cannot connect to backend server")
            print("Make sure the server is running on http://localhost:8000")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 3: Get Trade History (convenience endpoint)
        print("\n3. Testing Trade History Endpoint...")
        try:
            params = {
                "token": "YOUR_TOKEN_HERE",  # Replace with actual token
                "broker": "ibkr"
            }
            
            async with session.get(f"{BASE_URL}/flex-query/trades/Edgerunner", params=params) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Trade history retrieved!")
                    print(f"Query ID: {result['query_id']}")
                    print(f"Data Type: {result['data_type']}")
                    print(f"Total Records: {result['total_records']}")
                else:
                    error = await response.text()
                    print(f"❌ Failed to get trade history: {error}")
                    
        except Exception as e:
            print(f"❌ Error getting trade history: {e}")

if __name__ == "__main__":
    print("Before running this test:")
    print("1. Set your IBKR_FLEX_TOKEN in .env file")
    print("2. Start your backend server: python3 -m uvicorn src.main:app --reload")
    print("3. Replace 'YOUR_TOKEN_HERE' in this script with your actual token")
    print()
    
    # Uncomment the line below after setting up your token
    # asyncio.run(test_flex_query_endpoints())
    print("Script ready - uncomment the last line to run tests")