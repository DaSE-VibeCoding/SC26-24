from __future__ import annotations

from datetime import datetime
from statistics import median

from .config import Settings
from .database import MarketDatabase
from .market_analytics import build_snapshot, calculate_factors, percentile_ranks
from .mock_data import market_response, stock_detail
from .schemas import Bar, DataStatus, MarketResponse, MarketSummary, StockDetail
from .sync_service import MarketDataSyncService


class DataUnavailableError(RuntimeError):
    pass


class DataService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.database = MarketDatabase(settings.database_path)

    def get_market(self) -> MarketResponse:
        if self.settings.data_mode == "mock":
            return market_response()

        self.database.initialize()
        instruments = self.database.get_instruments()
        histories = self.database.get_recent_bars(limit_per_symbol=80)
        snapshots = []
        for symbol, instrument in instruments.items():
            snapshot = build_snapshot(instrument, histories.get(symbol, []))
            if snapshot is not None:
                snapshots.append(snapshot)
        if not snapshots:
            raise DataUnavailableError(
                "数据库中还没有 QuantDash 行情，请先执行 python scripts/refresh_data.py"
            )

        stats = self.database.stats()
        changes = [snapshot.change_pct for snapshot in snapshots]
        above_ma20 = sum(snapshot.ma20_status == "above" for snapshot in snapshots)
        summary = MarketSummary(
            csi300_level=None,
            change_pct=None,
            up_count=sum(value > 0 for value in changes),
            down_count=sum(value < 0 for value in changes),
            flat_count=sum(value == 0 for value in changes),
            median_change_pct=round(median(changes), 2) if changes else None,
            standing_above_ma20_pct=round(above_ma20 / len(snapshots) * 100, 1),
            high_volatility_count=sum(
                snapshot.vol_20 is not None and snapshot.vol_20 >= 0.4
                for snapshot in snapshots
            ),
        )
        return MarketResponse(
            status=DataStatus(
                mode="quantdash",
                is_mock=False,
                as_of=datetime.now(),
                constituents_date=stats.get("constituents_date"),
                latest_trade_date=stats.get("latest_trade_date"),
                message=(
                    f"QuantDash 本地数据库 · {stats.get('bar_count', 0)} 条日线 · "
                    f"{len(snapshots)} 只沪深300股票"
                ),
            ),
            summary=summary,
            stocks=snapshots,
        )

    def get_stock(self, symbol: str) -> StockDetail | None:
        if self.settings.data_mode == "mock":
            return stock_detail(symbol)

        self.database.initialize()
        normalized_symbol = symbol.upper()
        instruments = self.database.get_instruments()
        instrument = instruments.get(normalized_symbol)
        if instrument is None:
            return None

        bars = self.database.get_stock_bars(normalized_symbol, limit=400)
        snapshot = build_snapshot(instrument, bars)
        if snapshot is None:
            raise DataUnavailableError(f"{normalized_symbol} 暂无 QuantDash 日线数据")

        recent_histories = self.database.get_recent_bars(limit_per_symbol=80)
        factors_by_symbol = {
            item_symbol: calculate_factors(item_bars)
            for item_symbol, item_bars in recent_histories.items()
        }
        ranks = percentile_ranks(factors_by_symbol)
        return StockDetail(
            snapshot=snapshot,
            bars=[
                Bar(
                    trade_date=bar["trade_date"],
                    open=bar["open"],
                    high=bar["high"],
                    low=bar["low"],
                    close=bar["close"],
                    volume=bar["volume"],
                )
                for bar in bars
            ],
            factor_values=ranks.get(normalized_symbol, {}),
        )

    def refresh(self) -> dict:
        if self.settings.data_mode == "mock":
            return {"ok": True, "status": "skipped", "message": "Mock 数据无需刷新"}
        return MarketDataSyncService(self.settings, database=self.database).sync().model_dump()

    def status(self) -> dict:
        result = {
            "data_mode": self.settings.data_mode,
            "quantdash_configured": bool(self.settings.quantdash_key),
        }
        if self.settings.data_mode == "quantdash":
            self.database.initialize()
            result["database"] = self.database.stats()
        return result
