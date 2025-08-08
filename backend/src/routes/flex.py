"""
IBKR Flex Query API Routes
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

from ..services.flex_query_service import FlexQueryService
from ..models import FlexQueryRequest, FlexQueryResponse, FlexQueryData, PerformanceMetrics
from ..config import settings

router = APIRouter(prefix="/api/flex", tags=["flex"])
logger = logging.getLogger(__name__)

# Global service instance
flex_service = FlexQueryService()

# Query type mappings
QUERY_MAPPINGS = {
    "trades": settings.ibkr_flex_query_trades,
    "positions": settings.ibkr_flex_query_positions, 
    "cash": settings.ibkr_flex_query_cash_transactions
}

@router.post("/execute/{query_type}")
async def execute_flex_query(query_type: str) -> FlexQueryResponse:
    """Execute a flex query by type (trades, positions, cash)"""
    
    if query_type not in QUERY_MAPPINGS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid query type. Must be one of: {list(QUERY_MAPPINGS.keys())}"
        )
    
    query_id = QUERY_MAPPINGS[query_type]
    if not query_id:
        raise HTTPException(
            status_code=400,
            detail=f"Query ID for {query_type} not configured. Please set IBKR_FLEX_QUERY_{query_type.upper()} environment variable."
        )
    
    if not settings.ibkr_flex_token:
        raise HTTPException(
            status_code=400,
            detail="IBKR Flex token not configured. Please set IBKR_FLEX_TOKEN environment variable."
        )
    
    try:
        request = FlexQueryRequest(
            query_id=query_id,
            token=settings.ibkr_flex_token
        )
        
        logger.info(f"Executing {query_type} flex query: {query_id}")
        response = await flex_service.execute_flex_query(request)
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to execute {query_type} flex query: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{reference_code}")
async def get_query_status(reference_code: str) -> FlexQueryResponse:
    """Get the status of a flex query by reference code"""
    
    try:
        status = await flex_service.get_query_status(reference_code)
        if not status:
            raise HTTPException(status_code=404, detail="Query not found")
        
        return status
        
    except Exception as e:
        logger.error(f"Failed to get status for {reference_code}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data/{reference_code}")
async def get_query_data(reference_code: str) -> FlexQueryData:
    """Get the data from a completed flex query"""
    
    if not settings.ibkr_flex_token:
        raise HTTPException(
            status_code=400,
            detail="IBKR Flex token not configured"
        )
    
    try:
        # Try to get data (will retry if not ready)
        data = await flex_service.get_flex_query_data(
            reference_code=reference_code,
            token=settings.ibkr_flex_token,
            max_retries=3
        )
        
        return data
        
    except Exception as e:
        logger.error(f"Failed to get data for {reference_code}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/wait/{reference_code}")
async def wait_for_completion(reference_code: str, max_wait_time: int = 300) -> FlexQueryData:
    """Wait for a flex query to complete and return data"""
    
    if not settings.ibkr_flex_token:
        raise HTTPException(
            status_code=400,
            detail="IBKR Flex token not configured"
        )
    
    try:
        data = await flex_service.wait_for_query_completion(
            reference_code=reference_code,
            token=settings.ibkr_flex_token,
            max_wait_time=max_wait_time
        )
        
        return data
        
    except Exception as e:
        logger.error(f"Failed to wait for completion {reference_code}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/metrics")
async def calculate_metrics(request: Dict[str, Any]) -> PerformanceMetrics:
    """Calculate performance metrics from trade data"""
    
    try:
        trades = request.get("trades", [])
        start_date_str = request.get("start_date")
        end_date_str = request.get("end_date")
        
        if not trades:
            raise HTTPException(status_code=400, detail="No trade data provided")
        
        # Parse dates
        if start_date_str:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        else:
            start_date = datetime.now() - timedelta(days=90)
            
        if end_date_str:
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        else:
            end_date = datetime.now()
        
        metrics = await flex_service.calculate_performance_metrics(
            trade_records=trades,
            start_date=start_date,
            end_date=end_date
        )
        
        return metrics
        
    except Exception as e:
        logger.error(f"Failed to calculate metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config")
async def get_flex_config():
    """Get the current flex query configuration"""
    
    return {
        "token_configured": bool(settings.ibkr_flex_token),
        "queries": {
            "trades": {
                "query_id": settings.ibkr_flex_query_trades,
                "configured": bool(settings.ibkr_flex_query_trades)
            },
            "positions": {
                "query_id": settings.ibkr_flex_query_positions,
                "configured": bool(settings.ibkr_flex_query_positions)
            },
            "cash": {
                "query_id": settings.ibkr_flex_query_cash_transactions,
                "configured": bool(settings.ibkr_flex_query_cash_transactions)
            }
        }
    }


@router.delete("/cleanup")
async def cleanup_service():
    """Cleanup service resources"""
    
    try:
        await flex_service.cleanup()
        return {"message": "Service cleaned up successfully"}
    except Exception as e:
        logger.error(f"Failed to cleanup service: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check for flex query service"""
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "token_configured": bool(settings.ibkr_flex_token),
        "queries_configured": {
            "trades": bool(settings.ibkr_flex_query_trades),
            "positions": bool(settings.ibkr_flex_query_positions), 
            "cash": bool(settings.ibkr_flex_query_cash_transactions)
        }
    }