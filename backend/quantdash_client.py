from .config import Settings


class QuantDashClient:
    """Single boundary for QuantDash calls and field normalization."""

    def __init__(self, settings: Settings):
        self.settings = settings

    def ensure_configured(self) -> None:
        if not self.settings.quantdash_token:
            raise RuntimeError("QUANTDASH_TOKEN 尚未配置")

    def fetch_market_snapshot(self):
        self.ensure_configured()
        raise NotImplementedError("由数据负责人按 QuantDash 实际 SDK 完成接口映射")

