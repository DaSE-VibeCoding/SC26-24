"""Sync the local market database or probe the QuantDash SDK connection.

Examples, run from the project root::

    python scripts/refresh_data.py
    python scripts/refresh_data.py sync --force
    python scripts/refresh_data.py probe 600519.SH 10

The probe is read-only and never prints the API key.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import date
from pathlib import Path
from typing import Any, Callable


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import Settings, get_settings  # noqa: E402
from backend.database import MarketDatabase  # noqa: E402
from backend.sync_service import MarketDataSyncService  # noqa: E402


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    args = list(sys.argv[1:] if argv is None else argv)
    command = args.pop(0) if args and args[0] in {"sync", "probe"} else "sync"

    if command == "probe":
        parser = argparse.ArgumentParser(description="检查 QuantDash SDK 连通性和返回结构")
        parser.add_argument("symbol", nargs="?", default="600519.SH")
        parser.add_argument("count", nargs="?", type=int, default=10)
        parsed = parser.parse_args(args)
        if not 1 <= parsed.count <= 400:
            parser.error("count 必须在 1 到 400 之间")
        parsed.command = command
        return parsed

    parser = argparse.ArgumentParser(description="同步一年期沪深300 QuantDash 日线")
    parser.add_argument(
        "--init-only",
        action="store_true",
        help="只创建 SQLite 表，不调用 QuantDash",
    )
    parser.add_argument(
        "--end-date",
        type=date.fromisoformat,
        help="同步截止日期，格式 YYYY-MM-DD，默认今天",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="忽略已完整同步的股票并强制重新拉取",
    )
    parsed = parser.parse_args(args)
    parsed.command = command
    return parsed


def _scrub(text: str, secret: str | None) -> str:
    """Defensively remove the API key from SDK diagnostics."""
    return text.replace(secret, "***") if secret else text


def _describe_dataframe(
    label: str,
    frame: Any,
    elapsed: float,
    secret: str | None,
) -> None:
    print(f"--- {label} ---")
    print(f"return type      : {type(frame).__name__}")
    print(f"shape            : {getattr(frame, 'shape', '?')}")
    print(f"columns          : {list(getattr(frame, 'columns', []))}")
    dtypes = getattr(frame, "dtypes", None)
    if dtypes is not None:
        print("dtypes           :")
        for column, dtype in dtypes.items():
            print(f"    {column}: {dtype}")
    if hasattr(frame, "head") and hasattr(frame, "tail"):
        print("head(2)          :")
        print(_scrub(str(frame.head(2)), secret))
        print("tail(2)          :")
        print(_scrub(str(frame.tail(2)), secret))
    else:
        print(f"preview          : {_scrub(str(frame), secret)}")
    print(f"elapsed (s)      : {elapsed:.3f}")


def probe(
    settings: Settings,
    symbol: str = "600519.SH",
    count: int = 10,
    *,
    client_factory: Callable[..., Any] | None = None,
) -> int:
    """Call one K-line and one quote endpoint without writing local data."""
    key = settings.quantdash_key
    print("=== QuantDash connectivity probe ===")
    print(f"symbol           : {symbol}")
    print(f"count            : {count}  (period=1d, adjust=forward)")
    print(f"api_key configured: {'yes (value not shown)' if key else 'NO'}")
    print(f"client base_url  : {settings.quantdash_base_url}")
    if not key:
        print("[config-missing] 请先在 .env 中配置 QUANTDASH_API_KEY")
        return 2

    if client_factory is None:
        try:
            import quantdash
            from quantdash import QuantDash

            client_factory = QuantDash
            print(f"quantdash version: {getattr(quantdash, '__version__', '?')}")
        except Exception as exc:  # pragma: no cover - environment diagnostic
            print(f"[import-failed] {type(exc).__name__}: {_scrub(str(exc), key)}")
            return 1

    try:
        client = client_factory(
            api_key=key,
            base_url=settings.quantdash_base_url,
            timeout=settings.quantdash_timeout_seconds,
        )
    except Exception as exc:
        print(f"[init-failed] {type(exc).__name__}: {_scrub(str(exc), key)}")
        return 2

    exit_code = 0
    try:
        started = time.perf_counter()
        try:
            frame = client.klines.get(
                symbol,
                period="1d",
                count=count,
                adjust="forward",
                to_dataframe=True,
            )
            _describe_dataframe("klines.get", frame, time.perf_counter() - started, key)
        except Exception as exc:
            print(f"[klines-failed] {type(exc).__name__}: {_scrub(str(exc), key)}")
            exit_code = 3

        started = time.perf_counter()
        try:
            frame = client.quotes.get(symbols=[symbol], to_dataframe=True)
            _describe_dataframe("quotes.get", frame, time.perf_counter() - started, key)
        except Exception as exc:
            print(f"[quotes-failed] {type(exc).__name__}: {_scrub(str(exc), key)}")
            exit_code = 4
    finally:
        close = getattr(client, "close", None)
        if callable(close):
            close()

    print("=== probe done ===")
    return exit_code


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    settings = get_settings()
    if args.command == "probe":
        return probe(settings, args.symbol, args.count)

    database = MarketDatabase(settings.database_path)
    database.initialize()
    if args.init_only:
        print(json.dumps(database.stats(), ensure_ascii=False, indent=2))
        return 0
    if settings.data_mode != "quantdash":
        print("请先在 .env 中设置 DATA_MODE=quantdash", file=sys.stderr)
        return 2

    result = MarketDataSyncService(settings, database=database).sync(
        end_date=args.end_date,
        force=args.force,
        progress=print,
    )
    print(json.dumps(result.model_dump(), ensure_ascii=False, indent=2))
    return 0 if result.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
