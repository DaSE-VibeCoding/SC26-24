# AlphaScope 智选 — 项目上下文（成员 A · 前端）

> 最后更新：2026-07-17
> 状态：Phase 0 调查完成，AWAITING_REVIEW

---

## 1. 产品目标

AlphaScope 是一个面向研究与演示的沪深 300 看盘及机器学习选股网页。用户可以：

1. 查看沪深 300 市场概览（涨跌分布、中位涨跌幅、站上 MA20 比例等）；
2. 使用技术指标筛选股票；
3. 选择 4–10 个因子和一种机器学习模型；
4. 查看未来 20 日相对表现的模型潜力榜；
5. 查看模型指标、风险信息和个股详情。

**产品边界**：不执行真实交易，不提供投资建议，不承诺收益。

---

## 2. 三天版范围

| 模块 | P0 |
|---|---|
| 沪深 300 股票池 | 使用带日期版本的 300 只成分股清单 |
| QuantDash 数据 | 获取约 820 个交易日的前复权日 K 和最新行情 |
| 基础看盘 | 涨跌家数、中位涨跌幅、站上 MA20 比例、全量行情表 |
| 条件筛选 | 名称/代码、涨跌幅、20 日收益、均线状态、RSI、风险、量比 |
| 因子选项 | 12 个候选因子，可勾选 4–10 个 |
| 机器学习模型 | 岭回归、随机森林、直方图梯度提升三选一 |
| 预测排名 | 未来 20 日相对收益预测值和 0–100 潜力分，展示 Top 10 |
| 模型验证 | 时间切分、测试集 Rank IC、Top 10 命中率、模型状态 (valid/weak/invalid) |
| 个股详情 | K 线、MA20/MA60、因子百分位、预测结果和风险提示 |
| 缓存降级 | QuantDash 不可用时仍可使用最近成功数据和模型结果 |

---

## 3. 成员 A 的职责

### 负责

- 前端单页整体布局（App shell、Header、双 Tab）
- 顶部数据状态区域
- 市场概览卡片（MarketSummary）
- "模型潜力榜" Tab（ModelPanel + PotentialTable）
- "沪深 300 看盘" Tab（ScreenerFilters + ScreenerTable）
- 模型选择控件（单选下拉）
- 因子分组多选控件（4–10 约束、默认 8 因子）
- 行情筛选控件（搜索、涨跌幅、趋势、RSI、波动率、量比）
- 页面主题与 Design Tokens（Ant Design ConfigProvider）
- Loading、Empty、Error、Weak、Invalid 等页面状态
- Mock 数据驱动的前端独立开发
- 前端 TypeScript 类型定义（公共类型）
- 格式化函数和组件测试
- 前端 README
- Agent 规划、执行和记忆文档

### 不负责

- K 线图内部实现（D 负责）
- 个股详情抽屉内部实现（D 负责）
- 真实 API 联调（D 负责）
- 集成测试和 E2E（D 负责）
- 启动脚本（D 负责）
- 后端模型公式、因子计算、标签计算、机器学习训练逻辑
- QuantDash 数据逻辑
- FastAPI 后端实现
- 成分清单管理
- 数据缓存策略

---

## 4. 技术栈（已确认）

| 层 | 技术 | 版本 |
|---|---|---|
| 前端框架 | React | ^19.1.0 |
| 类型系统 | TypeScript | ^5.8.0 |
| 构建工具 | Vite | ^7.0.0 |
| UI 组件库 | Ant Design | ^6.0.0 |
| 图标 | @ant-design/icons | ^6.0.0 |
| 图表 | Apache ECharts (via echarts-for-react) | ^6.0.0 / ^3.0.2 |
| 日期 | dayjs | ^1.11.13 |
| 测试框架 | Vitest + @testing-library/react | ^3.2.0 / ^16.3.0 |
| 包管理器 | npm | 11.17.0 |
| Node.js | v26.5.0 | — |

**明确不引入**：Redux、MobX、Next.js、GraphQL、WebSocket、SSR、微前端。

---

## 5. 页面结构

```text
/（单路由）
├── 顶部状态栏 (Header)
│   ├── 品牌标识 (AlphaScope)
│   ├── 数据状态标签 (mock/quantdash)
│   ├── 成分清单日期
│   └── 刷新按钮
├── 市场概览卡片 (MarketSummary)
│   ├── 沪深 300 指数涨跌
│   ├── 上涨/下跌家数
│   ├── 成分股中位涨跌幅
│   ├── 站上 MA20 比例
│   └── 高波动股票数
├── 双 Tab 容器 (MainTabs)
│   ├── Tab 1：模型潜力榜
│   │   ├── 模型选择 (Select)
│   │   ├── 因子多选 (Checkbox.Group，分组)
│   │   ├── Top N 滑块
│   │   ├── 训练按钮
│   │   ├── 配置变更提示
│   │   ├── 模型指标摘要 (Rank IC, IC+, Top10 命中率, MAE, 状态)
│   │   ├── 全局因子重要性（valid 时）
│   │   └── Top 10 潜力榜表格 (PotentialTable)
│   └── Tab 2：沪深 300 看盘
│       ├── 筛选控件栏 (ScreenerFilters)
│       └── 300 只股票行情表 (ScreenerTable, 50 行分页)
├── 个股详情抽屉 (StockDrawer, 宽度 760px) — D 负责
│   ├── 入口：A 提供（选中股票状态 + Props 接口）
│   └── 内部：D 实现
└── 全局免责声明 (Disclaimer)
```

