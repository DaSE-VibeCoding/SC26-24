# AlphaScope 智选 — Agent 记忆（成员 A · 前端）

> 用途：记录已确认决策、用户偏好、需求变更、接口变更、Git 决策
> 规则：每次工作前读取；用户反馈后更新；已批准决策不被静默覆盖

---

## 2026-07-17 — Phase 0 调查启动

**来源**：用户指令（成员 A 前端 Agent）
**决策**：进入 Phase 0（仓库、Git 与需求调查），完成调查后停止等待审核
**原因**：用户明确要求先调查再规划，计划未经审核不开始编码
**影响范围**：本轮只读操作 + Agent 文档创建
**替代方案**：无
**状态**：active

---

## 2026-07-17 — 仓库结构确认

**来源**：文件系统调查
**决策**：项目根目录为 `/Users/jm/code/sqxx/alphascope-stock-picker/`，Git 仓库已初始化
**原因**：`sqxx/` 目录包含需求文档和项目子目录 `alphascope-stock-picker/`，后者是 Git 仓库
**影响范围**：所有后续操作基于此路径
**状态**：已确认

---

## 2026-07-17 — Git 环境现状

**来源**：`git config`、`git status`、`git remote` 命令
**决策**：仓库已存在，位于 `main` 分支，工作区干净，远程为 `https://github.com/cjkzbl/alphascope-stock-picker.git`
**发现**：
- 全局 user.name: "Sunsume"
- 全局 user.email: "xiamin21111@163.com"
- local user.name: 未设置
- local user.email: 未设置
- 当前分支：main（跟踪 origin/main）
- 工作区：clean
- 3 个 commit：Initial → scaffold → Merge PR #1
**原因**：需设置 local 级别 Git 身份才能提交
**影响范围**：在所有代码提交前必须配置
**状态**：P0 待确认（需要用户提供 Git 身份信息）

---

## 2026-07-17 — 开发环境

**来源**：`node --version`、`npm --version`、`package.json`
**决策**：使用 npm 作为包管理器，Node v26.5.0，npm 11.17.0
**发现**：
- pnpm 未安装
- yarn 未安装
- node_modules 未安装（需 `npm install`）
- 已有依赖：React 19、Ant Design 6、ECharts 6、Vite 7、TypeScript 5.8、Vitest 3
**原因**：沿用仓库已有 npm lockfile
**状态**：已确认

---

## 2026-07-17 — 现有代码状态

**来源**：阅读所有 `frontend/src/` 和 `backend/` 文件
**决策**：项目由 cjkzbl（项目负责人）通过 AI Agent 完成初始 scaffold
**发现**：
- 所有 43 个文件在同一次 commit 中添加
- 前端有基本骨架：App、MarketSummary、ModelPanel、PotentialTable、ScreenerTable、StockDrawer、KlineChart
- 后端有 FastAPI 骨架 + Mock 数据 + Schema 定义
- 前端可独立运行（Mock 模式，通过 Vite proxy 到后端）
- Mock 数据仅 10 只股票（需求要求 300 只）
- 成分清单为空（只有表头）
**影响范围**：A 在现有 scaffold 基础上重构和扩展，不重新初始化
**状态**：已确认

---

## 2026-07-17 — 因子定义严重不一致

**来源**：对比需求文档 §5.2 与 `backend/features.py`
**决策**：标记为 P0 待确认，不能静默选择一方
**发现**：

| 需求文档因子 | 后端因子 |
|---|---|
| ret_5, ret_20, ret_60（动量） | momentum_20d, momentum_60d, reversal_5d |
| close_ma20_gap, ma20_ma60_gap, ma20_slope_5（趋势） | — |
| rsi_14（超买超卖） | — |
| vol_20, maxdd_60（风险） | volatility_20d, max_drawdown_60d |
| volume_ratio_5_20, price_volume_5（量价） | volume_ratio, turnover_20d |
| distance_high_60（价格位置） | — |
| — | pe_ttm, pb, roe, revenue_growth, profit_growth（基本面） |

两组因子完全不同：需求文档是纯技术因子，后端 scaffold 混入了基本面因子（PE、PB、ROE 等）。
**原因**：需求文档 v3.0 是"最终版"，但 scaffold 由 AI Agent 自动生成时可能使用了不同的因子定义
**影响范围**：前端因子选择 UI 必须与后端 `GET /api/model/options` 返回的因子一致。需 C 成员确认哪个是权威来源
**替代方案**：A 先用后端返回的因子构建 UI，等团队冻结后再调整（但风险是做无用功）
**状态**：P0 待团队确认

---

## 2026-07-17 — API Schema 待扩展

