from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import date
from pathlib import Path


@dataclass(frozen=True)
class Constituent:
    symbol: str
    name: str
    industry: str
    snapshot_date: date


def normalize_symbol(symbol: str) -> str:
    normalized = symbol.strip().upper()
    if normalized.endswith(".SS"):
        normalized = f"{normalized[:-3]}.SH"
    if not normalized.endswith((".SH", ".SZ")):
        raise ValueError(f"不支持的 A 股代码格式: {symbol}")
    return normalized


def load_constituents(path: Path | str, *, expected_count: int = 300) -> list[Constituent]:
    csv_path = Path(path)
    if not csv_path.exists():
        raise FileNotFoundError(f"沪深300成分股文件不存在: {csv_path}")

    constituents: list[Constituent] = []
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"symbol", "name", "snapshot_date"}
        if not reader.fieldnames or not required.issubset(reader.fieldnames):
            raise ValueError(f"成分股文件必须包含字段: {', '.join(sorted(required))}")
        for line_number, row in enumerate(reader, start=2):
            try:
                constituents.append(
                    Constituent(
                        symbol=normalize_symbol(row["symbol"]),
                        name=row["name"].strip(),
                        industry=(row.get("industry") or "未知").strip() or "未知",
                        snapshot_date=date.fromisoformat(row["snapshot_date"].strip()),
                    )
                )
            except (KeyError, ValueError) as exc:
                raise ValueError(f"成分股文件第 {line_number} 行无效: {exc}") from exc

    symbols = [item.symbol for item in constituents]
    duplicates = sorted({symbol for symbol in symbols if symbols.count(symbol) > 1})
    if duplicates:
        raise ValueError(f"成分股文件存在重复代码: {', '.join(duplicates[:5])}")
    if len(constituents) != expected_count:
        raise ValueError(
            f"沪深300成分股数量应为 {expected_count}，当前为 {len(constituents)}"
        )
    return constituents
