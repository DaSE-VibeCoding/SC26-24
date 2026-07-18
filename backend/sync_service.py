from __future__ import annotations

import math
import time
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from typing import Any, Callable
from zoneinfo import ZoneInfo

from .config import Settings
from .constituents import Constituent, load_constituents
from .database import MarketDatabase
from .quantdash_client import QuantDashClient


@dataclass(frozen=True)
class SyncResult:
    ok: bool
    status: str
    message: str
    run_id: int
    symbols_requested: int
    symbols_synced: int
    symbols_reused: int
    rows_written: int
    start_date: str
    end_date: str
    missing_symbols: list[str]

    def model_dump(self) -> dict[str, Any]:
        return asdict(self)


class MarketDataSyncService:
    def __init__(
        self,
        settings: Settings,
        *,
        database: MarketDatabase | None = None,
        client: QuantDashClient | None = None,
    ):
        self.settings = settings
        self.database = database or MarketDatabase(settings.database_path)
        self.client = client or QuantDashClient(settings)

    def sync(
        self,
        *,
        end_date: date | None = None,
        force: bool = False,
        progress: Callable[[str], None] | None = None,
    ) -> SyncResult:
        self.database.initialize()
        self.database.fail_stale_sync_runs()
        constituents = load_constituents(self.settings.csi300_constituents_file)
        end = end_date or date.today()
        start = end - timedelta(days=self.settings.market_history_days)
        run_id = self.database.start_sync_run(
            requested_symbols=len(constituents),
            start_date=start.isoformat(),
            end_date=end.isoformat(),
        )

        try:
            symbols = [item.symbol for item in constituents]
            metadata = self.client.fetch_instruments(symbols)
            self.database.upsert_instruments(
                self._merge_instrument_metadata(constituents, metadata)
            )

            expected_latest = self._previous_weekday(end)
            covered_symbols = set()
            if not force:
                covered_symbols = self.database.get_covered_symbols(
                    earliest_date=(start + timedelta(days=14)).isoformat(),
                    latest_date=expected_latest.isoformat(),
                    minimum_rows=180,
                )
            pending_symbols = [symbol for symbol in symbols if symbol not in covered_symbols]
            synced_symbols = set(covered_symbols)
            rows_written = 0
            chunks = list(self._chunks(pending_symbols, self.settings.sync_chunk_size))
            if progress:
                progress(
                    f"准备同步 {len(pending_symbols)} 只股票，复用 {len(covered_symbols)} 只完整股票"
                )

            for chunk_index, chunk in enumerate(chunks, start=1):
                try:
                    raw_klines = self.client.fetch_daily_bars(
                        chunk,
                        start_date=start,
                        end_date=end,
                    )
                except Exception as exc:
                    if progress:
                        progress(f"[{chunk_index}/{len(chunks)}] 本批失败，将在下次同步重试: {exc}")
                    continue
                chunk_bars: list[dict[str, Any]] = []
                chunk_synced: set[str] = set()
                for symbol, payload in raw_klines.items():
                    normalized = self._normalize_bars(symbol, payload)
                    if normalized:
                        chunk_synced.add(symbol)
                        chunk_bars.extend(normalized)
                if chunk_bars:
                    rows_written += self.database.upsert_daily_bars(chunk_bars)
                    synced_symbols.update(chunk_synced)
                if progress:
                    progress(
                        f"[{chunk_index}/{len(chunks)}] 已完成 {len(synced_symbols)}/{len(symbols)} 只，"
                        f"本批写入 {len(chunk_bars)} 条"
                    )
                if chunk_index < len(chunks):
                    wait_seconds = 60 / max(
                        1, self.settings.quantdash_requests_per_minute
                    ) * len(chunk)
                    if progress:
                        progress(
                            f"QuantDash 配额为 {self.settings.quantdash_requests_per_minute} 次/分钟，"
                            f"等待 {wait_seconds:.0f} 秒后继续"
                        )
                    time.sleep(wait_seconds)

            if not synced_symbols:
                raise RuntimeError("QuantDash 未返回任何可写入的日 K 线数据")

            missing_symbols = sorted(set(symbols) - synced_symbols)
            status = "partial" if missing_symbols else "success"
            self.database.finish_sync_run(
                run_id,
                status=status,
                synced_symbols=len(synced_symbols),
                rows_written=rows_written,
                error_message=(
                    f"{len(missing_symbols)} 只股票未返回日线"
                    if missing_symbols
                    else None
                ),
            )
            message = (
                f"已写入 {len(synced_symbols)} 只股票、{rows_written} 条一年期日线"
                if not missing_symbols
                else (
                    f"部分完成：写入 {len(synced_symbols)} 只股票、{rows_written} 条日线，"
                    f"{len(missing_symbols)} 只未返回数据"
                )
            )
            return SyncResult(
                ok=not missing_symbols,
                status=status,
                message=message,
                run_id=run_id,
                symbols_requested=len(symbols),
                symbols_synced=len(synced_symbols),
                symbols_reused=len(covered_symbols),
                rows_written=rows_written,
                start_date=start.isoformat(),
                end_date=end.isoformat(),
                missing_symbols=missing_symbols,
            )
        except Exception as exc:
            self.database.finish_sync_run(
                run_id,
                status="failed",
                error_message=str(exc)[:1000],
            )
            raise

    @staticmethod
    def _merge_instrument_metadata(
        constituents: list[Constituent],
        metadata: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        metadata_by_symbol = {
            str(item.get("symbol", "")).upper(): item for item in metadata
        }
        merged: list[dict[str, Any]] = []
        for constituent in constituents:
            remote = metadata_by_symbol.get(constituent.symbol, {})
            merged.append(
                {
                    "symbol": constituent.symbol,
                    "name": remote.get("name") or constituent.name,
                    "industry": constituent.industry,
                    "exchange": remote.get("exchange"),
                    "region": remote.get("region") or "CN",
                    "instrument_type": remote.get("type") or "stock",
                    "is_csi300": True,
                    "constituent_snapshot_date": constituent.snapshot_date,
                }
            )
        return merged

    @staticmethod
    def _normalize_bars(
        symbol: str,
        payload: dict[str, list[Any]],
    ) -> list[dict[str, Any]]:
        required = ("timestamp", "open", "high", "low", "close", "volume")
        if not all(isinstance(payload.get(key), list) for key in required):
            return []
        length = min(len(payload[key]) for key in required)
        amounts = payload.get("amount") or [0.0] * length
        if len(amounts) < length:
            amounts = [*amounts, *([0.0] * (length - len(amounts)))]

        rows: list[dict[str, Any]] = []
        for index in range(length):
            try:
                timestamp_ms = int(payload["timestamp"][index])
                values = {
                    key: float(payload[key][index])
                    for key in ("open", "high", "low", "close", "volume")
                }
                amount = float(amounts[index] or 0)
            except (TypeError, ValueError, OverflowError):
                continue
            if not all(math.isfinite(value) for value in (*values.values(), amount)):
                continue
            if values["close"] <= 0 or values["high"] < values["low"]:
                continue
            trade_date = datetime.fromtimestamp(
                timestamp_ms / 1000,
                tz=ZoneInfo("Asia/Shanghai"),
            ).date()
            rows.append(
                {
                    "symbol": symbol,
                    "trade_date": trade_date,
                    "timestamp_ms": timestamp_ms,
                    **values,
                    "amount": amount,
                    "adjust_type": "forward",
                    "source": "quantdash",
                }
            )
        return rows

    @staticmethod
    def _chunks(symbols: list[str], size: int):
        chunk_size = max(1, size)
        for index in range(0, len(symbols), chunk_size):
            yield symbols[index : index + chunk_size]

    @staticmethod
    def _previous_weekday(value: date) -> date:
        result = value
        while result.weekday() >= 5:
            result -= timedelta(days=1)
        return result
