from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AlphaScope Stock Picker"
    data_mode: Literal["mock", "quantdash"] = "mock"
    quantdash_token: str = ""
    data_cache_dir: Path = Path("data/cache")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()

