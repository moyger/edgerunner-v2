"""
Mock MetaTrader5 module for development and testing on non-Windows systems
This provides the same interface as the real MetaTrader5 module for testing
"""
from datetime import datetime
import time
from typing import Any, Optional, Tuple, Dict, List


# Constants from the real MT5 module
TIMEFRAME_M1 = 1
TIMEFRAME_M5 = 5
TIMEFRAME_M15 = 15
TIMEFRAME_M30 = 30
TIMEFRAME_H1 = 16385
TIMEFRAME_H4 = 16388
TIMEFRAME_D1 = 16408

ORDER_TYPE_BUY = 0
ORDER_TYPE_SELL = 1
ORDER_TYPE_BUY_LIMIT = 2
ORDER_TYPE_SELL_LIMIT = 3
ORDER_TYPE_BUY_STOP = 4
ORDER_TYPE_SELL_STOP = 5

TRADE_ACTION_DEAL = 1
TRADE_ACTION_PENDING = 5
TRADE_ACTION_SLTP = 6
TRADE_ACTION_MODIFY = 7
TRADE_ACTION_REMOVE = 8

ORDER_TIME_GTC = 0
ORDER_FILLING_IOC = 1

TRADE_RETCODE_DONE = 10009
TRADE_RETCODE_PLACED = 10008
TRADE_RETCODE_DONE_PARTIAL = 10010

ORDER_STATE_FILLED = 2
ORDER_STATE_CANCELED = 8
ORDER_STATE_PARTIAL = 1


class MockNamedTuple:
    """Mock named tuple for MT5 responses"""
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def _asdict(self):
        return {key: value for key, value in self.__dict__.items() if not key.startswith('_')}


# Global state
_initialized = False
_connected = False
_login = None
_server = None
_last_error = 0
_demo_mode = True  # Always in demo/mock mode


def initialize() -> bool:
    """Mock MT5 initialization"""
    global _initialized
    _initialized = True
    return True


def shutdown():
    """Mock MT5 shutdown"""
    global _initialized, _connected, _login, _server
    _initialized = False
    _connected = False
    _login = None
    _server = None


def login(login: int, password: str, server: str) -> bool:
    """Mock MT5 login"""
    global _connected, _login, _server
    if not _initialized:
        return False
    
    # Mock successful login for any valid credentials
    if login and password and server:
        _connected = True
        _login = login
        _server = server
        return True
    
    return False


def account_info() -> Optional[MockNamedTuple]:
    """Mock account info with realistic demo data"""
    if not _connected:
        return None
    
    return MockNamedTuple(
        login=_login or 50012345,
        balance=50000.00,
        equity=50125.50,
        margin=2500.00,
        margin_free=47625.50,
        currency="USD",
        server=_server or "MetaQuotes-Demo",
        name="Demo Account",
        company="MetaQuotes Ltd",
        credit=0.0,
        profit=125.50,
        margin_level=2005.02,
        leverage=100,
        trade_allowed=True,
        trade_expert=True,
        limit_orders=200,
        margin_so_mode=0,
        margin_so_call=50.0,
        margin_so_so=30.0,
        fifo_close=False
    )


def terminal_info() -> Optional[MockNamedTuple]:
    """Mock terminal info"""
    if not _initialized:
        return None
    
    return MockNamedTuple(
        community_account=False,
        community_connection=False,
        connected=_connected,
        dlls_allowed=True,
        trade_allowed=True,
        tradeapi_disabled=False,
        email_enabled=False,
        ftp_enabled=False,
        notifications_enabled=False,
        mqid=False,
        build=3930,
        maxbars=100000,
        codepage=1252,
        ping_last=0,
        community_balance=0.0,
        retransmission=0.0,
        company="MetaQuotes Ltd.",
        name="MetaTrader 5",
        language="English",
        path="C:\\Program Files\\MetaTrader 5\\terminal64.exe",
        data_path="C:\\Users\\User\\AppData\\Roaming\\MetaQuotes\\Terminal\\",
        commondata_path="C:\\Users\\User\\AppData\\Roaming\\MetaQuotes\\Terminal\\Common"
    )


