from datetime import date, datetime, timedelta
from math import sin

from .features import FACTOR_LABELS
from .schemas import (
    Bar,
    DataStatus,
    MarketResponse,
    MarketSummary,
    ModelMetrics,
    PredictionItem,
    PredictionResponse,
    StockDetail,
    StockSnapshot,
)


# ── 50 只 Mock 股票（覆盖多行业、涨跌、风险等级）────

_RAW = [
    ("600519.SH", "贵州茅台", "食品饮料", 1488.20, 1.32, 23.5, 8.1, 0.28, 1869),
    ("300750.SZ", "宁德时代", "电力设备", 261.30, 2.48, 21.7, 4.6, 1.18, 1150),
    ("601318.SH", "中国平安", "非银金融", 58.76, 0.74, 7.9, 1.1, 0.42, 1058),
    ("600036.SH", "招商银行", "银行", 46.12, -0.26, 7.1, 1.0, 0.31, 1163),
    ("000333.SZ", "美的集团", "家用电器", 78.66, 1.09, 14.2, 3.0, 0.53, 550),
    ("600276.SH", "恒瑞医药", "医药生物", 54.30, 1.85, 43.1, 7.2, 0.88, 346),
    ("000858.SZ", "五粮液", "食品饮料", 126.45, -0.44, 17.4, 4.0, 0.39, 491),
    ("002594.SZ", "比亚迪", "汽车", 322.10, 2.16, 25.9, 5.4, 1.04, 938),
    ("601899.SH", "紫金矿业", "有色金属", 19.84, 1.43, 14.8, 3.1, 0.72, 522),
    ("600900.SH", "长江电力", "公用事业", 29.57, -0.10, 18.9, 3.2, 0.12, 723),
    ("601166.SH", "兴业银行", "银行", 19.23, -0.52, 5.2, 0.6, 0.28, 399),
    ("600030.SH", "中信证券", "非银金融", 27.85, 0.91, 16.3, 1.5, 0.67, 413),
    ("000001.SZ", "平安银行", "银行", 13.45, -0.37, 5.8, 0.7, 0.35, 261),
    ("601012.SH", "隆基绿能", "电力设备", 18.92, -1.25, 12.1, 1.8, 1.42, 143),
    ("600809.SH", "山西汾酒", "食品饮料", 215.60, 0.88, 28.5, 9.4, 0.51, 263),
    ("300059.SZ", "东方财富", "非银金融", 22.15, 1.67, 32.8, 5.1, 1.85, 350),
    ("601088.SH", "中国神华", "煤炭", 38.42, -0.18, 10.2, 1.6, 0.14, 763),
    ("600585.SH", "海螺水泥", "建筑材料", 26.30, -0.61, 9.4, 0.8, 0.32, 139),
    ("000725.SZ", "京东方A", "电子", 5.28, 0.95, 22.6, 1.0, 1.28, 201),
    ("600050.SH", "中国联通", "通信", 6.43, 0.31, 18.1, 1.1, 0.41, 204),
    ("601857.SH", "中国石油", "石油石化", 8.75, -0.45, 9.8, 0.9, 0.11, 1601),
    ("600028.SH", "中国石化", "石油石化", 6.12, -0.33, 10.5, 0.8, 0.09, 732),
    ("002415.SZ", "海康威视", "计算机", 33.85, 1.21, 21.4, 3.6, 0.58, 312),
    ("300124.SZ", "汇川技术", "机械设备", 68.20, 2.12, 38.7, 7.3, 0.82, 181),
    ("600887.SH", "伊利股份", "食品饮料", 27.50, 0.26, 16.8, 3.1, 0.44, 175),
    ("000651.SZ", "格力电器", "家用电器", 42.30, 0.52, 8.5, 1.9, 0.38, 238),
    ("601398.SH", "工商银行", "银行", 5.88, 0.17, 5.4, 0.6, 0.05, 2096),
    ("600031.SH", "三一重工", "机械设备", 18.55, 0.82, 20.3, 1.9, 0.65, 157),
    ("002714.SZ", "牧原股份", "农林牧渔", 42.10, -1.88, 11.2, 2.4, 0.91, 230),
    ("300498.SZ", "温氏股份", "农林牧渔", 18.75, -0.85, 14.6, 2.0, 0.55, 124),
    ("601225.SH", "陕西煤业", "煤炭", 22.38, -0.27, 8.1, 1.5, 0.18, 217),
    ("600436.SH", "片仔癀", "医药生物", 255.30, 1.56, 52.4, 12.8, 0.33, 154),
    ("002475.SZ", "立讯精密", "电子", 35.60, 2.81, 18.9, 3.5, 1.15, 255),
    ("300274.SZ", "阳光电源", "电力设备", 112.40, 3.12, 28.6, 6.2, 1.68, 233),
    ("600690.SH", "海尔智家", "家用电器", 27.80, 0.68, 13.2, 2.5, 0.47, 262),
    ("601668.SH", "中国建筑", "建筑装饰", 6.05, 0.33, 5.8, 0.6, 0.22, 253),
    ("600048.SH", "保利发展", "房地产", 10.85, -0.73, 8.2, 0.7, 0.58, 130),
    ("002230.SZ", "科大讯飞", "计算机", 58.90, 1.43, 95.2, 5.8, 1.12, 136),
    ("601628.SH", "中国人寿", "非银金融", 35.20, 0.56, 18.4, 1.9, 0.13, 995),
    ("600104.SH", "上汽集团", "汽车", 15.80, -0.94, 9.2, 0.7, 0.29, 184),
    ("000002.SZ", "万科A", "房地产", 11.92, -1.16, 6.8, 0.5, 0.72, 142),
    ("601919.SH", "中远海控", "交通运输", 14.25, 1.05, 5.6, 0.9, 0.52, 228),
    ("300015.SZ", "爱尔眼科", "医药生物", 16.38, 0.42, 55.3, 8.1, 0.68, 153),
    ("600019.SH", "宝钢股份", "钢铁", 7.15, -0.28, 12.1, 0.8, 0.16, 159),
    ("002460.SZ", "赣锋锂业", "有色金属", 45.80, -2.35, 18.2, 2.6, 1.45, 92),
    ("601688.SH", "华泰证券", "非银金融", 18.32, 0.87, 13.5, 1.2, 0.55, 166),
    ("000568.SZ", "泸州老窖", "食品饮料", 175.20, 0.65, 20.1, 5.8, 0.41, 258),
    ("601728.SH", "中国电信", "通信", 6.85, 0.15, 14.2, 1.1, 0.22, 627),
    ("688981.SH", "中芯国际", "电子", 48.90, 1.88, 42.6, 2.8, 1.05, 389),
    ("300760.SZ", "迈瑞医疗", "医药生物", 295.50, 0.92, 31.5, 9.2, 0.38, 358),
]

