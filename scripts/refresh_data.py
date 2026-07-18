"""Initialize or refresh the local QuantDash market database."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.config import get_settings  # noqa: E402
from backend.database import MarketDatabase  # noqa: E402
from backend.sync_service import MarketDataSyncService  # noqa: E402


def parse_args() -> argparse.Namespace:
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
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    settings = get_settings()
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
