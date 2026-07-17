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

- 用户对因子 UI 的偏好：按需求文档执行
- 用户对颜色方案的偏好：严格执行需求文档 Design Tokens
- 用户对移动端的要求：需求文档为"基本可读"
- 用户允许修改后端 Schema（"API扩展我负责"）
- 后端因子列表以需求文档为准
- 用户使用 conda 环境 `sqxx`，中转代理端口 7897

---

## 待确认事项汇总

| # | 事项 | 优先级 | 状态 |
|---|---|---|---|
| 1 | Git local user.name / user.email | P0 | ✅ Sunsume / xiamin21111@163.com |
| 2 | GitHub 仓库确认 | P0 | ✅ cjkzbl/alphascope-stock-picker |
| 3 | 开发分支名称 `feat/frontend-dashboard` | P0 | ✅ 已创建 |
| 4 | 因子列表权威来源 | P0 | ✅ 按需求文档，已更新后端 features.py |
| 5 | API Schema 扩展责任方 | P0 | ✅ A 负责，已更新 schemas.py |
| 6 | 设计 Token 颜色确认 | P1 | ✅ 按需求文档执行 |
| 7 | api.ts Adapter 模式 | P1 | 待 A+D 协商 |
| 8 | 默认模型确认 | P1 | ✅ hist_gradient_boosting |
| 9 | package.json/vite.config 修改授权 | P1 | 仅 package-lock.json (npm install 更新) |
| 10 | 测试覆盖率要求 | P2 | Phase 5 前确认 |

---

## 已否决方案

_（暂无）_

---

## 已提交 Commit

```
73ebd94 docs(agent): mark Phase 2 and Phase 3 as complete
1729864 feat(frontend): enhance screener filters and add tests
7b8414c feat(frontend): implement professional K-line chart with MA and volume
382c7e7 docs(agent): update execution plan and memory
462b30c feat(frontend): refactor app shell and all business components
5b5249d feat(frontend): add design tokens, shared types, API layer, and format utilities
fad1a1a feat(backend): align API schema and factor definitions with requirements doc
b2a0271 docs(agent): add project context, execution plan, and memory
```

分支：`feat/frontend-dashboard`，领先 `main` 8 commits

---

## 已推送状态

尚未推送（等待用户授权）

---

## Phase 1 完成总结（2026-07-17）

1. Git local 身份已配置：Sunsume / xiamin21111@163.com
2. 开发分支 `feat/frontend-dashboard` 已创建
3. 后端 Schema 与需求文档对齐（12 因子、模型指标、状态枚举等）
4. 前端 Design Tokens 按需求文档全面修正（#6C7CFF 主色等）
5. TypeScript 类型扩展（ModelMetrics, ModelStatus, RiskLevel 等）
6. API 层重构（超时、409、ApiError）
7. 6 卡市场概览、分组因子多选、模型指标摘要已实现
8. 13 列行情表 50 行分页、6 种筛选控件已实现
9. 配置变更检测、旧结果保留逻辑已实现
10. Mock 数据 50 只股票覆盖各场景
11. `npm run build` 和 `npm test` 通过
12. D 的 KlineChart / StockDrawer 未修改
13. 前后端均启动成功，页面可访问 http://127.0.0.1:5173/

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

---

## Phase 2/3 完成总结（2026-07-17）

1. ScreenerFilters 增强：展开式高级筛选面板（涨跌幅/20日收益/RSI/量比/潜力分范围滑块）
2. MetricsSummary 修复：ic_positive_ratio、top10_hit_rate ×100 显示为百分比
3. 新增 18 项 format.ts 单元测试（formatChangePct, formatPrice, formatPotentialScore 等）
4. 新增 11 项组件测试（EmptyResult, DataError, LoadingSkeleton, MetricsSummary 各状态）
5. 构建通过，全部 30 项测试通过（3 个测试文件）
6. Phase 2（沪深300看盘）与 Phase 3（模型潜力榜）标记为 DONE
7. 当前阶段：Phase 4 — 等待 D 的 StockDrawer 组件就绪
8. KlineChart 已重构为专业 K 线图（用户直接授权修改，原属 D）：
   - 双面板：蜡烛图+MA20/MA60（上方55%）+ 成交量柱状图（下方14%）
   - MA20（黄色）/ MA60（紫色）前端实时计算
   - 成交量红涨绿跌着色
   - DataZoom 滚轮+滑块、十字光标、图例切换 MA 线
   - Mock K 线数据改为随机游走，OHLC 逻辑正确
