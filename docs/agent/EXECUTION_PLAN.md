# AlphaScope 智选 — 执行计划（成员 A · 前端）

> 创建日期：2026-07-17
> 当前阶段：Phase 0 — AWAITING_REVIEW

---

## Phase 概览

| Phase | 名称 | 状态 |
|---|---|---|
| Phase 0 | 仓库、Git 与需求调查 | AWAITING_REVIEW |
| Phase 1 | 前端骨架与 Mock 契约 | NOT_STARTED |
| Phase 2 | 沪深 300 看盘 | NOT_STARTED |
| Phase 3 | 模型潜力榜 | NOT_STARTED |
| Phase 4 | 与 D 的组件及 API 集成 | NOT_STARTED |
| Phase 5 | 测试、PR 与收尾 | NOT_STARTED |

---

## Phase 0：仓库、Git 与需求调查

### 目标

- 确认正确目录和 GitHub 仓库
- 确认当前分支与工作区状态
- 检查 Git local 身份
- 阅读需求文档和现有代码
- 明确 A 与 D 的边界
- 确认 A 可修改文件
- 建立 Agent 文档

### 输入

- 需求文档 `智能选股系统_最终需求文档.md`
- 现有 Git 仓库 `cjkzbl/alphascope-stock-picker`
- 现有 scaffold 代码

### 输出

- `docs/agent/PROJECT_CONTEXT.md` ✅
- `docs/agent/EXECUTION_PLAN.md`（本文档）✅
- `docs/agent/MEMORY.md` ✅
- 完整调查结论与计划

### Gate

- [ ] 用户审核调查结论
- [ ] 用户确认 Git 身份
- [ ] 用户确认开发分支名称
- [ ] 用户确认文件所有权边界
- [ ] 用户确认前端架构
- [ ] 团队确认因子列表和 API Schema

### 阻塞项

| # | 事项 | 状态 |
|---|---|---|
| 1 | Git local 身份未设置 | 待用户提供 |
| 2 | 因子定义待团队统一 | 待 C 成员确认 |
| 3 | API Schema 扩展待确认 | 待团队确认 |

---

## Phase 1：前端骨架与 Mock 契约

### 目标

- 创建 A 的独立开发分支
- 建立正确的页面总体结构和主题
- 冻结前端 TypeScript 类型
- 建立 Mock 数据
- 实现顶部状态区和双 Tab
- 实现全局免责声明和通用状态组件

### 前置条件

- [ ] Phase 0 Gate 通过
- [ ] Git local 身份已配置
- [ ] 开发分支已创建
- [ ] node_modules 已安装

### 具体任务

1. 切换到 `feat/frontend-dashboard` 分支
2. 修正 `theme.ts` 中的 Design Tokens（对齐需求文档）
3. 修正 `styles.css` 中的颜色变量
4. 扩展 `types.ts`（补充缺失字段）
5. 创建 Mock 数据模块 `src/mock/`
6. 重构 `App.tsx` 页面骨架（顶部状态区、双 Tab、免责声明）
7. 创建通用状态组件（LoadingSkeleton, DataError, EmptyResult）
8. 验证 1440×900 下无横向滚动

### 计划 Commit

```text
docs(agent): confirm frontend implementation plan
feat(frontend): apply financial dashboard theme tokens
feat(frontend): extend shared types and add mock data module
feat(frontend): refactor app shell with status bar and tabs
feat(frontend): add common status components (Loading/Empty/Error)
```

### 允许修改文件

```text
frontend/src/theme.ts
frontend/src/styles.css
frontend/src/types.ts
frontend/src/App.tsx
frontend/src/mock/  (新目录)
frontend/src/components/  (通用状态组件)
docs/agent/
```

### 验收

- [ ] `npm run dev` 在 Mock 模式下正常启动
- [ ] Mock 场景可切换（正常/空/错误）
- [ ] 1440×900 骨架完整无横向滚动
- [ ] 1366×768 可正常使用
- [ ] 涨跌颜色配合正负号
- [ ] 全局免责声明可见
- [ ] `npm run build` 成功
- [ ] Commit 只包含 A 负责文件

---

## Phase 2：沪深 300 看盘

### 目标

- 市场概览卡片（5 个指标）
- 股票搜索和多种筛选控件
- 完整行情表（需求规定的全部列）
- 排序和 50 行分页
- 缺失值和涨跌格式化

### 前置条件

- [ ] Phase 1 完成
- [ ] Mock 数据包含至少 50 只股票（覆盖各行业、涨跌、缺失）

### 具体任务

1. 重构 `MarketSummary.tsx`（5 卡布局，对接扩展后的 MarketSummary 类型）
2. 创建 `ScreenerFilters.tsx`（搜索、涨跌幅范围、趋势状态、RSI 范围、波动率、量比）
3. 重构 `ScreenerTable.tsx`（完整列定义、50 行分页、多列排序）
4. 添加格式化函数 `src/utils/format.ts`（涨跌幅、价格、百分比、风险等级）
5. 编写格式化函数测试

### 计划 Commit

```text
feat(frontend): add market summary cards with 5 indicators
feat(frontend): add stock screener filter controls
feat(frontend): add full-featured market table with pagination
test(frontend): add formatter utility tests
```

### 允许修改文件

```text
frontend/src/components/MarketSummary.tsx
frontend/src/components/ScreenerFilters.tsx  (新建)
frontend/src/components/ScreenerTable.tsx
frontend/src/utils/format.ts  (新建)
frontend/src/types.ts  (按需扩展)
frontend/src/mock/  (扩展 mock 数据)
```

### 验收

