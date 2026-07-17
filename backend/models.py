from .schemas import ModelOption


MODEL_OPTIONS = [
    ModelOption(key="ridge", label="岭回归", description="线性、快速、可解释，适合作为基线。"),
    ModelOption(key="random_forest", label="随机森林", description="默认模型，可表达非线性因子关系。"),
    ModelOption(
        key="hist_gradient_boosting",
        label="直方图梯度提升",
        description="适合表格数据的非线性模型。",
    ),
]


def build_model(model_key: str):
    """Real training entry point; implemented by the factor/model owner."""
    from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
    from sklearn.linear_model import Ridge

    factories = {
        "ridge": lambda: Ridge(alpha=1.0),
        "random_forest": lambda: RandomForestRegressor(
            n_estimators=200, max_depth=6, random_state=42, n_jobs=-1
        ),
        "hist_gradient_boosting": lambda: HistGradientBoostingRegressor(
            max_depth=5, random_state=42
        ),
    }
    return factories[model_key]()

