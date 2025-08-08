"""
IBKR Flex Query Service
Handles integration with IBKR Flex Query Web Service for historical data
"""
import asyncio
import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import aiohttp
from urllib.parse import urlencode

try:
    from ..models import (
        FlexQueryRequest, FlexQueryResponse, FlexQueryData, FlexQueryStatus,
        TradeRecord, CashTransaction, PositionRecord, PerformanceMetrics
    )
    from ..config import settings
except ImportError:
    from models import (
        FlexQueryRequest, FlexQueryResponse, FlexQueryData, FlexQueryStatus,
        TradeRecord, CashTransaction, PositionRecord, PerformanceMetrics
    )
    from config import settings

logger = logging.getLogger(__name__)


class FlexQueryService:
    """Service for interacting with IBKR Flex Query Web Service"""
    
    def __init__(self):
        self.base_url = "https://gdcdyn.interactivebrokers.com/Universal/servlet"
        self.session: Optional[aiohttp.ClientSession] = None
        self.active_queries: Dict[str, FlexQueryResponse] = {}
        
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session"""
        if self.session is None:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=900, connect=30, sock_read=900)  # 15 minutes total, 30s connect, 15 min read
            )
        return self.session
    
    async def execute_flex_query(self, query_request: FlexQueryRequest) -> FlexQueryResponse:
        """
        Execute a flex query and return reference code for data retrieval
        """
        try:
            session = await self._get_session()
            
            # Step 1: Send request to execute flex query
            params = {
                "q": query_request.query_id,
                "t": query_request.token,
                "v": "3"  # Version 3 of the API
            }
            
            url = f"{self.base_url}/FlexStatementService.SendRequest"
            
            logger.info(f"Executing flex query {query_request.query_id}")
            
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: {await response.text()}")
                
                xml_content = await response.text()
                root = ET.fromstring(xml_content)
                
                # Parse response
                status_element = root.find(".//Status")
                if status_element is None:
                    raise Exception("Invalid response format: no Status element")
                
                status_text = status_element.text
                if status_text != "Success":
                    error_code = root.find(".//ErrorCode")
                    error_msg = root.find(".//ErrorMessage")
                    error_text = f"Error {error_code.text if error_code is not None else 'Unknown'}: {error_msg.text if error_msg is not None else 'Unknown error'}"
                    raise Exception(error_text)
                
                # Extract reference code
                reference_code_element = root.find(".//ReferenceCode")
                if reference_code_element is None:
                    raise Exception("No reference code in response")
                
                reference_code = reference_code_element.text
                
                # Create response object
                flex_response = FlexQueryResponse(
                    query_id=query_request.query_id,
                    reference_code=reference_code,
                    status=FlexQueryStatus.RUNNING,
                    created_at=datetime.now()
                )
                
                # Store in active queries
                self.active_queries[reference_code] = flex_response
                
                logger.info(f"Flex query {query_request.query_id} started with reference code {reference_code}")
                return flex_response
                
        except Exception as e:
            logger.error(f"Failed to execute flex query {query_request.query_id}: {e}")
            return FlexQueryResponse(
                query_id=query_request.query_id,
                status=FlexQueryStatus.FAILED,
                created_at=datetime.now(),
                error_message=str(e)
            )
    
    async def get_flex_query_data(self, reference_code: str, token: str, max_retries: int = 8) -> FlexQueryData:
        """
        Retrieve flex query data using reference code with exponential backoff retry
        """
        for attempt in range(max_retries):
            try:
                session = await self._get_session()
                
                params = {
                    "q": reference_code,
                    "t": token,
                    "v": "3"
                }
                
                url = f"{self.base_url}/FlexStatementService.GetStatement"
                
                logger.info(f"Retrieving flex query data for reference code {reference_code} (attempt {attempt + 1}/{max_retries})")
                
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        response_text = await response.text()
                        logger.warning(f"HTTP {response.status} on attempt {attempt + 1}: {response_text}")
                        
                        # If it's a server error or timeout, retry with backoff
                        if response.status >= 500 or response.status == 408:
                            if attempt < max_retries - 1:
                                wait_time = (2 ** attempt) + 1  # 1, 3, 5, 9, 17 seconds
                                logger.info(f"Retrying in {wait_time} seconds...")
                                await asyncio.sleep(wait_time)
                                continue
                        
                        raise Exception(f"HTTP {response.status}: {response_text}")
                    
                    xml_content = await response.text()
                    root = ET.fromstring(xml_content)
                    
                    # Check for IBKR-specific errors
                    error_code = root.find(".//ErrorCode")
                    if error_code is not None and error_code.text != "0":
                        error_msg = root.find(".//ErrorMessage")
                        error_text = f"Error {error_code.text}: {error_msg.text if error_msg is not None else 'Unknown error'}"
                        
                        # Check if it's a "statement not ready" error - retry with exponential backoff
                        if any(phrase in error_text.lower() for phrase in [
                            "statement not yet available", 
                            "statement is being generated",
                            "report generation in progress",
                            "statement not ready"
                        ]):
                            if attempt < max_retries - 1:
                                # Progressive backoff: 15, 30, 45, 60, 90, 120, 180 seconds
                                wait_time = min(15 + (attempt * 15), 180)
                                logger.info(f"Statement not ready (attempt {attempt + 1}/{max_retries}), retrying in {wait_time}s... ({error_text})")
                                await asyncio.sleep(wait_time)
                                continue
                        
                        raise Exception(error_text)
                    
                    # Parse data based on flex query content
                    flex_data = self._parse_flex_query_xml(root, reference_code)
                    
                    # Update query status
                    if reference_code in self.active_queries:
                        self.active_queries[reference_code].status = FlexQueryStatus.COMPLETED
                        self.active_queries[reference_code].completed_at = datetime.now()
                    
                    logger.info(f"Successfully retrieved flex query data for {reference_code}: {flex_data.total_records} records")
                    return flex_data
                    
            except Exception as e:
                logger.error(f"Failed to retrieve flex query data {reference_code} on attempt {attempt + 1}: {e}")
                
                # If this is the last attempt, update status and re-raise
                if attempt == max_retries - 1:
                    if reference_code in self.active_queries:
                        self.active_queries[reference_code].status = FlexQueryStatus.FAILED
                        self.active_queries[reference_code].error_message = str(e)
                    raise
                
                # Otherwise, wait before retrying (only for certain types of errors)
                if "statement not yet available" in str(e).lower() or "timeout" in str(e).lower():
                    wait_time = (2 ** attempt) + 10  # 11, 12, 14, 18, 26 seconds
                    logger.info(f"Retrying in {wait_time} seconds due to: {e}")
                    await asyncio.sleep(wait_time)
                else:
                    # For other errors, don't retry
                    if reference_code in self.active_queries:
                        self.active_queries[reference_code].status = FlexQueryStatus.FAILED
                        self.active_queries[reference_code].error_message = str(e)
                    raise
    
    def _parse_flex_query_xml(self, root: ET.Element, reference_code: str) -> FlexQueryData:
        """Parse flex query XML response into structured data"""
        
        records = []
        data_type = "unknown"
        
        # Check for different types of data
        if root.find(".//Trade") is not None:
            data_type = "trades"
            records = self._parse_trade_records(root)
        elif root.find(".//CashTransaction") is not None:
            data_type = "cash_transactions"
            records = self._parse_cash_transactions(root)
        elif root.find(".//OpenPosition") is not None:
            data_type = "positions"
            records = self._parse_position_records(root)
        elif root.find(".//ChangeInDividendAccrual") is not None:
            data_type = "dividends"
            records = self._parse_dividend_records(root)
        else:
            # Generic parsing - extract all elements with attributes
            for element in root.iter():
                if element.attrib and element.tag not in ['FlexQueryResponse', 'FlexStatements', 'FlexStatement']:
                    records.append(dict(element.attrib))
            data_type = "generic"
        
        return FlexQueryData(
            query_id=reference_code,
            data_type=data_type,
            records=records,
            total_records=len(records),
            generated_at=datetime.now()
        )
    
    def _parse_trade_records(self, root: ET.Element) -> List[Dict[str, Any]]:
        """Parse trade records from XML"""
        trades = []
        for trade in root.findall(".//Trade"):
            trade_data = dict(trade.attrib)
            # Convert common fields to proper types
            if 'tradeDate' in trade_data:
                trade_data['trade_date'] = trade_data.pop('tradeDate')
            if 'settleDate' in trade_data:
                trade_data['settle_date'] = trade_data.pop('settleDate')
            if 'quantity' in trade_data:
                trade_data['quantity'] = float(trade_data['quantity'])
            if 'price' in trade_data:
                trade_data['price'] = float(trade_data['price'])
            if 'proceeds' in trade_data:
                trade_data['proceeds'] = float(trade_data['proceeds'])
            if 'commission' in trade_data:
                trade_data['commission'] = float(trade_data['commission'])
            if 'realizedPL' in trade_data:
                trade_data['realized_pnl'] = float(trade_data.pop('realizedPL'))
            
            trades.append(trade_data)
        return trades
    
    def _parse_cash_transactions(self, root: ET.Element) -> List[Dict[str, Any]]:
        """Parse cash transaction records from XML"""
        transactions = []
        for transaction in root.findall(".//CashTransaction"):
            tx_data = dict(transaction.attrib)
            # Convert fields
            if 'amount' in tx_data:
                tx_data['amount'] = float(tx_data['amount'])
            if 'dateTime' in tx_data:
                tx_data['date'] = tx_data.pop('dateTime')
            
            transactions.append(tx_data)
        return transactions
    
    def _parse_position_records(self, root: ET.Element) -> List[Dict[str, Any]]:
        """Parse position records from XML"""
        positions = []
        for position in root.findall(".//OpenPosition"):
            pos_data = dict(position.attrib)
            # Convert fields
            if 'position' in pos_data:
                pos_data['position'] = float(pos_data['position'])
            if 'markPrice' in pos_data:
                pos_data['mark_price'] = float(pos_data.pop('markPrice'))
            if 'positionValue' in pos_data:
                pos_data['position_value'] = float(pos_data.pop('positionValue'))
            if 'unrealizedPL' in pos_data:
                pos_data['unrealized_pnl'] = float(pos_data.pop('unrealizedPL'))
            
            positions.append(pos_data)
        return positions
    
    def _parse_dividend_records(self, root: ET.Element) -> List[Dict[str, Any]]:
        """Parse dividend records from XML"""
        dividends = []
        for dividend in root.findall(".//ChangeInDividendAccrual"):
            div_data = dict(dividend.attrib)
            # Convert fields
            if 'totalCash' in div_data:
                div_data['amount'] = float(div_data.pop('totalCash'))
            if 'date' in div_data:
                div_data['ex_date'] = div_data['date']
            
            dividends.append(div_data)
        return dividends
    
    async def calculate_performance_metrics(self, trade_records: List[Dict[str, Any]], 
                                          start_date: datetime, end_date: datetime) -> PerformanceMetrics:
        """Calculate performance metrics from trade records"""
        
        if not trade_records:
            return PerformanceMetrics(
                total_realized_pnl=0.0,
                total_unrealized_pnl=0.0,
                total_commissions=0.0,
                total_fees=0.0,
                net_pnl=0.0,
                win_rate=0.0,
                profit_factor=0.0,
                max_drawdown=0.0,
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                avg_winning_trade=0.0,
                avg_losing_trade=0.0,
                largest_win=0.0,
                largest_loss=0.0,
                period_start=start_date,
                period_end=end_date
            )
        
        # Calculate basic metrics
        total_realized_pnl = sum(float(trade.get('realized_pnl', 0)) for trade in trade_records)
        total_commissions = sum(float(trade.get('commission', 0)) for trade in trade_records)
        total_fees = sum(float(trade.get('fees', 0)) for trade in trade_records)
        
        # Filter winning and losing trades
        winning_trades = [t for t in trade_records if float(t.get('realized_pnl', 0)) > 0]
        losing_trades = [t for t in trade_records if float(t.get('realized_pnl', 0)) < 0]
        
        win_rate = len(winning_trades) / len(trade_records) if trade_records else 0
        
        # Calculate profit factor
        gross_profit = sum(float(t.get('realized_pnl', 0)) for t in winning_trades)
        gross_loss = abs(sum(float(t.get('realized_pnl', 0)) for t in losing_trades))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
        
        # Calculate averages
        avg_winning_trade = gross_profit / len(winning_trades) if winning_trades else 0
        avg_losing_trade = -gross_loss / len(losing_trades) if losing_trades else 0
        
        # Find largest win/loss
        largest_win = max((float(t.get('realized_pnl', 0)) for t in winning_trades), default=0)
        largest_loss = min((float(t.get('realized_pnl', 0)) for t in losing_trades), default=0)
        
        # Calculate running P&L for drawdown
        running_pnl = 0
        peak = 0
        max_drawdown = 0
        
        for trade in sorted(trade_records, key=lambda x: x.get('trade_date', '')):
            running_pnl += float(trade.get('realized_pnl', 0))
            if running_pnl > peak:
                peak = running_pnl
            drawdown = (peak - running_pnl) / peak if peak > 0 else 0
            max_drawdown = max(max_drawdown, drawdown)
        
        net_pnl = total_realized_pnl - total_commissions - total_fees
        
        return PerformanceMetrics(
            total_realized_pnl=total_realized_pnl,
            total_unrealized_pnl=0.0,  # Not available in trade records
            total_commissions=total_commissions,
            total_fees=total_fees,
            net_pnl=net_pnl,
            win_rate=win_rate,
            profit_factor=profit_factor,
            max_drawdown=max_drawdown,
            total_trades=len(trade_records),
            winning_trades=len(winning_trades),
            losing_trades=len(losing_trades),
            avg_winning_trade=avg_winning_trade,
            avg_losing_trade=avg_losing_trade,
            largest_win=largest_win,
            largest_loss=largest_loss,
            period_start=start_date,
            period_end=end_date
        )
    
    async def get_query_status(self, reference_code: str) -> Optional[FlexQueryResponse]:
        """Get status of a flex query by reference code"""
        return self.active_queries.get(reference_code)
    
    async def wait_for_query_completion(self, reference_code: str, token: str, 
                                      max_wait_time: int = 600, check_interval: int = 10) -> FlexQueryData:
        """
        Wait for a flex query to complete and return the data
        Uses intelligent polling with exponential backoff
        """
        start_time = datetime.now()
        attempt = 0
        last_log_time = start_time
        
        logger.info(f"Waiting for flex query {reference_code} to complete (max {max_wait_time}s)")
        
        while (datetime.now() - start_time).total_seconds() < max_wait_time:
            try:
                # Try to get the data - if ready, it will return immediately
                data = await self.get_flex_query_data(reference_code, token, max_retries=1)
                completion_time = (datetime.now() - start_time).total_seconds()
                logger.info(f"Flex query {reference_code} completed after {completion_time:.1f} seconds")
                return data
                
            except Exception as e:
                error_str = str(e).lower()
                
                # Check if it's a "not ready" error - continue waiting
                if any(phrase in error_str for phrase in [
                    "statement not yet available", 
                    "statement is being generated",
                    "statement not ready",
                    "report generation in progress"
                ]):
                    # Log progress every 30 seconds
                    if (datetime.now() - last_log_time).total_seconds() >= 30:
                        elapsed = (datetime.now() - start_time).total_seconds()
                        logger.info(f"Still waiting for flex query {reference_code}... ({elapsed:.0f}s elapsed)")
                        last_log_time = datetime.now()
                    
                    # Dynamic wait time - start with shorter intervals, increase over time
                    if attempt < 6:  # First minute: 10s intervals
                        wait_time = check_interval
                    elif attempt < 18:  # Next 2 minutes: 15s intervals  
                        wait_time = 15
                    else:  # After 3 minutes: 20s intervals
                        wait_time = 20
                    
                    attempt += 1
                    await asyncio.sleep(wait_time)
                    continue
                
                # For other errors, fail immediately
                logger.error(f"Flex query {reference_code} failed: {e}")
                raise
        
        # Timeout reached
        elapsed = (datetime.now() - start_time).total_seconds()
        timeout_msg = f"Flex query {reference_code} timed out after {elapsed:.0f} seconds"
        logger.error(timeout_msg)
        
        # Update query status
        if reference_code in self.active_queries:
            self.active_queries[reference_code].status = FlexQueryStatus.FAILED
            self.active_queries[reference_code].error_message = timeout_msg
        
        raise Exception(timeout_msg)
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()
            self.session = None