from .schemas import ModelOption


MODEL_OPTIONS = [
    ModelOption(key="ridge", label="岭回归", description="线性、快速、可解释，适合作为基线。"),
    ModelOption(key="random_forest", label="随机森林", description="可表达非线性因子关系。"),
    ModelOption(
        key="hist_gradient_boosting",
        label="直方图梯度提升",
        description="默认模型，适合表格数据的非线性建模。",
    ),
]


def build_model(model_key: str):
    """Real training entry point; implemented by the factor/model owner."""
    from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
    from sklearn.linear_model import Ridge

    factories = {
        "ridge": lambda: Ridge(alpha=10.0),
        "random_forest": lambda: RandomForestRegressor(
            n_estimators=200, max_depth=6, min_samples_leaf=50,
            max_features=0.7, random_state=42, n_jobs=-1,
        ),
        "hist_gradient_boosting": lambda: HistGradientBoostingRegressor(
            learning_rate=0.05, max_iter=150, max_leaf_nodes=15,
            min_samples_leaf=50, l2_regularization=1.0,
            early_stopping=True, random_state=42,
        ),
    }
    return factories[model_key]()
