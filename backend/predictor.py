from .mock_data import prediction_response
from .schemas import TrainRequest


class Predictor:
    def run(self, request: TrainRequest):
        """Mock vertical slice; replace with time-split training pipeline."""
        return prediction_response(request.model, request.factors, request.top_n)

