from __future__ import annotations

import sqlite3
from collections.abc import Iterable, Sequence
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS instruments (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT NOT NULL DEFAULT '未知',
    exchange TEXT,
    region TEXT,
    instrument_type TEXT,
    is_csi300 INTEGER NOT NULL DEFAULT 1 CHECK (is_csi300 IN (0, 1)),
    constituent_snapshot_date TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_bars (
    symbol TEXT NOT NULL,
    trade_date TEXT NOT NULL,
    timestamp_ms INTEGER NOT NULL,
    open REAL NOT NULL,
    high REAL NOT NULL,
    low REAL NOT NULL,
    close REAL NOT NULL,
    volume REAL NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    adjust_type TEXT NOT NULL DEFAULT 'forward',
    source TEXT NOT NULL DEFAULT 'quantdash',
    updated_at TEXT NOT NULL,
    PRIMARY KEY (symbol, trade_date, adjust_type),
    FOREIGN KEY (symbol) REFERENCES instruments(symbol) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_daily_bars_trade_date
ON daily_bars(trade_date);

CREATE INDEX IF NOT EXISTS idx_daily_bars_symbol_date
ON daily_bars(symbol, trade_date DESC);

CREATE TABLE IF NOT EXISTS sync_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'partial', 'failed')),
    requested_symbols INTEGER NOT NULL DEFAULT 0,
    synced_symbols INTEGER NOT NULL DEFAULT 0,
    rows_written INTEGER NOT NULL DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    error_message TEXT
);
"""


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class MarketDatabase:
    """Small SQLite repository for the local CSI 300 market-data cache."""

    def __init__(self, path: Path | str):
        self.path = Path(path)

    def connect(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path, timeout=30)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA busy_timeout = 30000")
        return connection

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.execute("PRAGMA journal_mode = WAL")
            connection.executescript(SCHEMA_SQL)

    def upsert_instruments(self, instruments: Iterable[dict[str, Any]]) -> int:
        rows = list(instruments)
        if not rows:
            return 0
        now = utc_now_iso()
        values = [
            (
                row["symbol"],
                row["name"],
                row.get("industry") or "未知",
                row.get("exchange"),
                row.get("region"),
                row.get("instrument_type") or row.get("type"),
                int(row.get("is_csi300", True)),
                str(row["constituent_snapshot_date"]),
                now,
            )
            for row in rows
        ]
        with self.connect() as connection:
            connection.executemany(
                """
                INSERT INTO instruments (
                    symbol, name, industry, exchange, region, instrument_type,
                    is_csi300, constituent_snapshot_date, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(symbol) DO UPDATE SET
                    name = excluded.name,
                    industry = excluded.industry,
                    exchange = excluded.exchange,
                    region = excluded.region,
                    instrument_type = excluded.instrument_type,
                    is_csi300 = excluded.is_csi300,
                    constituent_snapshot_date = excluded.constituent_snapshot_date,
                    updated_at = excluded.updated_at
                """,
                values,
            )
        return len(values)

    def upsert_daily_bars(self, bars: Iterable[dict[str, Any]]) -> int:
        rows = list(bars)
        if not rows:
            return 0
        now = utc_now_iso()
        values = [
            (
                row["symbol"],
                str(row["trade_date"]),
                int(row["timestamp_ms"]),
                float(row["open"]),
                float(row["high"]),
                float(row["low"]),
                float(row["close"]),
                float(row["volume"]),
                float(row.get("amount") or 0),
                row.get("adjust_type", "forward"),
                row.get("source", "quantdash"),
                now,
            )
            for row in rows
        ]
        with self.connect() as connection:
            connection.executemany(
                """
                INSERT INTO daily_bars (
                    symbol, trade_date, timestamp_ms, open, high, low, close,
                    volume, amount, adjust_type, source, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(symbol, trade_date, adjust_type) DO UPDATE SET
                    timestamp_ms = excluded.timestamp_ms,
                    open = excluded.open,
                    high = excluded.high,
                    low = excluded.low,
                    close = excluded.close,
                    volume = excluded.volume,
                    amount = excluded.amount,
                    source = excluded.source,
                    updated_at = excluded.updated_at
                """,
                values,
            )
        return len(values)

    def start_sync_run(
        self,
        *,
        requested_symbols: int,
        start_date: str,
        end_date: str,
    ) -> int:
        with self.connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO sync_runs (
                    started_at, status, requested_symbols, start_date, end_date
                ) VALUES (?, 'running', ?, ?, ?)
                """,
                (utc_now_iso(), requested_symbols, start_date, end_date),
            )
            return int(cursor.lastrowid)

    def finish_sync_run(
        self,
        run_id: int,
        *,
        status: str,
        synced_symbols: int = 0,
        rows_written: int = 0,
        error_message: str | None = None,
    ) -> None:
        with self.connect() as connection:
            connection.execute(
                """
                UPDATE sync_runs
                SET finished_at = ?, status = ?, synced_symbols = ?,
                    rows_written = ?, error_message = ?
                WHERE id = ?
                """,
                (
                    utc_now_iso(),
                    status,
                    synced_symbols,
                    rows_written,
                    error_message,
                    run_id,
                ),
            )

    def fail_stale_sync_runs(self) -> int:
        """Close runs left in 'running' state by a terminated process."""
        with self.connect() as connection:
            cursor = connection.execute(
                """
                UPDATE sync_runs
                SET finished_at = ?, status = 'failed',
                    error_message = COALESCE(error_message, '同步进程异常中断')
                WHERE status = 'running'
                """,
                (utc_now_iso(),),
            )
            return int(cursor.rowcount)

    def get_covered_symbols(
        self,
        *,
        earliest_date: str,
        latest_date: str,
        minimum_rows: int = 180,
    ) -> set[str]:
        """Return symbols already covering a complete one-year sync window."""
        with self.connect() as connection:
            rows = connection.execute(
                """
                SELECT symbol
                FROM daily_bars
                WHERE adjust_type = 'forward'
                GROUP BY symbol
                HAVING MIN(trade_date) <= ?
                   AND MAX(trade_date) >= ?
                   AND COUNT(*) >= ?
                """,
                (earliest_date, latest_date, minimum_rows),
            ).fetchall()
        return {row["symbol"] for row in rows}

    def get_instruments(self) -> dict[str, dict[str, Any]]:
        with self.connect() as connection:
            rows = connection.execute(
                """
                SELECT symbol, name, industry, exchange, region, instrument_type,
                       constituent_snapshot_date
                FROM instruments
                WHERE is_csi300 = 1
                ORDER BY symbol
                """
            ).fetchall()
        return {row["symbol"]: dict(row) for row in rows}

    def get_recent_bars(
        self,
        *,
        limit_per_symbol: int = 80,
        adjust_type: str = "forward",
    ) -> dict[str, list[dict[str, Any]]]:
        with self.connect() as connection:
            rows = connection.execute(
                """
                SELECT symbol, trade_date, timestamp_ms, open, high, low, close,
                       volume, amount
                FROM (
                    SELECT daily_bars.*,
                           ROW_NUMBER() OVER (
                               PARTITION BY symbol ORDER BY trade_date DESC
                           ) AS row_number
                    FROM daily_bars
                    WHERE adjust_type = ?
                )
                WHERE row_number <= ?
                ORDER BY symbol, trade_date
                """,
                (adjust_type, limit_per_symbol),
            ).fetchall()
        return self._group_bars(rows)

    def get_stock_bars(
        self,
        symbol: str,
        *,
        limit: int = 400,
        adjust_type: str = "forward",
    ) -> list[dict[str, Any]]:
        with self.connect() as connection:
            rows = connection.execute(
                """
                SELECT symbol, trade_date, timestamp_ms, open, high, low, close,
                       volume, amount
                FROM daily_bars
                WHERE symbol = ? AND adjust_type = ?
                ORDER BY trade_date DESC
                LIMIT ?
                """,
                (symbol, adjust_type, limit),
            ).fetchall()
        return [dict(row) for row in reversed(rows)]

    def stats(self) -> dict[str, Any]:
        with self.connect() as connection:
            summary = connection.execute(
                """
                SELECT
                    (SELECT COUNT(*) FROM instruments WHERE is_csi300 = 1) AS instrument_count,
                    (SELECT COUNT(*) FROM daily_bars WHERE adjust_type = 'forward') AS bar_count,
                    (SELECT MIN(trade_date) FROM daily_bars WHERE adjust_type = 'forward') AS first_trade_date,
                    (SELECT MAX(trade_date) FROM daily_bars WHERE adjust_type = 'forward') AS latest_trade_date,
                    (SELECT MAX(constituent_snapshot_date) FROM instruments WHERE is_csi300 = 1) AS constituents_date
                """
            ).fetchone()
            last_run = connection.execute(
                """
                SELECT id, started_at, finished_at, status, requested_symbols,
                       synced_symbols, rows_written, error_message
                FROM sync_runs
                ORDER BY id DESC
                LIMIT 1
                """
            ).fetchone()
        result = dict(summary) if summary else {}
        result["database_path"] = str(self.path)
        result["last_sync"] = dict(last_run) if last_run else None
        return result

    @staticmethod
    def _group_bars(
        rows: Sequence[sqlite3.Row],
    ) -> dict[str, list[dict[str, Any]]]:
        grouped: dict[str, list[dict[str, Any]]] = {}
        for row in rows:
            grouped.setdefault(row["symbol"], []).append(dict(row))
        return grouped
