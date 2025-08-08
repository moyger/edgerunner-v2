"""
Configuration management for Edgerunner Backend
"""
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, ConfigDict
from functools import lru_cache
from pathlib import Path

# Proactively load environment variables from likely locations so that
# settings work whether the backend is started from the repo root or the
# backend directory. This complements pydantic_settings' env_file handling.
try:
    from dotenv import load_dotenv  # type: ignore
    # Load backend/.env first (preferred)
    backend_env = Path(__file__).resolve().parents[1] / ".env"
    if backend_env.exists():
        load_dotenv(backend_env, override=False)
    # Also load root .env if present (won't override existing keys)
    repo_root_env = Path(__file__).resolve().parents[2] / ".env"
    if repo_root_env.exists():
        load_dotenv(repo_root_env, override=False)
except Exception:
    # dotenv is optional; ignore if unavailable
    pass


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    app_name: str = Field(default="Edgerunner Backend", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    debug: bool = Field(default=False, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Server
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    allowed_hosts: List[str] = Field(default=["localhost", "127.0.0.1"], env="ALLOWED_HOSTS")
    
    # Security
    secret_key: str = Field(default="your-secret-key-change-this", env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # CORS
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"], 
        env="CORS_ORIGINS"
    )
    cors_origins_string: str = Field(
        default="http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173", 
        env="CORS_ORIGINS_STRING"
    )
    cors_allow_credentials: bool = Field(default=True, env="CORS_ALLOW_CREDENTIALS")
    cors_allow_methods: List[str] = Field(default=["*"], env="CORS_ALLOW_METHODS")
    cors_allow_headers: List[str] = Field(default=["*"], env="CORS_ALLOW_HEADERS")
    
    # Database (Optional)
    database_url: Optional[str] = Field(default=None, env="DATABASE_URL")
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    
    # Interactive Brokers
    ibkr_host: str = Field(default="127.0.0.1", env="IBKR_HOST")
    ibkr_port: int = Field(default=7497, env="IBKR_PORT")
    ibkr_client_id: int = Field(default=1, env="IBKR_CLIENT_ID")
    ibkr_paper_trading: bool = Field(default=True, env="IBKR_PAPER_TRADING")
    
    # IBKR Flex Query Configuration
    ibkr_flex_token: Optional[str] = Field(default=None, env="IBKR_FLEX_TOKEN")
    ibkr_flex_query_trades: Optional[str] = Field(default=None, env="IBKR_FLEX_QUERY_TRADES")
    ibkr_flex_query_positions: Optional[str] = Field(default=None, env="IBKR_FLEX_QUERY_POSITIONS")
    ibkr_flex_query_cash_transactions: Optional[str] = Field(default=None, env="IBKR_FLEX_QUERY_CASH_TRANSACTIONS")
    
    # MetaTrader 5
    mt5_login: Optional[str] = Field(default=None, env="MT5_LOGIN")
    mt5_password: Optional[str] = Field(default=None, env="MT5_PASSWORD")
    mt5_server: Optional[str] = Field(default=None, env="MT5_SERVER")
    mt5_path: str = Field(
        default="C:\\Program Files\\MetaTrader 5\\terminal64.exe", 
        env="MT5_PATH"
    )
    
    # ByBit
    bybit_api_key: Optional[str] = Field(default=None, env="BYBIT_API_KEY")
    bybit_secret_key: Optional[str] = Field(default=None, env="BYBIT_SECRET_KEY")
    bybit_base_url: str = Field(default="https://api-testnet.bybit.com", env="BYBIT_BASE_URL")
    bybit_recv_window: int = Field(default=5000, env="BYBIT_RECV_WINDOW")
    
    # Trading Configuration
    default_currency: str = Field(default="USD", env="DEFAULT_CURRENCY")
    default_timezone: str = Field(default="America/New_York", env="DEFAULT_TIMEZONE")
    max_concurrent_orders: int = Field(default=50, env="MAX_CONCURRENT_ORDERS")
    max_position_size: float = Field(default=0.1, env="MAX_POSITION_SIZE")
    paper_trading_only: bool = Field(default=True, env="PAPER_TRADING_ONLY")
    
    # Risk Management
    max_daily_loss: float = Field(default=1000.0, env="MAX_DAILY_LOSS")
    max_drawdown: float = Field(default=0.05, env="MAX_DRAWDOWN")
    position_size_limit: float = Field(default=0.02, env="POSITION_SIZE_LIMIT")
    
    # Logging
    log_file: str = Field(default="logs/app.log", env="LOG_FILE")
    error_log_file: str = Field(default="logs/app.error.log", env="ERROR_LOG_FILE")
    
    # External APIs
    alpha_vantage_api_key: Optional[str] = Field(default=None, env="ALPHA_VANTAGE_API_KEY")
    polygon_api_key: Optional[str] = Field(default=None, env="POLYGON_API_KEY")
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Ignore unrelated environment variables (e.g., VITE_*)
    )
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins as list"""
        if self.cors_origins_string:
            return [origin.strip() for origin in self.cors_origins_string.split(",")]
        return self.cors_origins

    def get_allowed_hosts(self) -> List[str]:
        """Get allowed hosts for TrustedHostMiddleware"""
        return self.allowed_hosts


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()