- [ ] 5 个概览卡片正确显示（含 mock 数据）
- [ ] 筛选条件组合正确过滤
- [ ] 默认排序：潜力分 desc，无模型时按涨跌幅
- [ ] 50 行分页正常工作
- [ ] 涨跌幅红涨绿跌 + 正负号
- [ ] 缺失值显示 `--`
- [ ] 空筛选结果显示 Empty
- [ ] 筛选状态在切换 Tab 后保留

---

## Phase 3：模型潜力榜

### 目标

- 模型单选下拉框
- 因子分组多选（4–10 约束、默认 8 因子）
- 配置变化 vs 结果更新状态分离
- 模型训练状态（loading + 保留旧结果）
- 模型指标展示（Rank IC、IC+、Top10 命中率、MAE）
- valid/weak/invalid 状态展示
- Top 10 潜力榜表格
- 训练失败保留旧结果

### 前置条件

- [ ] Phase 2 完成
- [ ] 后端 PredictionResponse schema 扩展完成（或前端 Mock 自行补充）
- [ ] 因子列表已冻结（团队确认）

### 具体任务

1. 重构 `ModelPanel.tsx`（模型 Select、分组因子 Checkbox、约束提示、配置变更提示）
2. 创建 `MetricsSummary.tsx`（模型指标 + 状态标签）
3. 重构 `PotentialTable.tsx`（完整列：排名、股票、潜力分、预测相对收益、风险等级、因子画像）
4. 实现状态管理逻辑（当前配置 vs 结果配置、配置变更检测、旧结果保留）
5. 处理 409 TRAINING_IN_PROGRESS
6. 模型指标格式化

### 计划 Commit

```text
feat(frontend): add model configuration panel with factor constraints
feat(frontend): add model metrics summary with valid/weak/invalid states
feat(frontend): add prediction ranking table with risk indicators
fix(frontend): preserve previous model results during retraining
```

### 允许修改文件

```text
frontend/src/components/ModelPanel.tsx
frontend/src/components/MetricsSummary.tsx  (新建)
frontend/src/components/PotentialTable.tsx
frontend/src/App.tsx  (状态管理)
frontend/src/types.ts  (按需扩展)
frontend/src/mock/  (扩展 prediction mock)
```

### 验收

- [ ] 模型下拉三个选项（岭回归、随机森林、直方图梯度提升）
- [ ] 因子按分组显示（动量/趋势/超买超卖/风险/量价/价格位置）
- [ ] 少于 4 或多于 10 因子时训练按钮禁用
- [ ] 默认选中需求文档指定的 8 个因子
- [ ] 修改配置后显示"配置已更改，结果尚未更新"
- [ ] 训练中按钮 loading + 旧结果保留
- [ ] valid 状态绿色 + weak 黄色 + invalid 红色
- [ ] invalid 不显示 Top 10
- [ ] 训练失败保留旧结果并显示错误信息
- [ ] 未运行模型时全量行情表潜力分显示 `--`
- [ ] 潜力分 0–100 范围

---

## Phase 4：与 D 的组件及 API 集成

### 目标

- 接入 D 的 StockDrawer（A 提供入口和状态）
- 对接真实 API Adapter
- 处理 409、超时和非法字段
- 避免覆盖 D 的代码

### 前置条件

- [ ] Phase 2 和 Phase 3 完成
- [ ] D 的 StockDrawer 和 KlineChart 已实现
- [ ] 真实 API 可用或 Mock 模式完备

### 具体任务

1. 在 ScreenerTable 和 PotentialTable 中接入详情入口
2. 管理选中股票状态（symbol, drawerOpen）
3. 实现 API Adapter 模式（Mock ↔ Real 切换）
4. 添加超时和错误处理
5. 确保不覆盖 D 的 StockDrawer.tsx 和 KlineChart.tsx

### 开始前检查

```bash
git fetch origin
git status --short
git diff main...HEAD --stat
```

### 验收

- [ ] 点击表中的股票打开 StockDrawer
- [ ] 关闭抽屉后筛选状态保留
- [ ] Mock/Real 模式可切换
- [ ] API 超时有友好提示
- [ ] 409 状态正确提示"训练进行中"
- [ ] D 的代码未被覆盖

---

## Phase 5：测试、PR 与收尾

### 目标

- 关键组件测试
- 构建验证
- 视觉 QA（分辨率）
- 异常状态完备性检查
- README 和 PR 描述

### 具体任务

1. 编写格式化函数测试
2. 编写关键组件渲染测试
3. 执行 `npm run build`
4. 检查 1440×900、1366×768、1920×1080
5. 验证所有异常状态
6. 编写 `frontend/README.md`
7. 准备 PR 描述

### 验收

- [ ] `npm run build` 成功
- [ ] `npm test` 通过
- [ ] Git 工作区干净（无未提交 A 文件）
- [ ] Commit 边界清楚
- [ ] 没有其他成员文件
- [ ] 没有密钥
- [ ] PR 只包含 A 负责内容

---

## 回滚方式

每个 Commit 独立可回滚：

```bash
git revert <commit-hash>
```

如需回滚整个分支：

```bash
git checkout main
git branch -D feat/frontend-dashboard
```

---

## 测试命令

```bash
# 前端测试
cd frontend && npm test

# 类型检查
cd frontend && npx tsc -b --noEmit

# 构建
cd frontend && npm run build

# 启动开发服务器
cd frontend && npm run dev
```

---

## Git 检查命令（每次提交前）

```bash
git status --short
git diff --stat
git diff --staged --stat
git diff --staged
git log --oneline -3
```
