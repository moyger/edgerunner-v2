#!/usr/bin/env python3
"""
Simplified FastAPI server for Flex Query functionality
"""
import sys
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import aiohttp
import xml.etree.ElementTree as ET

# Flex Query Models
class FlexQueryRequest(BaseModel):
    query_id: str
    token: str
    broker: str = "ibkr"

class FlexQueryResponse(BaseModel):
    query_id: str
    reference_code: Optional[str] = None
    status: str
    created_at: datetime
    error_message: Optional[str] = None

class FlexQueryData(BaseModel):
    query_id: str
    data_type: str
    records: List[Dict[str, Any]]
    total_records: int
    generated_at: datetime

# Simple Flex Query Service
class SimpleFlexQueryService:
    def __init__(self):
        self.base_url = "https://gdcdyn.interactivebrokers.com/Universal/servlet"
        self.session: Optional[aiohttp.ClientSession] = None
        self.active_queries: Dict[str, FlexQueryResponse] = {}
        
    async def _get_session(self) -> aiohttp.ClientSession:
        if self.session is None:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=300)
            )
        return self.session
    
    async def execute_flex_query(self, request: FlexQueryRequest) -> FlexQueryResponse:
        try:
            session = await self._get_session()
            
            params = {
                "q": request.query_id,
                "t": request.token,
                "v": "3"
            }
            
            url = f"{self.base_url}/FlexStatementService.SendRequest"
            
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: {await response.text()}")
                
                xml_content = await response.text()
                root = ET.fromstring(xml_content)
                
                status_element = root.find(".//Status")
                if status_element is None or status_element.text != "Success":
                    error_code = root.find(".//ErrorCode")
                    error_msg = root.find(".//ErrorMessage")
                    error_text = f"Error {error_code.text if error_code is not None else 'Unknown'}: {error_msg.text if error_msg is not None else 'Unknown error'}"
                    raise Exception(error_text)
                
                reference_code_element = root.find(".//ReferenceCode")
                if reference_code_element is None:
                    raise Exception("No reference code in response")
                
                reference_code = reference_code_element.text
                
                flex_response = FlexQueryResponse(
                    query_id=request.query_id,
                    reference_code=reference_code,
                    status="running",
                    created_at=datetime.now()
                )
                
                self.active_queries[reference_code] = flex_response
                return flex_response
                
        except Exception as e:
            return FlexQueryResponse(
                query_id=request.query_id,
                status="failed",
                created_at=datetime.now(),
                error_message=str(e)
            )
    
    async def get_flex_query_data(self, reference_code: str, token: str) -> FlexQueryData:
        try:
            session = await self._get_session()
            
            params = {
                "q": reference_code,
                "t": token,
                "v": "3"
            }
            
            url = f"{self.base_url}/FlexStatementService.GetStatement"
            
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: {await response.text()}")
                
                xml_content = await response.text()
                root = ET.fromstring(xml_content)
                
                error_code = root.find(".//ErrorCode")
                if error_code is not None and error_code.text != "0":
                    error_msg = root.find(".//ErrorMessage")
                    error_text = f"Error {error_code.text}: {error_msg.text if error_msg is not None else 'Unknown error'}"
                    raise Exception(error_text)
                
                # Parse trades
                records = []
                data_type = "unknown"
                
                if root.find(".//Trade") is not None:
                    data_type = "trades"
                    for trade in root.findall(".//Trade"):
                        trade_data = dict(trade.attrib)
                        # Convert common fields
                        if 'quantity' in trade_data:
                            trade_data['quantity'] = float(trade_data['quantity'])
                        if 'price' in trade_data:
                            trade_data['price'] = float(trade_data['price'])
                        if 'proceeds' in trade_data:
                            trade_data['proceeds'] = float(trade_data['proceeds'])
                        if 'commission' in trade_data:
                            trade_data['commission'] = float(trade_data['commission'])
                        if 'realizedPL' in trade_data:
                            trade_data['realizedPL'] = float(trade_data['realizedPL'])
                        records.append(trade_data)
                
                if reference_code in self.active_queries:
                    self.active_queries[reference_code].status = "completed"
                
                return FlexQueryData(
                    query_id=reference_code,
                    data_type=data_type,
                    records=records,
                    total_records=len(records),
                    generated_at=datetime.now()
                )
                
        except Exception as e:
            if reference_code in self.active_queries:
                self.active_queries[reference_code].status = "failed"
                self.active_queries[reference_code].error_message = str(e)
            raise HTTPException(status_code=400, detail=str(e))

# Create FastAPI app
app = FastAPI(title="Flex Query Server", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service instance
flex_service = SimpleFlexQueryService()

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "uptime": 0,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/status")
async def api_status():
    return {
        "api": "healthy",
        "flex_queries": "available",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/broker/status/all")
async def broker_status_all():
    return {
        "ibkr": {
            "status": "disconnected",
            "id": "ibkr",
            "name": "IBKR",
            "last_checked": datetime.now().isoformat(),
            "error": "This server only handles Flex Queries - use main backend for live data"
        }
    }

@app.post("/api/flex-query/execute")
async def execute_flex_query(request: FlexQueryRequest):
    response = await flex_service.execute_flex_query(request)
    return response

@app.get("/api/flex-query/{reference_code}/data")
async def get_flex_query_data(reference_code: str, token: str):
    data = await flex_service.get_flex_query_data(reference_code, token)
    return data

@app.get("/api/flex-query/trades/{query_id}")
async def get_trade_history(query_id: str, token: str, broker: str = "ibkr"):
    """Get trade history via flex query"""
    # Execute the query
    request = FlexQueryRequest(query_id=query_id, token=token, broker=broker)
    response = await flex_service.execute_flex_query(request)
    
    if response.status == "failed":
        raise HTTPException(status_code=400, detail=response.error_message)
    
    # Wait a bit for query to process
    await asyncio.sleep(2)
    
    # Try to get the data
    try:
        data = await flex_service.get_flex_query_data(response.reference_code, token)
        return {
            "query_id": query_id,
            "reference_code": response.reference_code,
            "data_type": data.data_type,
            "total_records": data.total_records,
            "records": data.records[:100],  # Limit for API response
            "generated_at": data.generated_at.isoformat()
        }
    except Exception as e:
        # Query probably still processing
        return {
            "query_id": query_id,
            "reference_code": response.reference_code,
            "status": "processing",
            "message": "Query is still processing. Try again in a few minutes.",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Flex Query Server...")
    print("📊 IBKR Flex Query endpoints available at http://localhost:8000")
    print("📖 API docs at http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)