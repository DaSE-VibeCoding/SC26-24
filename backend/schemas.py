from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


# ── 枚举 ──────────────────────────────────────────────

ModelStatus = Literal["valid", "weak", "invalid"]
RiskLevel = Literal["low", "medium", "high"]


# ── 状态 ──────────────────────────────────────────────

class DataStatus(BaseModel):
    mode: Literal["mock", "quantdash"]
    is_mock: bool
    as_of: datetime
    constituents_date: date | None = None
    latest_trade_date: date | None = None
    message: str


# ── 市场 ──────────────────────────────────────────────

class MarketSummary(BaseModel):
    csi300_level: float | None = None       # None when index unavailable
    change_pct: float | None = None
    up_count: int
    down_count: int
    flat_count: int
    median_change_pct: float | None = None
    standing_above_ma20_pct: float | None = None
    high_volatility_count: int = 0


class StockSnapshot(BaseModel):
    symbol: str
    name: str
    industry: str
    price: float
    change_pct: float
    ret_20: float | None = None            # 20日收益
    ma20_status: Literal["above", "below"] | None = None
    rsi_14: float | None = None
    vol_20: float | None = None            # 年化波动率
    volume_ratio: float | None = None      # 量比 MA5/MA20
    potential_score: float | None = None   # 0–100，未训练时为 None
    predicted_excess_20: float | None = None
    risk_level: RiskLevel | None = None
    pe_ttm: float | None = None
    pb: float | None = None
    turnover_rate: float | None = None
    market_cap_billion: float | None = None


class MarketResponse(BaseModel):
    status: DataStatus
    summary: MarketSummary
    stocks: list[StockSnapshot]


# ── 模型选项 ──────────────────────────────────────────

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


# ── 训练 ──────────────────────────────────────────────

class TrainRequest(BaseModel):
    model: Literal["ridge", "random_forest", "hist_gradient_boosting"] = "hist_gradient_boosting"
    factors: list[str]
    top_n: int = Field(default=10, ge=5, le=30)

    @model_validator(mode="after")
    def validate_factor_count(self) -> "TrainRequest":
        if not 4 <= len(set(self.factors)) <= 10:
            raise ValueError("请选择 4 到 10 个不重复因子")
        return self


# ── 模型指标 ──────────────────────────────────────────

class ModelMetrics(BaseModel):
    rank_ic: float
    ic_positive_ratio: float
    top10_excess_return: float
    top10_hit_rate: float
    mae: float


# ── 预测结果 ──────────────────────────────────────────

class PredictionItem(BaseModel):
    rank: int
    symbol: str
    name: str
    industry: str
    potential_score: float               # 0–100 截面百分位
    predicted_excess_20: float           # 预测相对收益
    risk_level: RiskLevel
    factor_percentiles: dict[str, float] # 因子当日截面百分位
    tags: list[str]                      # 因子画像标签
    price: float
    change_pct: float


class PredictionResponse(BaseModel):
    model_run_id: str
    status: ModelStatus
    model: str
    factors: list[str]
    trained_at: datetime
    prediction_date: date
    train_period: tuple[date, date]
    test_period: tuple[date, date]
    metrics: ModelMetrics
    items: list[PredictionItem]
    disclaimer: str = "模型输出仅用于技术演示，不构成投资建议。"


# ── 个股详情 ──────────────────────────────────────────

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
