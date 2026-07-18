"""Data refresh entry point.

Currently this script implements a read-only **QuantDash data spike**
(`probe` subcommand): it exercises the real QuantDash SDK against ONE
symbol and ~10 daily K-lines to confirm the actual method signatures,
return types, column names and dtypes. It deliberately does NOT implement
caching, factor computation, or full 300-stock fetches — that is the
responsibility of later data-layer work.

Usage (from project root)::

    python scripts/refresh_data.py            # informational (no network)
    python scripts/refresh_data.py probe [symbol] [count]

API key is read ONLY from the environment (`QUANTDASH_API_KEY`, falling back
to the project's `QUANTDASH_TOKEN`). The key value is never printed.
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path
from typing import Optional

# Allow running as `python scripts/refresh_data.py` from the project root:
# the script's own dir is on sys.path[0], but `backend` lives in the root.
_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)


def _load_env() -> None:
    """Best-effort .env loader; never raises so the probe still runs without it."""
    try:
        from dotenv import load_dotenv

        load_dotenv()
    except Exception:
        pass


def _resolve_api_key() -> Optional[str]:
    """SDK reads QUANTDASH_API_KEY natively; the project .env uses QUANTDASH_TOKEN."""
    return (
        os.environ.get("QUANTDASH_API_KEY")
        or os.environ.get("QUANTDASH_TOKEN")
        or None
    )


def _scrub(text: str, secret: Optional[str]) -> str:
    """Defensively strip the API key from any error string before printing."""
    if secret:
        text = text.replace(secret, "***")
    return text


def _describe_dataframe(label: str, df, elapsed: float, secret: Optional[str]) -> None:
    print(f"--- {label} ---")
    print(f"return type      : {type(df).__name__}")
    print(f"shape            : {df.shape}")
    print(f"columns          : {list(df.columns)}")
    print(f"dtypes           :")
    for col, dtype in df.dtypes.items():
        print(f"    {col}: {dtype}")
    print(f"head(2)          :")
    print(_scrub(str(df.head(2)), secret))
    print(f"tail(2)          :")
    print(_scrub(str(df.tail(2)), secret))
    print(f"elapsed (s)      : {elapsed:.3f}")


def probe(symbol: str = "600519.SH", count: int = 10) -> int:
    _load_env()
    key = _resolve_api_key()

    print("=== QuantDash Data Spike (probe) ===")
    print(f"symbol           : {symbol}")
    print(f"count            : {count}  (period=1d, adjust=forward)")
    print(f"api_key configured: {'yes (value not shown)' if key else 'NO'}")

    try:
        import quantdash
        from quantdash import QuantDash

        print(f"quantdash version: {getattr(quantdash, '__version__', '?')}")
        print(f"client base_url  : https://api.quantdash.net (SDK default)")
    except Exception as e:  # pragma: no cover - import-time diagnostics
        print(f"[import-failed] {type(e).__name__}: {e}")
        return 1

    try:
        client = QuantDash(api_key=key)
    except Exception as e:
        print(f"[init-failed] {type(e).__name__}: {_scrub(str(e), key)}")
        return 2

    exit_code = 0
    with client:
        # 1) Daily K-lines (~count bars) via the documented klines.get endpoint.
        t0 = time.perf_counter()
        try:
            df = client.klines.get(
                symbol, period="1d", count=count, to_dataframe=True
            )
            _describe_dataframe("klines.get", df, time.perf_counter() - t0, key)
        except Exception as e:
            print(
                f"[klines-failed] {type(e).__name__}: "
                f"{_scrub(str(e), key)}"
            )
            exit_code = 3

        # 2) Latest quote for the same symbol via quotes.get.
        t0 = time.perf_counter()
        try:
            q = client.quotes.get(symbols=[symbol], to_dataframe=True)
            _describe_dataframe("quotes.get", q, time.perf_counter() - t0, key)
        except Exception as e:
            print(
                f"[quotes-failed] {type(e).__name__}: "
                f"{_scrub(str(e), key)}"
            )
            exit_code = 4

    print("=== spike done ===")
    return exit_code


def main(argv: Optional[list[str]] = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)

    if args and args[0] == "probe":
        symbol = args[1] if len(args) > 1 else "600519.SH"
        count = int(args[2]) if len(args) > 2 else 10
        return probe(symbol, count)

    from backend.config import get_settings

    settings = get_settings()
    print(f"data_mode={settings.data_mode}; cache={settings.data_cache_dir}")
    print("Mock 模式无需刷新；QuantDash 接口由数据负责人接入。")
    print("提示：运行 `python scripts/refresh_data.py probe [symbol] [count]` 执行数据探针。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
