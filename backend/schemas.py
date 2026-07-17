from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class DataStatus(BaseModel):
    mode: Literal["mock", "quantdash"]
    is_mock: bool
    as_of: datetime
    message: str


class MarketSummary(BaseModel):
    csi300_level: float
    change_pct: float
    up_count: int
    down_count: int
    flat_count: int


class StockSnapshot(BaseModel):
    symbol: str
    name: str
    industry: str
    price: float
    change_pct: float
    pe_ttm: float | None = None
    pb: float | None = None
    turnover_rate: float | None = None
    market_cap_billion: float | None = None


class MarketResponse(BaseModel):
    status: DataStatus
    summary: MarketSummary
    stocks: list[StockSnapshot]


class FactorOption(BaseModel):
    key: str
    label: str
    group: str
    default_selected: bool = False


class ModelOption(BaseModel):
    key: str
    label: str
    description: str


class OptionsResponse(BaseModel):
    factors: list[FactorOption]
    models: list[ModelOption]


class TrainRequest(BaseModel):
    model: Literal["ridge", "random_forest", "hist_gradient_boosting"] = "random_forest"
    factors: list[str]
    top_n: int = Field(default=10, ge=5, le=30)
    prediction_horizon_days: int = Field(default=5, ge=1, le=20)

    @model_validator(mode="after")
    def validate_factor_count(self) -> "TrainRequest":
        if not 4 <= len(set(self.factors)) <= 10:
            raise ValueError("请选择 4 到 10 个不重复因子")
        return self


class PredictionItem(BaseModel):
    rank: int
    symbol: str
    name: str
    industry: str
    score: float
    predicted_return_pct: float
    price: float
    change_pct: float
    reasons: list[str]


class PredictionResponse(BaseModel):
    status: DataStatus
    model: str
    factors: list[str]
    generated_at: datetime
    items: list[PredictionItem]
    disclaimer: str = "模型输出仅用于技术演示，不构成投资建议。"


class Bar(BaseModel):
    trade_date: date
    open: float
    high: float
    low: float
    close: float
    volume: float


class StockDetail(BaseModel):
    snapshot: StockSnapshot
    bars: list[Bar]
    factor_values: dict[str, float]

