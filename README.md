# AlphaScope Stock Picker

面向沪深 300 的轻量级多因子智能选股演示系统。项目以三天可交付为边界，提供基础看盘、股票筛选、因子选择、模型选择和候选股票排序。

默认使用清晰标记的 Mock 数据；配置 QuantDash 后，可将一年期沪深300日线同步到本地 SQLite 数据库，并由看盘接口直接读取。

## 技术栈

- 前端：React、TypeScript、Vite、Ant Design、ECharts
- 后端：FastAPI、Pydantic、pandas、scikit-learn
- 数据：QuantDash Python SDK + SQLite（约 300 只股票、7.5 万条一年期日线）

## 快速启动

```powershell
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Set-Location frontend
npm install
Set-Location ..
.\scripts\start.ps1
```

浏览器打开 `http://localhost:5173`，接口文档位于 `http://localhost:8000/docs`。

## 接入 QuantDash 数据库

1. 在项目根目录创建 `.env`，配置服务端密钥和数据模式：

```dotenv
QUANTDASH_API_KEY=你的密钥
DATA_MODE=quantdash
DATABASE_PATH=data/alphascope.db
CSI300_CONSTITUENTS_FILE=config/csi300_constituents.csv
MARKET_HISTORY_DAYS=365
```

2. 初始化数据库并同步一年数据：

```powershell
.\.venv\Scripts\python.exe scripts\refresh_data.py --init-only
.\.venv\Scripts\python.exe scripts\refresh_data.py
```

同步器会优先使用 QuantDash 批量接口；相同股票和交易日会执行更新插入，因此命令可重复运行。数据库包含：

若当前 QuantDash 套餐未开放批量日 K 线，程序会自动回退为单股请求并按套餐的 `10 次/分钟` 配额限速。300 只股票首次同步约需 30 分钟，每 10 只会立即写库；中断后重新执行同一命令会复用已经完整同步的股票。使用 `--force` 可强制全量覆盖。

- `instruments`：沪深300成分股代码、名称和快照日期
- `daily_bars`：前复权日线 OHLCV、成交额和来源
- `sync_runs`：每次同步的状态、股票数、写入行数和错误信息

`.env` 与 `data/*.db` 已加入 `.gitignore`，不会上传密钥或本地行情库。启动后可通过 `GET /api/status` 查看库内股票数、日线数和最后同步状态，也可通过 `POST /api/data/refresh` 触发刷新。

## 目录分工

- `frontend/`：看盘和模型交互页面
- `backend/`：接口、数据适配、特征和模型边界
- `config/`：沪深 300 股票池快照
- `scripts/`：数据刷新、训练和本地启动脚本
- `data/alphascope.db`：本地 SQLite 行情库，不提交到 Git

## 协作约定

四位成员分别使用 `feat/frontend-dashboard`、`feat/data-quantdash`、`feat/factor-model`、`feat/backend-integration` 分支，通过 Pull Request 合并到 `main`。禁止直接向 `main` 推送功能代码。

本项目只用于技术演示，不构成投资建议。