def positions_get() -> Tuple[MockNamedTuple, ...]:
    """Mock positions with realistic demo data"""
    if not _connected:
        return ()
    
    # Return mock positions with varied data
    current_time = int(time.time())
    return (
        MockNamedTuple(
            ticket=50012345,
            time=current_time - 3600,  # Opened 1 hour ago
            time_msc=(current_time - 3600) * 1000,
            time_update=current_time,
            time_update_msc=current_time * 1000,
            type=ORDER_TYPE_BUY,
            magic=234000,
            identifier=50012345,
            reason=0,
            volume=0.1,
            price_open=1.0850,
            sl=1.0800,  # Stop loss
            tp=1.0950,  # Take profit
            price_current=1.0875,
            swap=-0.15,
            profit=25.00,
            symbol="EURUSD",
            comment="Demo buy position",
            external_id=""
        ),
        MockNamedTuple(
            ticket=50012346,
            time=current_time - 7200,  # Opened 2 hours ago
            time_msc=(current_time - 7200) * 1000,
            time_update=current_time,
            time_update_msc=current_time * 1000,
            type=ORDER_TYPE_SELL,
            magic=234000,
            identifier=50012346,
            reason=0,
            volume=0.2,
            price_open=1.2750,
            sl=1.2800,
            tp=1.2650,
            price_current=1.2735,
            swap=-0.25,
            profit=30.00,
            symbol="GBPUSD",
            comment="Demo sell position",
            external_id=""
        ),
    )


def symbol_info_tick(symbol: str) -> Optional[MockNamedTuple]:
    """Mock symbol tick data with realistic spreads"""
    if not _connected:
        return None
    
    # Mock tick data based on symbol with realistic spreads
    current_time = int(time.time())
    if symbol.upper() == "EURUSD":
        bid, ask = 1.0850, 1.0852  # 2 pip spread
        volume = 150
    elif symbol.upper() == "GBPUSD":
        bid, ask = 1.2735, 1.2738  # 3 pip spread
        volume = 120
    elif symbol.upper() == "USDJPY":
        bid, ask = 149.50, 149.53  # 3 pip spread
        volume = 200
    elif symbol.upper() == "AUDUSD":
        bid, ask = 0.6420, 0.6423  # 3 pip spread
        volume = 80
    elif symbol.upper() == "USDCAD":
        bid, ask = 1.3650, 1.3653  # 3 pip spread
        volume = 90
    else:
        # Default forex pair
        bid, ask = 1.0000, 1.0003
        volume = 50
    
    return MockNamedTuple(
        time=current_time,
        bid=bid,
        ask=ask,
        last=(bid + ask) / 2,
        volume=volume,
        time_msc=current_time * 1000,
        flags=6,  # Typical MT5 tick flags
        volume_real=float(volume)
    )


def copy_rates_from_pos(symbol: str, timeframe: int, start_pos: int, count: int) -> Optional[List[Dict[str, Any]]]:
    """Mock historical rates"""
    if not _connected:
        return None
    
    # Generate mock OHLCV data
    rates = []
    base_price = 1.1850 if "EUR" in symbol.upper() else 100.0
    current_time = int(time.time())
    
    for i in range(count):
        timestamp = current_time - (count - i) * 3600  # 1 hour intervals
        
        # Simple price simulation
        offset = (i % 10 - 5) * 0.001
        open_price = base_price + offset
        high_price = open_price + abs(offset) * 0.5
        low_price = open_price - abs(offset) * 0.5
        close_price = open_price + (offset * 0.8)
        
        rates.append({
            'time': timestamp,
            'open': round(open_price, 5),
            'high': round(high_price, 5),
            'low': round(low_price, 5),
            'close': round(close_price, 5),
            'tick_volume': 1000 + i * 10,
            'spread': 2,
            'real_volume': 0
        })
    
    return rates


