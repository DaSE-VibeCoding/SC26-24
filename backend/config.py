from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AlphaScope Stock Picker"
    data_mode: Literal["mock", "quantdash"] = "mock"
    quantdash_api_key: str = ""
    # 兼容项目早期使用的环境变量 QUANTDASH_TOKEN。
    quantdash_token: str = ""
    quantdash_base_url: str = "https://api.quantdash.net"
    quantdash_timeout_seconds: float = 60.0
    quantdash_batch_size: int = 100
    quantdash_max_workers: int = 3
    quantdash_requests_per_minute: int = 10
    sync_chunk_size: int = 10
    market_history_days: int = 365
    database_path: Path = Path("data/alphascope.db")
    csi300_constituents_file: Path = Path("config/csi300_constituents.csv")
    data_cache_dir: Path = Path("data/cache")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def quantdash_key(self) -> str:
        return self.quantdash_api_key or self.quantdash_token


@lru_cache
def get_settings() -> Settings:
    return Settings()

