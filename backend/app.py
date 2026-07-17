from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings, get_settings
from .data_service import DataService
from .features import FACTOR_OPTIONS
from .models import MODEL_OPTIONS
from .predictor import Predictor
from .schemas import MarketResponse, OptionsResponse, PredictionResponse, StockDetail, TrainRequest

app = FastAPI(title="AlphaScope API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def get_data_service(settings: Settings = Depends(get_settings)) -> DataService:
    return DataService(settings)


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now()}


@app.get("/api/status")
def api_status(settings: Settings = Depends(get_settings)):
    return {"data_mode": settings.data_mode, "quantdash_configured": bool(settings.quantdash_token)}


@app.post("/api/data/refresh")
def refresh_data(settings: Settings = Depends(get_settings)):
    if settings.data_mode == "mock":
        return {"ok": True, "message": "Mock 数据无需刷新"}
    return {"ok": True, "message": "数据刷新任务已触发"}


@app.get("/api/market", response_model=MarketResponse)
def market(service: DataService = Depends(get_data_service)):
    return service.get_market()


@app.get("/api/model/options", response_model=OptionsResponse)
def options():
    return OptionsResponse(factors=FACTOR_OPTIONS, models=MODEL_OPTIONS)


@app.post("/api/model/train-and-predict", response_model=PredictionResponse)
def train_and_predict(request: TrainRequest):
    return Predictor().run(request)


@app.get("/api/predictions/latest", response_model=PredictionResponse)
def latest_predictions():
    from .features import DEFAULT_FACTORS
    return Predictor().run(TrainRequest(factors=DEFAULT_FACTORS))


@app.get("/api/stocks/{symbol}", response_model=StockDetail)
def get_stock(symbol: str, service: DataService = Depends(get_data_service)):
    result = service.get_stock(symbol)
    if result is None:
        raise HTTPException(status_code=404, detail="股票不在当前沪深 300 快照中")
    return result