STOCKS = [
    StockSnapshot(
        symbol=sym, name=nm, industry=ind,
        price=price, change_pct=chg,
        ret_20=round(chg * 1.8 + sin(i / 3) * 3, 2),
        ma20_status="above" if chg > 0 else "below",
        rsi_14=round(40 + (i % 7) * 8 + sin(i) * 5, 1),
        vol_20=round(0.18 + abs(chg) * 0.08 + (i % 5) * 0.03, 2),
        volume_ratio=round(0.6 + (i % 8) * 0.15, 2),
        potential_score=round(max(5.0, 95.0 - i * 1.7 + chg * 3), 1) if i < 30 else None,
        predicted_excess_20=round(4.5 - i * 0.08 + chg * 0.6, 2) if i < 30 else None,
        risk_level="low" if i % 3 == 0 else ("high" if i % 4 == 0 else "medium"),
        pe_ttm=pe, pb=pb, turnover_rate=to, market_cap_billion=mcap,
    )
    for i, (sym, nm, ind, price, chg, pe, pb, to, mcap) in enumerate(_RAW)
]


def status() -> DataStatus:
    return DataStatus(
        mode="mock", is_mock=True,
        as_of=datetime.now(),
        constituents_date=date(2026, 7, 1),
        latest_trade_date=date(2026, 7, 17),
        message="Mock 演示数据 · 尚未接入 QuantDash",
    )


