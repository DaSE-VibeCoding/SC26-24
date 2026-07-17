from datetime import date, datetime, timedelta
from math import sin

from .features import FACTOR_LABELS
from .schemas import (
    Bar,
    DataStatus,
    MarketResponse,
    MarketSummary,
    PredictionItem,
    PredictionResponse,
    StockDetail,
    StockSnapshot,
)


STOCKS = [
    StockSnapshot(symbol="600519.SH", name="贵州茅台", industry="食品饮料", price=1488.20, change_pct=1.32, pe_ttm=23.5, pb=8.1, turnover_rate=0.28, market_cap_billion=1869),
    StockSnapshot(symbol="300750.SZ", name="宁德时代", industry="电力设备", price=261.30, change_pct=2.48, pe_ttm=21.7, pb=4.6, turnover_rate=1.18, market_cap_billion=1150),
    StockSnapshot(symbol="601318.SH", name="中国平安", industry="非银金融", price=58.76, change_pct=0.74, pe_ttm=7.9, pb=1.1, turnover_rate=0.42, market_cap_billion=1058),
    StockSnapshot(symbol="600036.SH", name="招商银行", industry="银行", price=46.12, change_pct=-0.26, pe_ttm=7.1, pb=1.0, turnover_rate=0.31, market_cap_billion=1163),
    StockSnapshot(symbol="000333.SZ", name="美的集团", industry="家用电器", price=78.66, change_pct=1.09, pe_ttm=14.2, pb=3.0, turnover_rate=0.53, market_cap_billion=550),
    StockSnapshot(symbol="600276.SH", name="恒瑞医药", industry="医药生物", price=54.30, change_pct=1.85, pe_ttm=43.1, pb=7.2, turnover_rate=0.88, market_cap_billion=346),
    StockSnapshot(symbol="000858.SZ", name="五粮液", industry="食品饮料", price=126.45, change_pct=-0.44, pe_ttm=17.4, pb=4.0, turnover_rate=0.39, market_cap_billion=491),
    StockSnapshot(symbol="002594.SZ", name="比亚迪", industry="汽车", price=322.10, change_pct=2.16, pe_ttm=25.9, pb=5.4, turnover_rate=1.04, market_cap_billion=938),
    StockSnapshot(symbol="601899.SH", name="紫金矿业", industry="有色金属", price=19.84, change_pct=1.43, pe_ttm=14.8, pb=3.1, turnover_rate=0.72, market_cap_billion=522),
    StockSnapshot(symbol="600900.SH", name="长江电力", industry="公用事业", price=29.57, change_pct=-0.10, pe_ttm=18.9, pb=3.2, turnover_rate=0.12, market_cap_billion=723),
]


def status() -> DataStatus:
    return DataStatus(mode="mock", is_mock=True, as_of=datetime.now(), message="演示 Mock 数据，尚未接入 QuantDash")


def market_response() -> MarketResponse:
    return MarketResponse(
        status=status(),
        summary=MarketSummary(csi300_level=4028.65, change_pct=0.86, up_count=192, down_count=101, flat_count=7),
        stocks=STOCKS,
    )


def prediction_response(model: str, factors: list[str], top_n: int) -> PredictionResponse:
    ordered = sorted(STOCKS, key=lambda stock: stock.change_pct, reverse=True)[:top_n]
    items = []
    for index, stock in enumerate(ordered, start=1):
        score = round(92.5 - index * 3.1 + max(stock.change_pct, 0), 2)
        labels = [FACTOR_LABELS.get(key, key) for key in factors[:2]]
        items.append(PredictionItem(
            rank=index, symbol=stock.symbol, name=stock.name, industry=stock.industry,
            score=score, predicted_return_pct=round(4.8 - index * 0.28, 2),
            price=stock.price, change_pct=stock.change_pct,
            reasons=[f"{label}排名靠前" for label in labels],
        ))
    return PredictionResponse(status=status(), model=model, factors=factors, generated_at=datetime.now(), items=items)


def stock_detail(symbol: str) -> StockDetail | None:
    stock = next((item for item in STOCKS if item.symbol == symbol), None)
    if stock is None:
        return None
    bars: list[Bar] = []
    today = date.today()
    for offset in range(120, 0, -1):
        base = stock.price * (0.88 + (120 - offset) * 0.001 + sin(offset / 7) * 0.025)
        bars.append(Bar(trade_date=today - timedelta(days=offset), open=round(base * 0.995, 2), high=round(base * 1.018, 2), low=round(base * 0.982, 2), close=round(base, 2), volume=round(8000000 + sin(offset) * 1800000, 0)))
    return StockDetail(snapshot=stock, bars=bars, factor_values={"20日动量": 0.82, "20日波动率": 0.31, "ROE": 0.74, "估值": 0.66})

