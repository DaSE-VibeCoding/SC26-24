from datetime import date

import pytest

from backend.config import Settings
from backend.quantdash_client import QuantDashClient


class FakeInstruments:
    def batch(self, symbols, **kwargs):
        return [
            {
                "symbol": symbol,
                "name": symbol,
                "exchange": symbol[-2:],
                "region": "CN",
                "type": "stock",
            }
            for symbol in symbols
        ]


class FakeKlines:
    def __init__(self):
        self.single_calls = []

    def batch(self, symbols, **kwargs):
        raise RuntimeError("Access mode 'batch' not available")

    def get(self, symbol, **kwargs):
        self.single_calls.append((symbol, kwargs))
        return {
            "timestamp": [1784217600000],
            "open": [10.0],
            "high": [10.8],
            "low": [9.9],
            "close": [10.5],
            "volume": [1_000_000],
            "amount": [10_500_000],
        }


class FakeSdkClient:
    instances = []

    def __init__(self, **kwargs):
        self.instruments = FakeInstruments()
        self.klines = FakeKlines()
        self.closed = False
        self.__class__.instances.append(self)

    def close(self):
        self.closed = True


def test_batch_permission_falls_back_to_single_symbol_requests():
    FakeSdkClient.instances.clear()
    settings = Settings(quantdash_api_key="test-key", quantdash_max_workers=2)
    client = QuantDashClient(settings, client_factory=FakeSdkClient)
    symbols = ["600519.SH", "000001.SZ"]

    instruments, klines = client.fetch_history(
        symbols,
        start_date=date(2025, 7, 18),
        end_date=date(2026, 7, 18),
    )

    assert len(instruments) == 2
    assert set(klines) == set(symbols)
    kline_client = FakeSdkClient.instances[-1]
    assert len(kline_client.klines.single_calls) == 2
    assert all(call[1]["count"] == 400 for call in kline_client.klines.single_calls)
    assert all(instance.closed for instance in FakeSdkClient.instances)


def test_missing_api_key_fails_before_network_call():
    client = QuantDashClient(
        Settings(quantdash_api_key="", quantdash_token=""),
        client_factory=FakeSdkClient,
    )
    with pytest.raises(RuntimeError, match="QUANTDASH_API_KEY"):
        client.fetch_instruments(["600519.SH"])