def market_response() -> MarketResponse:
    up = sum(1 for s in STOCKS if s.change_pct > 0)
    down = sum(1 for s in STOCKS if s.change_pct < 0)
    flat = sum(1 for s in STOCKS if s.change_pct == 0)
    changes = sorted([s.change_pct for s in STOCKS])
    mid = changes[len(changes) // 2]
    ma20_up = sum(1 for s in STOCKS if s.ma20_status == "above")
    return MarketResponse(
        status=status(),
        summary=MarketSummary(
            csi300_level=4028.65, change_pct=0.86,
            up_count=up, down_count=down, flat_count=flat,
            median_change_pct=round(mid, 2),
            standing_above_ma20_pct=round(ma20_up / len(STOCKS) * 100, 1),
            high_volatility_count=sum(1 for s in STOCKS if s.vol_20 and s.vol_20 > 0.35),
        ),
        stocks=STOCKS,
    )


def prediction_response(model: str, factors: list[str], top_n: int) -> PredictionResponse:
    scored = sorted(
        [s for s in STOCKS if s.potential_score is not None],
        key=lambda x: x.potential_score or 0, reverse=True,
    )[:top_n]
    items: list[PredictionItem] = []
    for idx, stock in enumerate(scored):
        pct: dict[str, float] = {}
        for f in factors:
            pct[f] = round(0.3 + sin(idx + hash(f) % 17) * 0.35, 2)
        labels = [FACTOR_LABELS.get(f, f) for f in factors[:3]]
        items.append(PredictionItem(
            rank=idx + 1,
            symbol=stock.symbol, name=stock.name, industry=stock.industry,
            potential_score=round(stock.potential_score or 0, 1),
            predicted_excess_20=round(stock.predicted_excess_20 or 0, 2),
            risk_level=stock.risk_level or "medium",
            factor_percentiles=pct,
            tags=[f"{lbl}排名靠前" for lbl in labels[:2]],
            price=stock.price, change_pct=stock.change_pct,
        ))
    return PredictionResponse(
        model_run_id=f"mdl_{model}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        status="valid",
        model=model, factors=factors,
        trained_at=datetime.now(),
        prediction_date=date.today(),
        train_period=(date(2023, 1, 1), date(2026, 4, 30)),
        test_period=(date(2026, 5, 1), date(2026, 7, 15)),
        metrics=ModelMetrics(
            rank_ic=0.062, ic_positive_ratio=0.58,
            top10_excess_return=0.031, top10_hit_rate=0.61, mae=0.042,
        ),
        items=items,
    )


def stock_detail(symbol: str) -> StockDetail | None:
    stock = next((s for s in STOCKS if s.symbol == symbol), None)
    if stock is None:
        return None
    bars: list[Bar] = []
    today = date.today()
    for offset in range(180, 0, -1):
        base = stock.price * (0.85 + (180 - offset) * 0.0008 + sin(offset / 7) * 0.03)
        bars.append(Bar(
            trade_date=today - timedelta(days=offset),
            open=round(base * 0.995, 2), high=round(base * 1.018, 2),
            low=round(base * 0.982, 2), close=round(base, 2),
            volume=round(8_000_000 + sin(offset) * 1_800_000, 0),
        ))
    return StockDetail(
        snapshot=stock,
        bars=bars,
        factor_values={k: round(0.3 + sin(hash(k) % 23) * 0.35, 2) for k in FACTOR_LABELS},
    )
