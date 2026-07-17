from backend.features import DEFAULT_FACTORS
from backend.predictor import Predictor
from backend.schemas import TrainRequest


if __name__ == "__main__":
    result = Predictor().run(TrainRequest(factors=DEFAULT_FACTORS))
    print(result.model_dump_json(indent=2))

