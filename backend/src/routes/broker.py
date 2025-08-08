"""
Broker API routes
Handles all broker-related endpoints for connection, trading, and data retrieval
"""
import asyncio
import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

try:
    from ..models import (
        BrokerConnectionRequest, BrokerDisconnectionRequest, BrokerConnection,
        AccountSummary, Position, Order, MarketData, HistoricalData,
        TestRequest, TestResult, OrderRequest, SuccessResponse, ErrorResponse,
        FlexQueryRequest, FlexQueryResponse, FlexQueryData, PerformanceMetrics
    )
    from ..services.broker_service import BrokerService
    from ..services.flex_query_service import FlexQueryService
    from ..services.connection_health import get_health_monitor
except ImportError:
    from models import (
        BrokerConnectionRequest, BrokerDisconnectionRequest, BrokerConnection,
        AccountSummary, Position, Order, MarketData, HistoricalData,
        TestRequest, TestResult, OrderRequest, SuccessResponse, ErrorResponse,
        FlexQueryRequest, FlexQueryResponse, FlexQueryData, PerformanceMetrics
    )
    from services.broker_service import BrokerService
    from services.flex_query_service import FlexQueryService
    from services.connection_health import get_health_monitor

logger = logging.getLogger(__name__)

router = APIRouter()


def get_broker_service(request: Request) -> BrokerService:
    """Dependency to get broker service from app state"""
    return request.app.state.broker_service


def get_flex_query_service(request: Request) -> FlexQueryService:
    """Dependency to get flex query service from app state"""
    if not hasattr(request.app.state, 'flex_query_service'):
        request.app.state.flex_query_service = FlexQueryService()
    return request.app.state.flex_query_service


