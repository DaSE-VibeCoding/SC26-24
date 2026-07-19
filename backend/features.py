from .schemas import FactorOption


FACTOR_OPTIONS = [
    # 动量
    FactorOption(key="ret_5", label="5日动量", group="动量"),
    FactorOption(key="ret_20", label="20日动量", group="动量", default_selected=True),
    FactorOption(key="ret_60", label="60日动量", group="动量", default_selected=True),
    # 趋势
    FactorOption(key="close_ma20_gap", label="收盘/MA20偏离", group="趋势", default_selected=True),
    FactorOption(key="ma20_ma60_gap", label="MA20/MA60偏离", group="趋势", default_selected=True),
    FactorOption(key="ma20_slope_5", label="MA20 5日斜率", group="趋势"),
    # 超买超卖
    FactorOption(key="rsi_14", label="RSI(14)", group="超买超卖", default_selected=True),
    # 风险
    FactorOption(key="vol_20", label="20日波动率", group="风险", default_selected=True),
    FactorOption(key="maxdd_60", label="60日最大回撤", group="风险", default_selected=True),
    # 量价
    FactorOption(key="volume_ratio_5_20", label="量比(5/20)", group="量价", default_selected=True),
    FactorOption(key="price_volume_5", label="价量联动(5日)", group="量价"),
    # 价格位置
    FactorOption(key="distance_high_60", label="距60日高点", group="价格位置"),
]

FACTOR_LABELS = {item.key: item.label for item in FACTOR_OPTIONS}
DEFAULT_FACTORS = [item.key for item in FACTOR_OPTIONS if item.default_selected]
