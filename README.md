# AlphaScope Stock Picker

面向沪深 300 的轻量级多因子智能选股演示系统。项目以三天可交付为边界，提供基础看盘、股票筛选、因子选择、模型选择和候选股票排序。

> 当前骨架默认使用清晰标记的 Mock 数据。接入 QuantDash 后，将 `.env` 中的 `DATA_MODE` 改为 `quantdash`，并在 `backend/quantdash_client.py` 完成字段映射。

## 技术栈

- 前端：React、TypeScript、Vite、Ant Design、ECharts
- 后端：FastAPI、Pydantic、pandas、scikit-learn
- 数据：QuantDash（预留适配层）+ 本地缓存

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

## 目录分工

- `frontend/`：看盘和模型交互页面
- `backend/`：接口、数据适配、特征和模型边界
- `config/`：沪深 300 股票池快照
- `scripts/`：数据刷新、训练和本地启动脚本
- `data/cache/`：运行时缓存，不提交到 Git

## 协作约定

四位成员分别使用 `feat/frontend-dashboard`、`feat/data-quantdash`、`feat/factor-model`、`feat/backend-integration` 分支，通过 Pull Request 合并到 `main`。禁止直接向 `main` 推送功能代码。

本项目只用于技术演示，不构成投资建议。