def order_send(request: Dict[str, Any]) -> Optional[MockNamedTuple]:
    """Mock order sending"""
    if not _connected:
        return None
    
    # Mock successful order
    return MockNamedTuple(
        retcode=TRADE_RETCODE_DONE,
        deal=67890,
        order=12345,
        volume=request.get('volume', 0.1),
        price=request.get('price', 1.1850),
        bid=1.1850,
        ask=1.1852,
        comment="Mock order executed",
        external_id="",
        request_id=1
    )


def history_orders_get(ticket: Optional[int] = None) -> Tuple[MockNamedTuple, ...]:
    """Mock order history"""
    if not _connected or not ticket:
        return ()
    
    return (
        MockNamedTuple(
            ticket=ticket,
            time_setup=int(time.time()) - 3600,
            time_setup_msc=(int(time.time()) - 3600) * 1000,
            time_done=int(time.time()),
            time_done_msc=int(time.time()) * 1000,
            time_expiration=0,
            type=ORDER_TYPE_BUY,
            type_filling=ORDER_FILLING_IOC,
            type_time=ORDER_TIME_GTC,
            state=ORDER_STATE_FILLED,
            magic=0,
            position_id=12345,
            position_by_id=0,
            reason=0,
            volume_initial=0.1,
            volume_current=0.0,
            price_open=1.1850,
            sl=0.0,
            tp=0.0,
            price_current=1.1850,
            price_stoplimit=0.0,
            symbol="EURUSD",
            comment="Mock order",
            external_id=""
        ),
    )


def orders_get(ticket: Optional[int] = None) -> Tuple[MockNamedTuple, ...]:
    """Mock active orders"""
    if not _connected:
        return ()
    
    # Return empty tuple (no active orders) or specific order if ticket provided
    if ticket:
        return (
            MockNamedTuple(
                ticket=ticket,
                time_setup=int(time.time()),
                time_setup_msc=int(time.time()) * 1000,
                time_expiration=0,
                type=ORDER_TYPE_BUY_LIMIT,
                type_filling=ORDER_FILLING_IOC,
                type_time=ORDER_TIME_GTC,
                state=1,  # ORDER_STATE_PLACED
                magic=0,
                position_id=0,
                position_by_id=0,
                reason=0,
                volume_initial=0.1,
                volume_current=0.1,
                price_open=1.1800,
                sl=0.0,
                tp=0.0,
                price_current=1.1850,
                price_stoplimit=0.0,
                symbol="EURUSD",
                comment="Mock pending order",
                external_id=""
            ),
        )
    
    return ()


