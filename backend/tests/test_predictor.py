from __future__ import annotations

from datetime import date, timedelta
import math

from backend.config import Settings
from backend.database import MarketDatabase
from backend.features import DEFAULT_FACTORS
from backend.predictor import Predictor
from backend.schemas import TrainRequest


def test_predictor_trains_from_local_market_database(tmp_path):
    settings = Settings(
        _env_file=None,
        data_mode="quantdash",
        database_path=tmp_path / "market.db",
    )
    database = MarketDatabase(settings.database_path)
    database.initialize()

    start = date(2026, 1, 1)
    instruments = []
    bars = []
    for stock_index in range(30):
        symbol = f"{stock_index + 1:06d}.SZ"
        instruments.append(
            {
                "symbol": symbol,
                "name": f"股票{stock_index:02d}",
                "industry": "测试行业",
                "constituent_snapshot_date": start,
            }
        )
        price = 10 + stock_index * 0.1
        for day_index in range(140):
            trade_date = start + timedelta(days=day_index)
            daily_return = (
                0.0005
                + stock_index * 0.000015
                + math.sin(day_index / 9 + stock_index) * 0.003
            )
            open_price = price
            price *= 1 + daily_return
            bars.append(
                {
                    "symbol": symbol,
                    "trade_date": trade_date,
                    "timestamp_ms": day_index + 1,
                    "open": open_price,
                    "high": max(open_price, price) * 1.01,
                    "low": min(open_price, price) * 0.99,
                    "close": price,
                    "volume": 1_000_000 + stock_index * 10_000 + day_index * 100,
                    "amount": price * 1_000_000,
                }
            )

    database.upsert_instruments(instruments)
    database.upsert_daily_bars(bars)

    result = Predictor(settings, database).run(
        TrainRequest(model="ridge", factors=DEFAULT_FACTORS, top_n=5)
    )

    assert result.model == "ridge"
    assert result.prediction_date == start + timedelta(days=139)
    assert len(result.items) == 5
    assert result.items[0].potential_score >= result.items[-1].potential_score
    assert all(item.name.startswith("股票") for item in result.items)
