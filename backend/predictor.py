from __future__ import annotations

import threading
from datetime import date, datetime
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from .config import Settings
from .database import MarketDatabase
from .features import FACTOR_LABELS
from .market_analytics import build_snapshot, calculate_factors, percentile_ranks
from .mock_data import prediction_response
from .models import build_model
from .schemas import (
    ModelMetrics,
    PredictionItem,
    PredictionResponse,
    TrainRequest,
)


class PredictionUnavailableError(RuntimeError):
    pass


class Predictor:
    """Train a small time-split model from the local QuantDash SQLite cache."""

    _cache: dict[tuple[object, ...], PredictionResponse] = {}
    _lock = threading.Lock()

    def __init__(
        self,
        settings: Settings,
        database: MarketDatabase | None = None,
    ) -> None:
        self.settings = settings
        self.database = database or MarketDatabase(settings.database_path)

    def run(self, request: TrainRequest) -> PredictionResponse:
        if self.settings.data_mode == "mock":
            return prediction_response(request.model, request.factors, request.top_n)

        self.database.initialize()
        cache_key = self._cache_key(request)
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        with self._lock:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached
            result = self._train_and_predict(request)
            self._cache[cache_key] = result
            return result

    def _cache_key(self, request: TrainRequest) -> tuple[object, ...]:
        path = Path(self.settings.database_path)
        database_version = path.stat().st_mtime_ns if path.exists() else 0
        return (
            str(path.resolve()),
            database_version,
            request.model,
            tuple(request.factors),
            request.top_n,
        )

    def _train_and_predict(self, request: TrainRequest) -> PredictionResponse:
        instruments = self.database.get_instruments()
        histories = self.database.get_all_bars()
        if len(instruments) < 20 or not histories:
            raise PredictionUnavailableError("本地行情不足，无法训练多因子模型")

        samples = self._build_training_samples(histories, request.factors)
        unique_dates = sorted(samples["trade_date"].unique())
        if len(unique_dates) < 40:
            raise PredictionUnavailableError("可用交易日不足 40 天，暂时无法做样本外验证")

        test_days = max(15, min(40, len(unique_dates) // 5))
        split_date = unique_dates[-test_days]
        train = samples[samples["trade_date"] < split_date].copy()
        test = samples[samples["trade_date"] >= split_date].copy()
        if len(train) < 1_000 or len(test) < 200:
            raise PredictionUnavailableError("模型训练或测试样本不足")

        feature_columns = list(request.factors)
        validation_model = self._make_estimator(request.model)
        validation_model.fit(train[feature_columns], train["target"])
        test["prediction"] = validation_model.predict(test[feature_columns])
        metrics = self._evaluate(test)

        final_model = self._make_estimator(request.model)
        final_model.fit(samples[feature_columns], samples["target"])

        live_rows, live_metadata, live_percentiles = self._build_live_features(
            histories,
            instruments,
            feature_columns,
        )
        if len(live_rows) < 20:
            raise PredictionUnavailableError("最新截面可用股票不足，无法生成候选排名")
        live_predictions = final_model.predict(live_rows[feature_columns])
        lower_bound, upper_bound = samples["target"].quantile([0.025, 0.975])
        live_predictions = np.clip(live_predictions, lower_bound, upper_bound)
        live_rows = live_rows.assign(prediction=live_predictions)
        live_rows["potential_score"] = (
            live_rows["prediction"].rank(method="average", pct=True) * 100
        )
        live_rows = live_rows.sort_values("prediction", ascending=False)

        items: list[PredictionItem] = []
        for rank, row in enumerate(live_rows.head(request.top_n).itertuples(), start=1):
            snapshot = live_metadata[row.symbol]
            factor_profile = live_percentiles.get(row.symbol, {})
            items.append(
                PredictionItem(
                    rank=rank,
                    symbol=row.symbol,
                    name=snapshot.name,
                    industry=snapshot.industry,
                    potential_score=round(float(row.potential_score), 1),
                    predicted_excess_20=round(float(row.prediction), 2),
                    risk_level=snapshot.risk_level or "medium",
                    factor_percentiles={
                        key: round(float(factor_profile[key]), 4)
                        for key in feature_columns
                        if key in factor_profile
                    },
                    tags=self._profile_tags(factor_profile, feature_columns),
                    price=snapshot.price,
                    change_pct=snapshot.change_pct,
                )
            )

        train_dates = sorted(train["trade_date"].unique())
        test_dates = sorted(test["trade_date"].unique())
        latest_dates = [bars[-1]["trade_date"] for bars in histories.values() if bars]
        prediction_date = date.fromisoformat(max(latest_dates))
        status = "valid" if metrics.rank_ic >= 0.02 and metrics.ic_positive_ratio >= 0.5 else "weak"
        return PredictionResponse(
            model_run_id=f"mdl_{request.model}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            status=status,
            model=request.model,
            factors=feature_columns,
            trained_at=datetime.now(),
            prediction_date=prediction_date,
            train_period=(
                date.fromisoformat(str(train_dates[0])),
                date.fromisoformat(str(train_dates[-1])),
            ),
            test_period=(
                date.fromisoformat(str(test_dates[0])),
                date.fromisoformat(str(test_dates[-1])),
            ),
            metrics=metrics,
            items=items,
            disclaimer=(
                "基于 QuantDash 一年日线、当前沪深300成分股和时间切分验证；"
                "结果仅供技术研究，不构成投资建议。"
            ),
        )

    @staticmethod
    def _build_training_samples(
        histories: dict[str, list[dict[str, object]]],
        factors: list[str],
    ) -> pd.DataFrame:
        rows: list[dict[str, object]] = []
        lookback = 80
        horizon = 20
        minimum_history = 60
        for symbol, bars in histories.items():
            if len(bars) <= minimum_history + horizon:
                continue
            closes = [float(bar["close"]) for bar in bars]
            for index in range(minimum_history, len(bars) - horizon):
                if closes[index] <= 0:
                    continue
                window = bars[max(0, index - lookback + 1) : index + 1]
                values = calculate_factors(window)
                row = {
                    "symbol": symbol,
                    "trade_date": str(bars[index]["trade_date"]),
                    "forward_return": (closes[index + horizon] / closes[index] - 1) * 100,
                }
                row.update({key: values.get(key) for key in factors})
                rows.append(row)

        if not rows:
            raise PredictionUnavailableError("没有可用于训练的因子样本")
        frame = pd.DataFrame(rows)
        frame = frame.replace([np.inf, -np.inf], np.nan)
        market_return = frame.groupby("trade_date")["forward_return"].transform("mean")
        frame["target"] = frame["forward_return"] - market_return
        return frame

    @staticmethod
    def _make_estimator(model_key: str):
        model = build_model(model_key)
        if model_key == "ridge":
            return make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), model)
        return make_pipeline(SimpleImputer(strategy="median"), model)

    @staticmethod
    def _evaluate(test: pd.DataFrame) -> ModelMetrics:
        daily_ics: list[float] = []
        top_returns: list[float] = []
        top_hits: list[float] = []
        for _, group in test.groupby("trade_date"):
            if len(group) < 10:
                continue
            correlation = group["prediction"].rank().corr(group["target"].rank())
            if pd.notna(correlation):
                daily_ics.append(float(correlation))
            top = group.nlargest(10, "prediction")
            top_returns.extend(float(value) for value in top["target"])
            top_hits.extend(float(value > 0) for value in top["target"])

        rank_ic = float(np.mean(daily_ics)) if daily_ics else 0.0
        return ModelMetrics(
            rank_ic=round(rank_ic, 4),
            ic_positive_ratio=round(
                float(np.mean([value > 0 for value in daily_ics])) if daily_ics else 0.0,
                4,
            ),
            top10_excess_return=round(float(np.mean(top_returns)) if top_returns else 0.0, 4),
            top10_hit_rate=round(float(np.mean(top_hits)) if top_hits else 0.0, 4),
            mae=round(float(mean_absolute_error(test["target"], test["prediction"])), 4),
        )

    @staticmethod
    def _build_live_features(
        histories: dict[str, list[dict[str, object]]],
        instruments: dict[str, dict[str, object]],
        factors: list[str],
    ) -> tuple[pd.DataFrame, dict[str, object], dict[str, dict[str, float]]]:
        factor_values: dict[str, dict[str, float | None]] = {}
        snapshots: dict[str, object] = {}
        rows: list[dict[str, object]] = []
        for symbol, instrument in instruments.items():
            bars = histories.get(symbol, [])
            snapshot = build_snapshot(instrument, bars[-80:])
            if snapshot is None:
                continue
            values = calculate_factors(bars[-80:])
            factor_values[symbol] = values
            snapshots[symbol] = snapshot
            row: dict[str, object] = {"symbol": symbol}
            row.update({key: values.get(key) for key in factors})
            rows.append(row)
        frame = pd.DataFrame(rows).replace([np.inf, -np.inf], np.nan)
        return frame, snapshots, percentile_ranks(factor_values)

    @staticmethod
    def _profile_tags(
        factor_profile: dict[str, float],
        factors: list[str],
    ) -> list[str]:
        ranked = sorted(
            ((abs(float(factor_profile[key]) - 0.5), key) for key in factors if key in factor_profile),
            reverse=True,
        )
        tags = []
        for _, key in ranked[:2]:
            direction = "偏高" if factor_profile[key] >= 0.5 else "偏低"
            tags.append(f"{FACTOR_LABELS.get(key, key)}{direction}")
        return tags

