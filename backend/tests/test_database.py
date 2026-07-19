from datetime import date

from backend.database import MarketDatabase


def _instrument(symbol: str = "600000.SH"):
    return {
        "symbol": symbol,
        "name": "测试股票",
        "industry": "测试行业",
        "exchange": "SH",
        "region": "CN",
        "instrument_type": "stock",
        "is_csi300": True,
        "constituent_snapshot_date": date(2026, 7, 1),
    }


def _bar(close: float = 10.5):
    return {
        "symbol": "600000.SH",
        "trade_date": date(2026, 7, 17),
        "timestamp_ms": 1784217600000,
        "open": 10.0,
        "high": 10.8,
        "low": 9.9,
        "close": close,
        "volume": 1_000_000,
        "amount": 10_500_000,
        "adjust_type": "forward",
        "source": "quantdash",
    }


def test_database_schema_and_idempotent_upsert(tmp_path):
    database = MarketDatabase(tmp_path / "market.db")
    database.initialize()
    assert database.upsert_instruments([_instrument()]) == 1
    assert database.upsert_daily_bars([_bar()]) == 1
    assert database.upsert_daily_bars([_bar(close=11.0)]) == 1

    stats = database.stats()
    assert stats["instrument_count"] == 1
    assert stats["bar_count"] == 1
    assert stats["latest_trade_date"] == "2026-07-17"
    assert database.get_stock_bars("600000.SH")[0]["close"] == 11.0


def test_sync_run_is_recorded(tmp_path):
    database = MarketDatabase(tmp_path / "market.db")
    database.initialize()
    run_id = database.start_sync_run(
        requested_symbols=300,
        start_date="2025-07-18",
        end_date="2026-07-18",
    )
    database.finish_sync_run(
        run_id,
        status="success",
        synced_symbols=300,
        rows_written=75_600,
    )

    last_sync = database.stats()["last_sync"]
    assert last_sync["status"] == "success"
    assert last_sync["synced_symbols"] == 300
    assert last_sync["rows_written"] == 75_600