def symbols_get() -> Optional[Tuple[MockNamedTuple, ...]]:
    """Mock available symbols with comprehensive major pairs"""
    if not _connected:
        return None
    
    current_time = int(time.time())
    
    # Major forex pairs with realistic data
    major_pairs = [
        {"name": "EURUSD", "description": "Euro vs US Dollar", "bid": 1.0850, "ask": 1.0852, "spread": 2, "base": "EUR", "profit": "USD"},
        {"name": "GBPUSD", "description": "British Pound vs US Dollar", "bid": 1.2735, "ask": 1.2738, "spread": 3, "base": "GBP", "profit": "USD"},
        {"name": "USDJPY", "description": "US Dollar vs Japanese Yen", "bid": 149.50, "ask": 149.53, "spread": 3, "base": "USD", "profit": "JPY"},
        {"name": "AUDUSD", "description": "Australian Dollar vs US Dollar", "bid": 0.6420, "ask": 0.6423, "spread": 3, "base": "AUD", "profit": "USD"},
        {"name": "USDCAD", "description": "US Dollar vs Canadian Dollar", "bid": 1.3650, "ask": 1.3653, "spread": 3, "base": "USD", "profit": "CAD"},
        {"name": "USDCHF", "description": "US Dollar vs Swiss Franc", "bid": 0.8945, "ask": 0.8948, "spread": 3, "base": "USD", "profit": "CHF"},
        {"name": "NZDUSD", "description": "New Zealand Dollar vs US Dollar", "bid": 0.5980, "ask": 0.5984, "spread": 4, "base": "NZD", "profit": "USD"},
        {"name": "EURJPY", "description": "Euro vs Japanese Yen", "bid": 162.15, "ask": 162.20, "spread": 5, "base": "EUR", "profit": "JPY"},
    ]
    
    mock_symbols = []
    for pair in major_pairs:
        # Determine digits based on pair
        digits = 3 if "JPY" in pair["name"] else 5
        point = 0.001 if digits == 3 else 0.00001
        contract_size = 100000.0
        
        mock_symbols.append(MockNamedTuple(
            custom=False,
            chart_mode=0,
            select=True,
            visible=True,
            session_deals=0,
            session_buy_orders=0,
            session_sell_orders=0,
            volume=0,
            volumehigh=0,
            volumelow=0,
            time=current_time,
            digits=digits,
            spread=pair["spread"],
            spread_float=True,
            ticks_bookdepth=10,
            trade_calc_mode=0,
            trade_mode=4,
            start_time=0,
            expiration_time=0,
            trade_stops_level=0,
            trade_freeze_level=0,
            trade_exemode=2,
            swap_mode=1,
            swap_rollover3days=3,
            margin_hedged_use_leg=False,
            expiration_mode=7,
            filling_mode=1,
            order_mode=127,
            order_gtc_mode=0,
            option_mode=0,
            option_right=0,
            bid=pair["bid"],
            bidhigh=pair["bid"] + (pair["bid"] * 0.001),
            bidlow=pair["bid"] - (pair["bid"] * 0.001),
            ask=pair["ask"],
            askhigh=pair["ask"] + (pair["ask"] * 0.001),
            asklow=pair["ask"] - (pair["ask"] * 0.001),
            last=(pair["bid"] + pair["ask"]) / 2,
            lasthigh=(pair["bid"] + pair["ask"]) / 2 + (pair["bid"] * 0.001),
            lastlow=(pair["bid"] + pair["ask"]) / 2 - (pair["bid"] * 0.001),
            volume_real=0.0,
            volumehigh_real=0.0,
            volumelow_real=0.0,
            option_strike=0.0,
            point=point,
            trade_tick_value=1.0,
            trade_tick_value_profit=1.0,
            trade_tick_value_loss=1.0,
            trade_tick_size=point,
            trade_contract_size=contract_size,
            trade_accrued_interest=0.0,
            trade_face_value=0.0,
            trade_liquidity_rate=0.0,
            volume_min=0.01,
            volume_max=500.0,
            volume_step=0.01,
            volume_limit=0.0,
            swap_long=0.33,
            swap_short=-1.04,
            margin_initial=0.0,
            margin_maintenance=0.0,
            session_volume=0.0,
            session_turnover=0.0,
            session_interest=0.0,
            session_buy_orders_volume=0.0,
            session_sell_orders_volume=0.0,
            session_open=(pair["bid"] + pair["ask"]) / 2,
            session_close=(pair["bid"] + pair["ask"]) / 2,
            session_aw=0.0,
            session_price_settlement=0.0,
            session_price_limit_min=0.0,
            session_price_limit_max=0.0,
            margin_hedged=50000.0,
            price_change=0.0001,
            price_volatility=0.0,
            price_theoretical=0.0,
            price_greeks_delta=0.0,
            price_greeks_theta=0.0,
            price_greeks_gamma=0.0,
            price_greeks_vega=0.0,
            price_greeks_rho=0.0,
            price_greeks_omega=0.0,
            price_sensitivity=0.0,
            basis="",
            category="Forex",
            currency_base=pair["base"],
            currency_profit=pair["profit"],
            currency_margin=pair["base"],
            bank="",
            description=pair["description"],
            exchange="",
            formula="",
            isin="",
            name=pair["name"],
            page="",
            path=f"Forex\\{pair['name']}"
        ))
    
    return tuple(mock_symbols)


def last_error() -> int:
    """Mock last error"""
    global _last_error
    return _last_error


def version() -> Tuple[int, int, str]:
    """Mock version info"""
    return (5, 0, 3930)


# Set version for compatibility
__version__ = "5.0.45"