---

## 6. 组件边界

### A 负责实现

| 组件 | 文件 | 说明 |
|---|---|---|
| App | `src/App.tsx` | 页面 Shell、状态管理、Tab 切换 |
| Header | 内嵌于 App | 顶栏：品牌、数据状态、刷新 |
| MarketSummary | `src/components/MarketSummary.tsx` | 5 个概览卡片 |
| ModelPanel | `src/components/ModelPanel.tsx` | 模型选择、因子多选、训练按钮、模型指标 |
| PotentialTable | `src/components/PotentialTable.tsx` | Top 10 潜力榜表格 |
| ScreenerFilters | `src/components/ScreenerFilters.tsx` | 行情筛选控件（独立组件） |
| ScreenerTable | `src/components/ScreenerTable.tsx` | 300 只股票行情表、分页、排序 |
| Disclaimer | 内嵌于 App | 固定免责声明 |

### A 提供接口，D 负责实现

| 组件 | 文件 | A 的职责 | D 的职责 |
|---|---|---|---|
| StockDrawer | `src/components/StockDrawer.tsx` | Props 接口、入口（open + onClose + symbol） | 内部实现 |
| KlineChart | `src/components/KlineChart.tsx` | 无 | 完整实现 |

### 公共文件

| 文件 | 所有权 | 说明 |
|---|---|---|
| `src/types.ts` | A 维护 | 公共 TS 类型。D 可扩展但需同步 A |
| `src/api.ts` | A 维护 Mock 模式 | D 接入真实 API 时通过 Adapter 模式 |
| `src/theme.ts` | A 维护 | Design Tokens |
| `src/styles.css` | A 维护 | 全局样式 |

---

## 7. API 列表（已有后端定义）

| 方法 | 路径 | 用途 | 状态 |
|---|---|---|---|
| GET | `/api/status` | 数据、成分清单和模型状态 | 已定义 |
| POST | `/api/data/refresh` | 从 QuantDash 刷新数据 | 已定义 |
| GET | `/api/market` | 市场概览和股票快照 | 已定义，schema 需扩展 |
| GET | `/api/model/options` | 模型与因子选项 | 已定义 |
| POST | `/api/model/train-and-predict` | 训练并预测 | 已定义，response schema 需扩展 |
| GET | `/api/predictions/latest` | 最近成功的预测结果 | 已定义，response schema 需扩展 |
| GET | `/api/stocks/{symbol}` | 个股详情 | 已定义，response schema 需扩展 |

---

## 8. 公共类型（当前状态）

### 已对齐（前端 types.ts ≈ 后端 schemas.py）

| 类型 | 状态 |
|---|---|
| DataStatus | 对齐 |
| StockSnapshot | 基本对齐（前端多了 industry） |
| MarketSummary | 对齐 |
| MarketResponse | 对齐 |
| FactorOption | 对齐 |
| ModelOption | 对齐 |
| OptionsResponse | 对齐 |
| TrainRequest | 对齐参数，prediction_horizon_days 待确认 |
| PredictionItem | 基本对齐 |
| PredictionResponse | 基本对齐 |
| StockDetail | 基本对齐 |

### 需求文档要求但后端 schema 缺失

| 缺失字段 | 影响 |
|---|---|
| MarketSummary: standing_above_ma20_pct, median_change_pct, high_volatility_count | 市场概览卡片不完整 |
| PredictionItem: risk_level, factor_percentiles, tags | 潜力榜缺少风险信息 |
| PredictionResponse: model_run_id, status (valid/weak/invalid), trained_at, prediction_date, train_period, test_period, metrics | 模型验证状态无法展示 |
| StockDetail: risk info, prediction info | 详情抽屉不完整 |

---

## 9. 页面状态（需求要求）

| 状态 | 表现 | A 负责 |
|---|---|---|
| 无缓存 | 引导配置 API Key | ✅ |
| 数据刷新中 | 保留旧页面，显示进度 | ✅ |
| 训练中 | 保留旧排名，锁定模型配置 | ✅ |
| 训练失败但旧结果保留 | 显示错误 + 旧结果 | ✅ |
| 模型 valid | 绿色"历史测试有效" | ✅ |
| 模型 weak | 黄色提示 + 展开验证指标 | ✅ |
| 模型 invalid | 不显示 Top 10，仍可基础看盘 | ✅ |
| 配置已更改 | "配置已更改，结果尚未更新" | ✅ |
| 未运行模型 | 潜力分显示 `--` | ✅ |
| QuantDash 失败 | 显示缓存时间，不清空页面 | ✅ |
| 股票 K 线缺失 | 图表区域单独报错 | 入口由 A 提供 |
| 空筛选结果 | Empty 状态 | ✅ |
| API 超时/非法响应 | Error 状态 + 保留旧数据 | ✅ |

