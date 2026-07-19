from __future__ import annotations

import pandas as pd

from backend.config import Settings
from scripts.refresh_data import parse_args, probe


class FakeEndpoint:
    def __init__(self, frame):
        self.frame = frame
        self.calls = []

    def get(self, *args, **kwargs):
        self.calls.append((args, kwargs))
        return self.frame


class FakeProbeClient:
    instances = []

    def __init__(self, **kwargs):
        self.init_kwargs = kwargs
        self.klines = FakeEndpoint(
            pd.DataFrame({"symbol": ["600519.SH"], "close": [1500.0]})
        )
        self.quotes = FakeEndpoint(
            pd.DataFrame({"symbol": ["600519.SH"], "last": [1500.0]})
        )
        self.closed = False
        self.__class__.instances.append(self)

    def close(self):
        self.closed = True


def test_probe_uses_project_settings_and_never_prints_secret(capsys):
    FakeProbeClient.instances.clear()
    secret = "test-secret-value"
    settings = Settings(
        _env_file=None,
        quantdash_api_key=secret,
        quantdash_base_url="https://example.invalid",
        quantdash_timeout_seconds=12,
    )

    result = probe(
        settings,
        "600519.SH",
        5,
        client_factory=FakeProbeClient,
    )

    output = capsys.readouterr().out
    client = FakeProbeClient.instances[0]
    assert result == 0
    assert secret not in output
    assert client.init_kwargs["api_key"] == secret
    assert client.init_kwargs["base_url"] == "https://example.invalid"
    assert client.klines.calls[0][1]["count"] == 5
    assert client.klines.calls[0][1]["adjust"] == "forward"
    assert client.closed is True


def test_cli_keeps_sync_as_default_and_supports_probe_subcommand():
    sync_args = parse_args(["--init-only"])
    probe_args = parse_args(["probe", "000001.SZ", "3"])

    assert sync_args.command == "sync"
    assert sync_args.init_only is True
    assert probe_args.command == "probe"
    assert probe_args.symbol == "000001.SZ"
    assert probe_args.count == 3
