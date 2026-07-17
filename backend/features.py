from .schemas import FactorOption


FACTOR_OPTIONS = [
    FactorOption(key="momentum_20d", label="20日动量", group="动量", default_selected=True),
    FactorOption(key="momentum_60d", label="60日动量", group="动量", default_selected=True),
    FactorOption(key="reversal_5d", label="5日反转", group="动量"),
    FactorOption(key="volatility_20d", label="20日波动率", group="风险", default_selected=True),
    FactorOption(key="max_drawdown_60d", label="60日最大回撤", group="风险"),
    FactorOption(key="turnover_20d", label="20日换手率", group="流动性", default_selected=True),
    FactorOption(key="volume_ratio", label="量比", group="流动性"),
    FactorOption(key="pe_ttm", label="市盈率 TTM", group="估值", default_selected=True),
    FactorOption(key="pb", label="市净率", group="估值", default_selected=True),
    FactorOption(key="roe", label="净资产收益率", group="质量", default_selected=True),
    FactorOption(key="revenue_growth", label="营收增长率", group="成长", default_selected=True),
    FactorOption(key="profit_growth", label="利润增长率", group="成长"),
]

FACTOR_LABELS = {item.key: item.label for item in FACTOR_OPTIONS}
DEFAULT_FACTORS = [item.key for item in FACTOR_OPTIONS if item.default_selected]

