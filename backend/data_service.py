from .config import Settings
from .mock_data import market_response, stock_detail


class DataService:
    def __init__(self, settings: Settings):
        self.settings = settings

    def get_market(self):
        if self.settings.data_mode == "mock":
            return market_response()
        raise NotImplementedError("QuantDash 数据服务尚未接入")

    def get_stock(self, symbol: str):
        if self.settings.data_mode == "mock":
            return stock_detail(symbol)
        raise NotImplementedError("QuantDash 数据服务尚未接入")