---

## 10. 视觉 Tokens

### 需求文档定义

| Token | 值 |
|---|---|
| 页面背景 | `#08111F` |
| 卡片背景 | `#0F1B2D` |
| 卡片悬浮 | `#14243A` |
| 主色 | `#6C7CFF` |
| 模型辅助色 | `#21D4B4` |
| A 股上涨 | `#F05B72` + `+` 或 `↑` |
| A 股下跌 | `#2BB673` + `-` 或 `↓` |
| 警告 | `#F5B942` |
| 正文 | `#E8EEF7` |
| 次要文字 | `#8FA1B8` |
| 圆角 | 12px |
| 间距 | 8 / 16 / 24 / 32px |

### 当前 scaffold 偏差

| Token | 需求值 | 当前 scaffold 值 | 需修正 |
|---|---|---|---|
| 主色 | `#6C7CFF` | `#45d6b5` | ✅ |
| 页面背景 | `#08111F` | `#07111f` | ✅ |
| 卡片背景 | `#0F1B2D` | `#0d1a2b` | ✅ |

**注意**：A 股涨跌颜色 `#F05B72`(涨红) / `#2BB673`(跌绿) 与 scaffold 中 `#ff6b6b`(涨红) / `#45d6b5`(跌绿) 方向一致但色值有偏差。需求文档的颜色需在 Phase 1 统一应用。

---

## 11. 禁止事项

- 不显示"必涨""买入""目标价"等措辞
- 不把示例指标伪装成真实模型结果
- 不使用金币、火箭、暴涨箭头、大面积霓虹渐变
- 不引入 Redux、MobX 等大型状态管理库
- 不修改后端代码
- 不修改其他成员文件
- 不使用 `git add .` / `git add -A` / `git commit -am`
- 不向 main 直接推送
- 不执行强制推送
- 不修改 Git 全局配置
- 不自行修改 remote URL

---

## 12. GitHub 协作模式

- **仓库**：`https://github.com/cjkzbl/alphascope-stock-picker.git`
- **基准分支**：`main`
- **成员 A 分支**：`feat/frontend-dashboard`（README 约定）
- **合并方式**：Pull Request → main
- **禁止**：直接向 main 推送功能代码

---

## 13. A 的文件所有权

### 可修改（无需额外授权）

```text
frontend/src/          (所有 .ts, .tsx, .css 文件)
frontend/tests/        (待创建)
frontend/public/       (待创建)
frontend/README.md     (待创建)
docs/agent/            (Agent 文档)
```

### 需用户确认后修改

```text
frontend/package.json
frontend/package-lock.json
frontend/vite.config.ts
frontend/tsconfig.json
frontend/tsconfig.app.json
frontend/tsconfig.node.json
.gitignore
README.md
```

### 禁止修改

```text
backend/               (所有文件)
config/                (成分清单)
scripts/               (启动脚本)
data/cache/            (缓存数据)
requirements.txt
.env.example
.github/
```

---

## 14. 当前风险

| 风险 | 级别 | 说明 |
|---|---|---|
| Git local 身份未配置 | P0 | 需要设置 user.name 和 user.email |
| 因子定义不一致 | P0 | 需求文档 12 因子 vs 后端 12 因子 — 完全不同 |
| API Schema 不完整 | P0 | 后端 schema 缺少模型指标、状态等关键字段 |
| 设计 Token 偏差 | P1 | scaffold 颜色与需求文档不一致 |
| node_modules 未安装 | P1 | 需 `npm install` 后才能开发 |
| 成分清单为空 | P2 | `config/csi300_constituents.csv` 只有表头 |

---

## 15. 待确认事项

| # | 事项 | 优先级 | 负责确认 |
|---|---|---|---|
| 1 | GitHub 仓库是否正确（cjkzbl/alphascope-stock-picker） | P0 | 用户 |
| 2 | Git local user.name 和 user.email | P0 | 用户 |
| 3 | 成员 A 的开发分支名称（README 约定：`feat/frontend-dashboard`） | P0 | 用户 |
| 4 | 因子列表以哪个为准（需求文档 vs 后端 features.py） | P0 | 团队（C 成员） |
| 5 | API Response Schema 扩展由谁负责（A 提需求，C/D 实现？） | P0 | 团队 |
| 6 | api.ts 的 Mock/Real Adapter 模式归属 | P1 | 团队 (A+D) |
| 7 | StockDrawer Props 接口约定 | P1 | A+D |
| 8 | 设计 Token 颜色最终确认 | P1 | 用户/团队 |
| 9 | 默认模型是 hist_gradient_boosting（需求）还是 random_forest（scaffold） | P1 | 团队 (C) |
```

---

## 16. 验收标准

- 1440×900 无整页横向滚动
- Mock 模式不依赖后端即可启动
- 三个模型都可选择并显示对应结果
- valid/weak/invalid 三种状态正确展示
- 配置变更与结果更新状态正确区分
- 涨跌颜色始终配合正负号或箭头
- 全局显示免责声明
- 构建成功、测试通过
- Commit 只包含 A 负责文件
