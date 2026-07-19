from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings, get_settings
from .data_service import DataService, DataUnavailableError
from .features import FACTOR_OPTIONS
from .models import MODEL_OPTIONS
from .predictor import PredictionUnavailableError, Predictor
from .schemas import MarketResponse, OptionsResponse, PredictionResponse, StockDetail, TrainRequest

app = FastAPI(title="AlphaScope API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def get_data_service(settings: Settings = Depends(get_settings)) -> DataService:
    return DataService(settings)


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now()}


@app.get("/api/status")
def api_status(service: DataService = Depends(get_data_service)):
    return service.status()


@app.post("/api/data/refresh")
def refresh_data(service: DataService = Depends(get_data_service)):
    try:
        return service.refresh()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/api/market", response_model=MarketResponse)
def market(service: DataService = Depends(get_data_service)):
    try:
        return service.get_market()
    except DataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/api/model/options", response_model=OptionsResponse)
def options():
    return OptionsResponse(factors=FACTOR_OPTIONS, models=MODEL_OPTIONS)


@app.post("/api/model/train-and-predict", response_model=PredictionResponse)
def train_and_predict(request: TrainRequest, settings: Settings = Depends(get_settings)):
    try:
        return Predictor(settings).run(request)
    except PredictionUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/api/predictions/latest", response_model=PredictionResponse)
def latest_predictions(settings: Settings = Depends(get_settings)):
    from .features import DEFAULT_FACTORS
    try:
        return Predictor(settings).run(TrainRequest(factors=DEFAULT_FACTORS))
    except PredictionUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/api/stocks/{symbol}", response_model=StockDetail)
def get_stock(symbol: str, service: DataService = Depends(get_data_service)):
    try:
        result = service.get_stock(symbol)
    except DataUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if result is None:
        raise HTTPException(status_code=404, detail="股票不在当前沪深 300 快照中")
    return result

