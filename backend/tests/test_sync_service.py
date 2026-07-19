from __future__ import annotations

import csv
from datetime import date, datetime
from zoneinfo import ZoneInfo

from backend.config import Settings
from backend.data_service import DataService
from backend.database import MarketDatabase
from backend.sync_service import MarketDataSyncService


def _write_constituents(path):
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["symbol", "name", "industry", "snapshot_date"],
        )
        writer.writeheader()
        for index in range(300):
            exchange = "SH" if index >= 150 else "SZ"
            code = f"{600000 + index:06d}" if exchange == "SH" else f"{index + 1:06d}"
            writer.writerow(
                {
                    "symbol": f"{code}.{exchange}",
                    "name": f"股票{index:03d}",
                    "industry": "测试行业",
                    "snapshot_date": "2026-07-01",
                }
            )


class FakeQuantDashClient:
    def fetch_instruments(self, symbols):
        return [
            {
                "symbol": symbol,
                "name": f"远程{index:03d}",
                "exchange": symbol[-2:],
                "region": "CN",
                "type": "stock",
            }
            for index, symbol in enumerate(symbols)
        ]

    def fetch_daily_bars(self, symbols, *, start_date, end_date):
        timestamps = [
            int(
                datetime(2026, 7, day, 15, tzinfo=ZoneInfo("Asia/Shanghai")).timestamp()
                * 1000
            )
            for day in (16, 17)
        ]
        klines = {
            symbol: {
                "timestamp": timestamps,
                "open": [10.0, 10.4],
                "high": [10.6, 10.9],
                "low": [9.8, 10.2],
                "close": [10.5, 10.8],
                "volume": [1_000_000, 1_200_000],
                "amount": [10_500_000, 12_960_000],
            }
            for symbol in symbols
        }
        return klines


def test_sync_writes_300_stocks_and_data_service_reads_them(tmp_path):
    constituents_file = tmp_path / "csi300.csv"
    _write_constituents(constituents_file)
    settings = Settings(
        data_mode="quantdash",
        quantdash_api_key="test-key",
        database_path=tmp_path / "market.db",
        csi300_constituents_file=constituents_file,
        market_history_days=365,
        quantdash_requests_per_minute=1_000_000,
    )
    database = MarketDatabase(settings.database_path)
    result = MarketDataSyncService(
        settings,
        database=database,
        client=FakeQuantDashClient(),
    ).sync(end_date=date(2026, 7, 18))

    assert result.ok is True
    assert result.symbols_synced == 300
    assert result.rows_written == 600
    assert database.stats()["instrument_count"] == 300

    market = DataService(settings).get_market()
    assert market.status.is_mock is False
    assert len(market.stocks) == 300
    assert market.stocks[0].price == 10.8

    detail = DataService(settings).get_stock(market.stocks[0].symbol)
    assert detail is not None
    assert len(detail.bars) == 2
