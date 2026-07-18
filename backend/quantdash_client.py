from __future__ import annotations

import concurrent.futures
import re
import time as time_module
from collections.abc import Callable, Sequence
from datetime import date, datetime, time
from typing import Any
from zoneinfo import ZoneInfo

from .config import Settings


class QuantDashClient:
    """Single boundary for QuantDash SDK calls and authentication."""

    def __init__(
        self,
        settings: Settings,
        *,
        client_factory: Callable[..., Any] | None = None,
    ):
        self.settings = settings
        self._client_factory = client_factory
        self._batch_klines_available: bool | None = None

    def ensure_configured(self) -> None:
        if not self.settings.quantdash_key:
            raise RuntimeError(
                "QUANTDASH_API_KEY 尚未配置，请在项目根目录 .env 中填写后重试"
            )

    def fetch_history(
        self,
        symbols: Sequence[str],
        *,
        start_date: date,
        end_date: date,
    ) -> tuple[list[dict[str, Any]], dict[str, dict[str, list[Any]]]]:
        """Fetch instrument metadata and forward-adjusted daily bars."""
        instruments = self.fetch_instruments(symbols)
        klines = self.fetch_daily_bars(
            symbols,
            start_date=start_date,
            end_date=end_date,
        )
        return instruments, klines

    def fetch_instruments(self, symbols: Sequence[str]) -> list[dict[str, Any]]:
        self.ensure_configured()
        if not symbols:
            return []

        client = self._make_client()
        try:
            instruments = client.instruments.batch(
                list(symbols),
                batch_size=min(self.settings.quantdash_batch_size, 200),
                max_workers=self.settings.quantdash_max_workers,
                show_progress=False,
            )
            return list(instruments)
        finally:
            close = getattr(client, "close", None)
            if callable(close):
                close()

    def fetch_daily_bars(
        self,
        symbols: Sequence[str],
        *,
        start_date: date,
        end_date: date,
    ) -> dict[str, dict[str, list[Any]]]:
        self.ensure_configured()
        if not symbols:
            return {}

        client = self._make_client()
        try:
            kline_kwargs: dict[str, Any] = {
                "period": "1d",
                "count": 400,
                "start_time": self._start_timestamp_ms(start_date),
                "end_time": self._end_timestamp_ms(end_date),
                "adjust": "forward",
                "to_dataframe": False,
            }
            klines = {}
            if self._batch_klines_available is not False:
                try:
                    klines = client.klines.batch(
                        list(symbols),
                        **kline_kwargs,
                        show_progress=False,
                        max_workers=self.settings.quantdash_max_workers,
                        batch_size=min(self.settings.quantdash_batch_size, 100),
                    )
                    self._batch_klines_available = True
                except Exception:
                    self._batch_klines_available = False
            # QuantDash 基础套餐不开放批量日 K 线；SDK 对多批次权限错误会返回空字典。
            # 对缺失标的自动回退到单标的并发请求，确保不同套餐都可使用。
            missing_symbols = [symbol for symbol in symbols if symbol not in klines]
            if missing_symbols:
                klines.update(
                    self._fetch_individually(client, missing_symbols, kline_kwargs)
                )
            return dict(klines)
        finally:
            close = getattr(client, "close", None)
            if callable(close):
                close()

    def _make_client(self) -> Any:
        factory = self._client_factory
        if factory is None:
            try:
                from quantdash import QuantDash
            except ImportError as exc:
                raise RuntimeError(
                    "缺少 quantdash SDK，请先执行 pip install -r requirements.txt"
                ) from exc
            factory = QuantDash
        return factory(
            api_key=self.settings.quantdash_key,
            base_url=self.settings.quantdash_base_url,
            timeout=self.settings.quantdash_timeout_seconds,
        )

    def _fetch_individually(
        self,
        client: Any,
        symbols: Sequence[str],
        kwargs: dict[str, Any],
    ) -> dict[str, dict[str, list[Any]]]:
        results: dict[str, dict[str, list[Any]]] = {}
        final_errors: list[tuple[str, Exception]] = []

        def fetch(symbol: str) -> tuple[str, dict[str, list[Any]]]:
            return symbol, client.klines.get(symbol, **kwargs)

        pending = list(symbols)
        for attempt in range(3):
            round_errors: list[tuple[str, Exception]] = []
            with concurrent.futures.ThreadPoolExecutor(
                max_workers=self.settings.quantdash_max_workers
            ) as executor:
                futures = {executor.submit(fetch, symbol): symbol for symbol in pending}
                for future in concurrent.futures.as_completed(futures):
                    symbol = futures[future]
                    try:
                        returned_symbol, payload = future.result()
                        results[returned_symbol] = payload
                    except Exception as exc:  # 单只失败不影响其他股票入库
                        round_errors.append((symbol, exc))

            rate_limited = [
                (symbol, error)
                for symbol, error in round_errors
                if "Rate limit" in str(error) or "429" in str(error)
            ]
            final_errors.extend(
                (symbol, error)
                for symbol, error in round_errors
                if (symbol, error) not in rate_limited
            )
            if not rate_limited or attempt == 2:
                final_errors.extend(rate_limited)
                break
            wait_seconds = max(
                self._retry_after_seconds(error) for _, error in rate_limited
            )
            time_module.sleep(wait_seconds)
            pending = [symbol for symbol, _ in rate_limited]

        if not results and final_errors:
            symbol, error = final_errors[0]
            raise RuntimeError(
                f"QuantDash 单标的日线请求全部失败，首个失败标的 {symbol}: {error}"
            ) from error
        return results

    @staticmethod
    def _retry_after_seconds(error: Exception) -> float:
        match = re.search(r"Retry after\s+(\d+)ms", str(error), flags=re.IGNORECASE)
        return int(match.group(1)) / 1000 + 1 if match else 61.0

    @staticmethod
    def _start_timestamp_ms(value: date) -> int:
        dt = datetime.combine(value, time.min, tzinfo=ZoneInfo("Asia/Shanghai"))
        return int(dt.timestamp() * 1000)

    @staticmethod
    def _end_timestamp_ms(value: date) -> int:
        dt = datetime.combine(value, time.max, tzinfo=ZoneInfo("Asia/Shanghai"))
        return int(dt.timestamp() * 1000)