@router.post("/broker/connect", response_model=BrokerConnection)
async def connect_broker(
    request: BrokerConnectionRequest,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Establish connection to a broker"""
    try:
        logger.info(f"Connecting to broker: {request.broker}")
        connection = await broker_service.connect_broker(request.broker, request.credentials)
        return connection
    except Exception as e:
        logger.error(f"Failed to connect to {request.broker}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/broker/disconnect", response_model=SuccessResponse)
async def disconnect_broker(
    request: BrokerDisconnectionRequest,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Disconnect from a broker"""
    try:
        logger.info(f"Disconnecting from broker: {request.broker}")
        success = await broker_service.disconnect_broker(request.broker)
        
        if success:
            return SuccessResponse(
                message=f"Successfully disconnected from {request.broker}"
            )
        else:
            raise HTTPException(status_code=400, detail="Failed to disconnect")
            
    except Exception as e:
        logger.error(f"Failed to disconnect from {request.broker}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/broker/status", response_model=BrokerConnection)
async def get_broker_status(
    broker: str,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Get connection status for a specific broker"""
    try:
        status = await broker_service.get_broker_status(broker)
        return status
    except Exception as e:
        logger.error(f"Failed to get status for {broker}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/broker/status/all", response_model=dict)
async def get_all_broker_statuses(
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Get connection status for all brokers with enhanced health monitoring"""
    try:
        # Get basic statuses
        statuses = await broker_service.get_all_broker_statuses()
        
        # Add health monitoring data
        health_monitor = get_health_monitor(broker_service)
        health_summary = health_monitor.get_health_summary()
        
        return {
            "statuses": statuses,
            "health_summary": health_summary,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get all broker statuses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/account/summary", response_model=AccountSummary)
async def get_account_summary(
    broker: str,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Get account summary for a broker"""
    try:
        # Auto-ensure MT5 connection when asked for MT5 data
        if broker.lower() == "mt5":
            try:
                from services.mt5_service import mt5_service
                await mt5_service.ensure_connected()
            except Exception:
                pass
        summary = await broker_service.get_account_summary(broker)
        return summary
    except Exception as e:
        logger.error(f"Failed to get account summary for {broker}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/positions", response_model=List[Position])
async def get_positions(
    broker: str,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Get current positions for a broker"""
    try:
        if broker.lower() == "mt5":
            try:
                from services.mt5_service import mt5_service
                await mt5_service.ensure_connected()
            except Exception:
                pass
        positions = await broker_service.get_positions(broker)
        return positions
    except Exception as e:
        logger.error(f"Failed to get positions for {broker}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/market-data", response_model=MarketData)
async def get_market_data(
    broker: str,
    symbol: str,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Get real-time market data for a symbol"""
    try:
        if broker.lower() == "mt5":
            try:
                from services.mt5_service import mt5_service
                await mt5_service.ensure_connected()
            except Exception:
                pass
        data = await broker_service.get_market_data(broker, symbol)
        return data
    except Exception as e:
        logger.error(f"Failed to get market data for {symbol} from {broker}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/historical-data", response_model=HistoricalData)
async def get_historical_data(
    broker: str,
    symbol: str,
    duration: str = "1 D",
    bar_size: str = "1 min",
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Get historical market data for a symbol"""
    try:
        data = await broker_service.get_historical_data(broker, symbol, duration, bar_size)
        return data
    except Exception as e:
        logger.error(f"Failed to get historical data for {symbol} from {broker}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/trade", response_model=Order)
async def place_order(
    order: OrderRequest,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Place a trading order"""
    try:
        logger.info(f"Placing order: {order.action} {order.quantity} {order.symbol} via {order.broker}")
        result = await broker_service.place_order(order)
        return result
    except Exception as e:
        logger.error(f"Failed to place order: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders/status", response_model=Order)
async def get_order_status(
    broker: str,
    order_id: str,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Get order status"""
    try:
        order = await broker_service.get_order_status(broker, order_id)
        return order
    except Exception as e:
        logger.error(f"Failed to get order status for {order_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/cancel", response_model=SuccessResponse)
async def cancel_order(
    broker: str,
    order_id: str,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Cancel an order"""
    try:
        success = await broker_service.cancel_order(broker, order_id)
        
        if success:
            return SuccessResponse(
                message=f"Order {order_id} cancelled successfully"
            )
        else:
            raise HTTPException(status_code=400, detail="Failed to cancel order")
            
    except Exception as e:
        logger.error(f"Failed to cancel order {order_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/broker/test", response_model=List[TestResult])
async def run_broker_tests(
    request: TestRequest,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Run API tests for a broker"""
    try:
        logger.info(f"Running tests for {request.broker}: {request.categories}")
        results = await broker_service.run_tests(request.broker, request.categories)
        return results
    except Exception as e:
        logger.error(f"Failed to run tests for {request.broker}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/broker/test/{test_id}", response_model=TestResult)
async def run_single_test(
    test_id: str,
    broker: str,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """Run a single API test"""
    try:
        logger.info(f"Running test {test_id} for {broker}")
        result = await broker_service.run_single_test(broker, test_id)
        return result
    except Exception as e:
        logger.error(f"Failed to run test {test_id} for {broker}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# IBKR Flex Query endpoints
@router.post("/flex-query/execute", response_model=FlexQueryResponse)
async def execute_flex_query(
    request: FlexQueryRequest,
    flex_service: FlexQueryService = Depends(get_flex_query_service)
):
    """Execute an IBKR Flex Query"""
    try:
        logger.info(f"Executing flex query {request.query_id}")
        response = await flex_service.execute_flex_query(request)
        return response
    except Exception as e:
        logger.error(f"Failed to execute flex query {request.query_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/flex-query/{reference_code}/data", response_model=FlexQueryData)
async def get_flex_query_data(
    reference_code: str,
    token: str,
    wait_if_not_ready: bool = True,
    max_wait_time: int = 180,  # 3 minutes default
    flex_service: FlexQueryService = Depends(get_flex_query_service)
):
    """Retrieve flex query data by reference code with optional waiting"""
    try:
        logger.info(f"Retrieving flex query data for reference code {reference_code}")
        
        if wait_if_not_ready:
            # Use intelligent waiting mechanism
            data = await flex_service.wait_for_query_completion(
                reference_code, token, max_wait_time=max_wait_time
            )
        else:
            # Direct retrieval without waiting
            data = await flex_service.get_flex_query_data(reference_code, token)
            
        logger.info(f"Flex query data retrieved: {data.total_records} records")
        return data
        
    except Exception as e:
        logger.error(f"Failed to retrieve flex query data {reference_code}: {e}")
        error_msg = str(e)
        
        # Provide more helpful error messages for common scenarios
        if "statement not yet available" in error_msg.lower():
            raise HTTPException(
                status_code=202, 
                detail=f"Flex query is still being generated. Please try again in a few moments. Reference code: {reference_code}"
            )
        elif "timeout" in error_msg.lower():
            raise HTTPException(
                status_code=408,
                detail=f"Flex query timed out. You can retry with reference code: {reference_code}"
            )
        else:
            raise HTTPException(status_code=400, detail=error_msg)


@router.get("/flex-query/{reference_code}/status", response_model=FlexQueryResponse)
async def get_flex_query_status(
    reference_code: str,
    flex_service: FlexQueryService = Depends(get_flex_query_service)
):
    """Get flex query execution status"""
    try:
        status = await flex_service.get_query_status(reference_code)
        if status is None:
            raise HTTPException(status_code=404, detail="Query not found")
        return status
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get flex query status {reference_code}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/flex-query/performance/{reference_code}", response_model=PerformanceMetrics)
async def calculate_performance_metrics(
    reference_code: str,
    token: str,
    start_date: str,
    end_date: str,
    flex_service: FlexQueryService = Depends(get_flex_query_service)
):
    """Calculate performance metrics from flex query trade data"""
    try:
        from datetime import datetime
        
        # Parse dates
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Get flex query data
        flex_data = await flex_service.get_flex_query_data(reference_code, token)
        
        if flex_data.data_type != "trades":
            raise HTTPException(
                status_code=400, 
                detail="Performance metrics can only be calculated for trade data"
            )
        
        # Calculate metrics
        metrics = await flex_service.calculate_performance_metrics(
            flex_data.records, start_dt, end_dt
        )
        
        return metrics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to calculate performance metrics: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/flex-query/trades/{query_id}")
async def get_trade_history(
    query_id: str,
    token: str,
    broker: str = "ibkr",
    max_wait_time: int = 300,  # 5 minutes default
    flex_service: FlexQueryService = Depends(get_flex_query_service)
):
    """Get comprehensive trade history via flex query with improved timeout handling"""
    try:
        logger.info(f"Starting trade history request for query_id: {query_id}")
        
        # Execute flex query
        request = FlexQueryRequest(query_id=query_id, token=token, broker=broker)
        response = await flex_service.execute_flex_query(request)
        
        if response.status.value == "failed":
            logger.error(f"Flex query execution failed: {response.error_message}")
            raise HTTPException(status_code=400, detail=response.error_message)
        
        if not response.reference_code:
            logger.error("No reference code received from flex query execution")
            raise HTTPException(status_code=400, detail="No reference code received")
        
        logger.info(f"Flex query executed successfully, reference_code: {response.reference_code}")
        
        # Use the new intelligent waiting mechanism
        try:
            data = await flex_service.wait_for_query_completion(
                response.reference_code, 
                token, 
                max_wait_time=max_wait_time
            )
            
            logger.info(f"Trade history retrieved successfully: {data.total_records} records")
            
            return {
                "query_id": query_id,
                "reference_code": response.reference_code,
                "data_type": data.data_type,
                "total_records": data.total_records,
                "records": data.records[:100] if data.records else [],  # Limit to first 100 records for API response
                "generated_at": data.generated_at,
                "status": "completed"
            }
            
        except Exception as wait_error:
            # If waiting failed, return partial information so user can retry manually
            logger.error(f"Failed to wait for query completion: {wait_error}")
            
            return {
                "query_id": query_id,
                "reference_code": response.reference_code,
                "data_type": "unknown",
                "total_records": 0,
                "records": [],
                "generated_at": datetime.now(),
                "status": "timeout",
                "error_message": str(wait_error),
                "retry_instructions": f"Query may still be processing. You can check status using reference_code: {response.reference_code}"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get trade history: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# WebSocket endpoint for real-time data
@router.websocket("/ws/broker/{broker}")
async def websocket_broker_data(
    websocket: WebSocket,
    broker: str,
    broker_service: BrokerService = Depends(get_broker_service)
):
    """WebSocket endpoint for real-time broker data"""
    await websocket.accept()
    logger.info(f"WebSocket connection established for {broker}")
    
    try:
        while True:
            # Wait for client message (could be symbol subscription, etc.)
            message = await websocket.receive_json()
            
            # Handle different message types
            if message.get("type") == "subscribe_market_data":
                symbol = message.get("symbol")
                if symbol:
                    # Get market data and send to client
                    try:
                        data = await broker_service.get_market_data(broker, symbol)
                        await websocket.send_json({
                            "type": "market_data",
                            "symbol": symbol,
                            "data": data.dict(),
                            "timestamp": datetime.now().isoformat()
                        })
                    except Exception as e:
                        await websocket.send_json({
                            "type": "error",
                            "message": str(e),
                            "timestamp": datetime.now().isoformat()
                        })
            
            elif message.get("type") == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                })
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for {broker}")
    except Exception as e:
        logger.error(f"WebSocket error for {broker}: {e}")
        await websocket.close()


# MT5-specific endpoints
@router.get("/broker/mt5/config", response_model=dict)
async def get_mt5_config():
    """Get MT5 configuration status"""
    try:
        # Import here to avoid circular imports
        from services.mt5_service import mt5_service
        
        config_info = mt5_service.get_connection_info()
        return {
            "configured": config_info["configured"],
            "login": config_info["login"],
            "server": config_info["server"],
            "connected": config_info["connected"],
            "last_check": config_info["last_check"],
            "status": "ready" if config_info["configured"] else "needs_configuration"
        }
    except Exception as e:
        logger.error(f"Failed to get MT5 config: {e}")
        return {
            "configured": False,
            "status": "error",
            "error": str(e)
        }


@router.post("/broker/mt5/auto-connect", response_model=BrokerConnection)
async def mt5_auto_connect():
    """Attempt auto-connection to MT5 using environment credentials"""
    try:
        # Import here to avoid circular imports
        from services.mt5_service import mt5_service
        
        connection = await mt5_service.auto_connect()
        return connection
    except Exception as e:
        logger.error(f"MT5 auto-connect failed: {e}")
        return BrokerConnection(
            id="mt5",
            name="MetaTrader 5", 
            status="error",
            last_checked=datetime.now(),
            error=str(e)
        )


@router.get("/broker/mt5/symbols", response_model=dict)
async def get_mt5_symbols(limit: int = 50):
    """Get available MT5 symbols"""
    try:
        from services.mt5_service import mt5_service
        
        # Ensure connected
        is_connected = await mt5_service.ensure_connected()
        if not is_connected:
            raise HTTPException(status_code=400, detail="MT5 not connected")
        
        adapter = mt5_service.get_adapter()
        symbols = await adapter.get_available_symbols(limit)
        
        return {
            "symbols": symbols,
            "count": len(symbols),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get MT5 symbols: {e}")
        raise HTTPException(status_code=400, detail=str(e))