**来源**：对比需求文档 §8.6 与 `backend/schemas.py`
**决策**：前端类型需与后端实际返回对齐，缺失字段标记为待确认
**发现**：
- PredictionResponse 缺少：model_run_id, status (valid/weak/invalid), trained_at, prediction_date, train_period, test_period, metrics (rank_ic, ic_positive_ratio, top10_excess_return, top10_hit_rate, mae)
- PredictionItem 缺少：risk_level, factor_percentiles, tags
- MarketSummary 缺少：standing_above_ma20_pct, median_change_pct, high_volatility_count
- StockDetail 缺少：风险提示、预测信息
**原因**：Scaffold 是 MVP 骨架，与完整需求有差距
**影响范围**：模型验证状态 UI、因子画像、风险提示等需求关键功能的前端实现依赖后端 Schema 扩展
**状态**：P0 待团队确认

---

## 2026-07-17 — 设计 Token 偏差

**来源**：对比需求文档 §7.5 与 `theme.ts`、`styles.css`
**决策**：Phase 1 中统一修正为需求文档定义的 Design Tokens
**发现**：
- 主色：需求 `#6C7CFF`（紫蓝）vs scaffold `#45d6b5`（青绿）
- 涨红：需求 `#F05B72` vs scaffold `#ff6b6b`
- 跌绿：需求 `#2BB673` vs scaffold `#45d6b5`
- 页面背景：需求 `#08111F` vs scaffold `#07111f`
- 卡片背景：需求 `#0F1B2D` vs scaffold `#0d1a2b`
**原因**：Scaffold 使用了不同的配色方案
**状态**：P1，Phase 1 修正

---

## 2026-07-17 — 成员分支命名

**来源**：`README.md` 第 37 行
**决策**：使用 `feat/frontend-dashboard` 作为成员 A 的开发分支
**引用**：
> 四位成员分别使用 `feat/frontend-dashboard`、`feat/data-quantdash`、`feat/factor-model`、`feat/backend-integration` 分支
**状态**：沿用 README 约定，待用户确认

---

## 2026-07-17 — 组件所有权边界

**来源**：分析现有代码和 README 分工
**决策**：
- A 负责：App, MarketSummary, ModelPanel, PotentialTable, ScreenerTable, ScreenerFilters (新建), theme, types, styles, api (Mock 模式), mock data
- D 负责：StockDrawer, KlineChart, 真实 API 对接, E2E, 启动脚本
- A 与 D 共享：types.ts (A 维护), api.ts (A 提供 Mock Adapter 接口), App.tsx (集成点)
**原因**：需求文档 §10 明确分工
**状态**：待用户确认

---

## 2026-07-17 — 用户偏好（待收集）

- 用户对因子 UI 的偏好：尚未讨论
- 用户对颜色方案的偏好：需求文档已指定，待确认是否严格执行
- 用户对移动端的要求：需求文档为"基本可读"
- 用户是否允许修改 package.json：待确认
- 用户是否允许修改 vite.config.ts：待确认

---

## 待确认事项汇总

| # | 事项 | 优先级 | 状态 |
|---|---|---|---|
| 1 | Git local user.name / user.email | P0 | 等待用户提供 |
| 2 | GitHub 仓库确认 | P0 | 等待用户确认 |
| 3 | 开发分支名称 `feat/frontend-dashboard` | P0 | 等待用户确认 |
| 4 | 因子列表权威来源（需求 vs 后端） | P0 | 等待团队 (C) |
| 5 | API Schema 扩展责任方 | P0 | 等待团队 |
| 6 | 设计 Token 颜色确认 | P1 | 等待用户 |
| 7 | api.ts Adapter 模式 | P1 | 等待 A+D 协商 |
| 8 | 默认模型确认 | P1 | 等待团队 (C) |
| 9 | package.json/vite.config 修改授权 | P1 | 等待用户 |
| 10 | 测试覆盖率要求 | P2 | Phase 5 前确认 |

---

## 已否决方案

_（暂无）_

---

## 已提交 Commit

_（暂无，Phase 0 尚未创建提交）_

---

## 已推送状态

_（暂无）_

---

## 会话总结（2026-07-17 Phase 0）

1. 确认项目位于 `/Users/jm/code/sqxx/alphascope-stock-picker/`
2. Git 仓库存在，位于 main 分支，工作区干净
3. 远程：`https://github.com/cjkzbl/alphascope-stock-picker.git`
4. 项目由 cjkzbl 通过 AI Agent 完成初始 scaffold（43 文件）
5. 前端有基本骨架但需要大幅重构以匹配需求
6. 发现因子定义、API Schema、设计 Token 三处与需求文档不一致
7. node_modules 未安装，需 `npm install`
8. Agent 文档已创建：PROJECT_CONTEXT.md、EXECUTION_PLAN.md、MEMORY.md
9. **当前状态：AWAITING_REVIEW，等待用户审核全部计划**
