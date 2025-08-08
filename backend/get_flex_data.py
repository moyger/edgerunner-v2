#!/usr/bin/env python3
"""
Retrieve completed Flex Query data
"""
import sys
import asyncio
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

async def get_flex_data():
    try:
        from services.flex_query_service import FlexQueryService
        from config import settings
        
        service = FlexQueryService()
        
        print("=== Retrieving Your IBKR Trading Data ===")
        print()
        
        # Use the reference code from the previous test
        reference_code = "5400361836"
        token = settings.ibkr_flex_token
        
        print(f"Fetching data for reference code: {reference_code}")
        
        try:
            data = await service.get_flex_query_data(reference_code, token)
            
            print(f"✅ Data retrieved successfully!")
            print(f"📊 Data Type: {data.data_type}")
            print(f"📊 Total Records: {data.total_records}")
            print(f"📊 Generated At: {data.generated_at}")
            print()
            
            if data.records and len(data.records) > 0:
                print("=== Your Trading Data (First 5 Records) ===")
                for i, record in enumerate(data.records[:5]):
                    print(f"\n📈 Record {i + 1}:")
                    for key, value in record.items():
                        if key in ['symbol', 'tradeDate', 'quantity', 'price', 'proceeds', 'commission', 'realizedPL']:
                            print(f"  {key}: {value}")
                        elif key in ['buySell', 'openCloseIndicator', 'currency']:
                            print(f"  {key}: {value}")
                
                print(f"\n📊 Total trades found: {data.total_records}")
                
                # Show summary statistics
                if data.data_type == "trades":
                    total_commission = sum(float(r.get('commission', 0)) for r in data.records if r.get('commission'))
                    total_pnl = sum(float(r.get('realizedPL', 0)) for r in data.records if r.get('realizedPL'))
                    
                    print("\n=== Summary Statistics ===")
                    print(f"💰 Total Realized P&L: ${total_pnl:,.2f}")
                    print(f"💸 Total Commissions: ${total_commission:,.2f}")
                    print(f"📈 Net P&L: ${total_pnl - total_commission:,.2f}")
                
            else:
                print("❌ No trading records found in the query result.")
                print("This might mean:")
                print("- The query is still processing")
                print("- No trades in the selected date range")
                print("- Query configuration issue")
            
            await service.cleanup()
            
        except Exception as e:
            if "still being prepared" in str(e).lower():
                print("⏳ Query is still being prepared by IBKR...")
                print("Try again in a few minutes.")
            else:
                print(f"❌ Error retrieving data: {e}")
        
    except Exception as e:
        print(f"❌ Setup error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(get_flex_data())