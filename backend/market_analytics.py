from __future__ import annotations

import math
from statistics import fmean, stdev
from typing import Any

from .schemas import StockSnapshot


def _return_pct(closes: list[float], days: int) -> float | None:
    if len(closes) <= days or closes[-days - 1] == 0:
        return None
    return (closes[-1] / closes[-days - 1] - 1) * 100


def _moving_average(values: list[float], window: int, *, offset: int = 0) -> float | None:
    end = len(values) - offset if offset else len(values)
    start = end - window
    if start < 0 or end <= 0:
        return None
    return fmean(values[start:end])


def _rsi(closes: list[float], window: int = 14) -> float | None:
    if len(closes) <= window:
        return None
    changes = [closes[i] - closes[i - 1] for i in range(len(closes) - window, len(closes))]
    average_gain = fmean(max(change, 0) for change in changes)
    average_loss = fmean(max(-change, 0) for change in changes)
    if average_loss == 0:
        return 100.0 if average_gain > 0 else 50.0
    relative_strength = average_gain / average_loss
    return 100 - 100 / (1 + relative_strength)


def _annualized_volatility(closes: list[float], window: int = 20) -> float | None:
    if len(closes) <= 2:
        return None
    selected = closes[-(window + 1) :]
    log_returns = [
        math.log(selected[index] / selected[index - 1])
        for index in range(1, len(selected))
        if selected[index] > 0 and selected[index - 1] > 0
    ]
    if len(log_returns) < 2:
        return None
    return stdev(log_returns) * math.sqrt(252)


def _maximum_drawdown(closes: list[float], window: int = 60) -> float | None:
    selected = closes[-window:]
    if not selected:
        return None
    peak = selected[0]
    max_drawdown = 0.0
    for value in selected:
        peak = max(peak, value)
        if peak > 0:
            max_drawdown = max(max_drawdown, 1 - value / peak)
    return max_drawdown


def _pearson(left: list[float], right: list[float]) -> float | None:
    if len(left) != len(right) or len(left) < 2:
        return None
    left_mean = fmean(left)
    right_mean = fmean(right)
    numerator = sum((x - left_mean) * (y - right_mean) for x, y in zip(left, right))
    left_scale = math.sqrt(sum((x - left_mean) ** 2 for x in left))
    right_scale = math.sqrt(sum((y - right_mean) ** 2 for y in right))
    denominator = left_scale * right_scale
    return numerator / denominator if denominator else 0.0


def calculate_factors(bars: list[dict[str, Any]]) -> dict[str, float | None]:
    closes = [float(bar["close"]) for bar in bars]
    volumes = [float(bar["volume"]) for bar in bars]
    if not closes:
        return {}

    ma20 = _moving_average(closes, 20)
    ma60 = _moving_average(closes, 60)
    ma20_five_days_ago = _moving_average(closes, 20, offset=5)
    average_volume_5 = _moving_average(volumes, 5)
    average_volume_20 = _moving_average(volumes, 20)

    recent_closes = closes[-6:]
    recent_volumes = volumes[-6:]
    price_changes = [
        recent_closes[index] / recent_closes[index - 1] - 1
        for index in range(1, len(recent_closes))
        if recent_closes[index - 1] != 0
    ]
    volume_changes = [
        recent_volumes[index] / recent_volumes[index - 1] - 1
        for index in range(1, len(recent_volumes))
        if recent_volumes[index - 1] != 0
    ]
    high_60 = max(closes[-60:]) if closes else None

    return {
        "ret_5": _return_pct(closes, 5),
        "ret_20": _return_pct(closes, 20),
        "ret_60": _return_pct(closes, 60),
        "close_ma20_gap": (
            closes[-1] / ma20 - 1 if ma20 and ma20 != 0 else None
        ),
        "ma20_ma60_gap": ma20 / ma60 - 1 if ma20 and ma60 and ma60 != 0 else None,
        "ma20_slope_5": (
            ma20 / ma20_five_days_ago - 1
            if ma20 and ma20_five_days_ago and ma20_five_days_ago != 0
            else None
        ),
        "rsi_14": _rsi(closes),
        "vol_20": _annualized_volatility(closes),
        "maxdd_60": _maximum_drawdown(closes),
        "volume_ratio_5_20": (
            average_volume_5 / average_volume_20
            if average_volume_5 is not None and average_volume_20
            else None
        ),
        "price_volume_5": (
            _pearson(price_changes, volume_changes)
            if len(price_changes) == len(volume_changes)
            else None
        ),
        "distance_high_60": closes[-1] / high_60 if high_60 else None,
    }


def build_snapshot(
    instrument: dict[str, Any],
    bars: list[dict[str, Any]],
) -> StockSnapshot | None:
    if not bars:
        return None
    factors = calculate_factors(bars)
    closes = [float(bar["close"]) for bar in bars]
    latest = closes[-1]
    change_pct = _return_pct(closes, 1) or 0.0
    ma20 = _moving_average(closes, 20)
    volatility = factors.get("vol_20")
    risk_level = None
    if volatility is not None:
        risk_level = "low" if volatility < 0.25 else ("high" if volatility >= 0.4 else "medium")

    return StockSnapshot(
        symbol=instrument["symbol"],
        name=instrument["name"],
        industry=instrument.get("industry") or "未知",
        price=round(latest, 4),
        change_pct=round(change_pct, 2),
        ret_20=_rounded(factors.get("ret_20"), 2),
        ma20_status=("above" if latest >= ma20 else "below") if ma20 else None,
        rsi_14=_rounded(factors.get("rsi_14"), 1),
        vol_20=_rounded(volatility, 4),
        volume_ratio=_rounded(factors.get("volume_ratio_5_20"), 2),
        potential_score=None,
        predicted_excess_20=None,
        risk_level=risk_level,
        pe_ttm=None,
        pb=None,
        turnover_rate=None,
        market_cap_billion=None,
    )


def percentile_ranks(
    factors_by_symbol: dict[str, dict[str, float | None]],
) -> dict[str, dict[str, float]]:
    result = {symbol: {} for symbol in factors_by_symbol}
    factor_keys = {
        key for factors in factors_by_symbol.values() for key in factors.keys()
    }
    for key in factor_keys:
        values = sorted(
            (float(factors[key]), symbol)
            for symbol, factors in factors_by_symbol.items()
            if factors.get(key) is not None and math.isfinite(float(factors[key]))
        )
        denominator = max(len(values) - 1, 1)
        index = 0
        while index < len(values):
            next_index = index + 1
            while next_index < len(values) and values[next_index][0] == values[index][0]:
                next_index += 1
            average_position = (index + next_index - 1) / 2
            percentile = average_position / denominator if len(values) > 1 else 0.5
            for _, symbol in values[index:next_index]:
                result[symbol][key] = round(percentile, 4)
            index = next_index
    return result


def _rounded(value: float | None, digits: int) -> float | None:
    return round(float(value), digits) if value is not None and math.isfinite(value) else None
