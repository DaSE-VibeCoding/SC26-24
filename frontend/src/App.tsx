import {
  BarChartOutlined,
  DatabaseOutlined,
  GithubOutlined,
  RadarChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  ConfigProvider,
  Layout,
  message,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from './api'
import { MarketSummary } from './components/MarketSummary'
import { MetricsSummary } from './components/MetricsSummary'
import { ModelPanel } from './components/ModelPanel'
import { PotentialTable } from './components/PotentialTable'
import { ScreenerFilters, DEFAULT_FILTERS } from './components/ScreenerFilters'
import type { ScreenerFilterState } from './components/ScreenerFilters'
import { ScreenerTable } from './components/ScreenerTable'
import { StockDrawer } from './components/StockDrawer'
import { LoadingSkeleton } from './components/common/LoadingSkeleton'
import { DataError } from './components/common/DataError'
import { EmptyResult } from './components/common/EmptyResult'
import { theme } from './theme'
import type {
  MarketResponse,
  OptionsResponse,
  PredictionResponse,
  StockDetail,
  TrainRequest,
} from './types'

type ModelKey = TrainRequest['model']
import dayjs from 'dayjs'

// ── 配置 ────────────────────────────────────────────

const DEFAULT_MODEL = 'hist_gradient_boosting'
const DEFAULT_TOP_N = 10

interface LastTrainedConfig {
  model: string
  factors: string[]
}

export default function App() {
  // 服务端数据
  const [market, setMarket] = useState<MarketResponse>()
  const [marketLoading, setMarketLoading] = useState(true)
  const [marketError, setMarketError] = useState<string>()

  const [options, setOptions] = useState<OptionsResponse>()
  const [optionsLoading, setOptionsLoading] = useState(true)

  const [predictions, setPredictions] = useState<PredictionResponse>()
  const [predictionsLoading, setPredictionsLoading] = useState(true)
  const [predictionsError, setPredictionsError] = useState<string>()

  // 模型配置草稿
  const [model, setModel] = useState<ModelKey>(DEFAULT_MODEL)
  const [factors, setFactors] = useState<string[]>([])
  const [topN, setTopN] = useState(DEFAULT_TOP_N)

  // 最近一次成功训练的配置（用于检测变更 + 保留旧结果）
  const [lastTrained, setLastTrained] = useState<LastTrainedConfig>()
  const [training, setTraining] = useState(false)

  // 页面交互
  const [view, setView] = useState<string>('模型潜力榜')
  const [filters, setFilters] = useState<ScreenerFilterState>(DEFAULT_FILTERS)

  // 个股详情（入口）
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState<string>()
  const [detail, setDetail] = useState<StockDetail>()
  const [detailLoading, setDetailLoading] = useState(false)

  // ── 初始数据加载 ──────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function load() {
      setMarketLoading(true)
      setOptionsLoading(true)
      setPredictionsLoading(true)

      try {
        const [marketData, optionData, predictionData] = await Promise.all([
          api.market(),
          api.options(),
          api.latestPredictions(),
        ])
        if (cancelled) return

        setMarket(marketData)
        setMarketError(undefined)

        setOptions(optionData)
        const defaults = optionData.factors
          .filter((f) => f.default_selected)
          .map((f) => f.key)
        setFactors(defaults)

        setPredictions(predictionData)
        setLastTrained({
          model: predictionData.model,
          factors: predictionData.factors,
        })
        // 同步模型选择为最近一次成功的模型
        setModel(predictionData.model as ModelKey)
        setPredictionsError(undefined)
      } catch (error) {
        if (cancelled) return
        const msg = error instanceof ApiError ? error.message : '加载失败'
        setMarketError(msg)
        setPredictionsError(msg)
        message.error(msg)
      } finally {
        if (!cancelled) {
          setMarketLoading(false)
          setOptionsLoading(false)
          setPredictionsLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  // ── 训练 ──────────────────────────────────────────

  const runModel = useCallback(async () => {
    setTraining(true)
    // 先保存当前结果引用，失败时保留
    const previous = predictions
    try {
      const result = await api.trainAndPredict({ model, factors, top_n: topN })
      setPredictions(result)
      setLastTrained({ model, factors })
      setPredictionsError(undefined)
      message.success('评分完成')
    } catch (error) {
      // 保留旧结果
      if (previous) setPredictions(previous)
      const msg = error instanceof ApiError ? error.message : '训练失败'
      setPredictionsError(msg)
      message.error(msg)
    } finally {
      setTraining(false)
    }
  }, [model, factors, topN, predictions])

  // ── 数据刷新 ──────────────────────────────────────

  const refreshData = useCallback(async () => {
    try {
      await api.refreshData()
      // 刷新后重新加载市场数据
      const marketData = await api.market()
      setMarket(marketData)
      setMarketError(undefined)
      message.success('数据已刷新')
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : '刷新失败'
      setMarketError(msg)
      message.error(msg)
    }
  }, [])

  // ── 个股详情 ──────────────────────────────────────

  const openStock = useCallback(async (symbol: string) => {
    setSelectedSymbol(symbol)
    setDrawerOpen(true)
    setDetail(undefined)
    setDetailLoading(true)
    try {
      setDetail(await api.stock(symbol))
    } catch {
      message.error('股票详情加载失败')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  // ── 渲染 ──────────────────────────────────────────

  const hasPredictions = predictions != null && predictions.status !== 'invalid'
  const isMock = market?.status.is_mock
  const dataDate = market?.status.latest_trade_date ?? market?.status.as_of

  return (
    <ConfigProvider theme={theme}>
      <Layout className="app-shell">
        {/* ── Header ──────────────────────────────── */}
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">
              <RadarChartOutlined />
            </span>
            <div>
              <b>AlphaScope</b>
              <small>CSI 300 INTELLIGENCE</small>
            </div>
          </div>

          <Space wrap className="topbar-actions">
            {/* 数据状态 */}
            {isMock && (
              <Tag color="orange" style={{ margin: 0 }}>
                Mock 数据
              </Tag>
            )}
            {market?.status.constituents_date && (
              <Tag color="cyan" style={{ margin: 0 }}>
                成分清单 {market.status.constituents_date}
              </Tag>
            )}
            {dataDate && (
              <span className="muted">
                数据至 {dayjs(dataDate).format('MM-DD')}
              </span>
            )}

            {/* 刷新 */}
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={refreshData}
              disabled={isMock}
            >
              刷新数据
            </Button>

            <Button
              type="text"
              icon={<GithubOutlined />}
              href="https://github.com/cjkzbl/alphascope-stock-picker"
              target="_blank"
            >
              GitHub
            </Button>
          </Space>
        </header>

        {/* ── Main ────────────────────────────────── */}
        <main className="content">
          {/* 紧凑的研究工作台抬头 */}
          <section className="market-intro">
            <div className="market-intro-copy">
              <span className="eyebrow">CSI 300 · QUANT RESEARCH</span>
              <Typography.Title level={1}>沪深 300 多因子研究台</Typography.Title>
              <Typography.Paragraph>
                聚合市场广度、多因子信号与模型验证，在同一工作区完成筛选和个股研判。
              </Typography.Paragraph>
            </div>
            <div className="market-intro-meta" aria-label="研究台能力">
              <span><DatabaseOutlined /> 固定股票池</span>
              <span><BarChartOutlined /> 日线技术因子</span>
              <span className="market-intro-meta--accent">研究结果非投资建议</span>
            </div>
          </section>

          {/* 状态区 */}
          {marketLoading ? (
            <LoadingSkeleton rows={3} />
          ) : marketError && !market ? (
            <DataError message={marketError} onRetry={refreshData} />
          ) : (
            <>
              {/* Mock 提示 */}
              {isMock && (
                <Alert
                  className="mock-alert"
                  type="warning"
                  showIcon
                  title="当前为 Mock 演示数据"
                  description={market?.status.message}
                />
              )}

              {/* 数据刷新失败但旧缓存可用 */}
              {marketError && market && (
                <DataError
                  message={marketError}
                  stale
                  onRetry={refreshData}
                />
              )}

              {/* 市场概览 */}
              {market && <MarketSummary data={market} />}

              {/* 主工作区：模型页双栏、看盘页全宽 */}
              <section className="workspace">
                <div className="workspace-nav">
                  <div>
                    <span className="eyebrow">WORKSPACE</span>
                    <h2>{view === '模型潜力榜' ? '模型候选与验证' : '沪深 300 全景看盘'}</h2>
                    <p>
                      {view === '模型潜力榜'
                        ? '配置模型后查看样本外指标、候选排序和风险画像。'
                        : '使用价格、趋势、波动和量价条件快速缩小研究范围。'}
                    </p>
                  </div>
                  <Segmented
                    value={view}
                    onChange={(value) => setView(String(value))}
                    options={['模型潜力榜', '沪深300看盘']}
                  />
                </div>

                {view === '模型潜力榜' ? (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} xl={7}>
                      {optionsLoading ? (
                        <Card className="workspace-card">
                          <LoadingSkeleton rows={6} />
                        </Card>
                      ) : options ? (
                        <ModelPanel
                          factors={options.factors}
                          models={options.models}
                          selectedFactors={factors}
                          model={model}
                          topN={topN}
                          loading={training}
                          lastTrainedModel={lastTrained?.model}
                          lastTrainedFactors={lastTrained?.factors}
                          onFactors={setFactors}
                          onModel={setModel}
                          onTopN={setTopN}
                          onRun={runModel}
                        />
                      ) : null}
                    </Col>
                    <Col xs={24} xl={17}>
                      <Card
                        className="workspace-card"
                        title="候选排名"
                        extra={predictions ? (
                          <span className="muted">
                            更新于 {dayjs(predictions.trained_at).format('HH:mm:ss')}
                          </span>
                        ) : null}
                      >
                        {predictionsLoading ? (
                          <LoadingSkeleton table />
                        ) : predictions ? (
                          <>
                            {/* 模型指标 */}
                            <MetricsSummary
                              status={predictions.status}
                              metrics={predictions.metrics}
                              trainedAt={predictions.trained_at}
                              predictionDate={predictions.prediction_date}
                              trainPeriod={predictions.train_period}
                              testPeriod={predictions.test_period}
                              modelName={
                                options?.models.find((m) => m.key === predictions.model)
                                  ?.label ?? predictions.model
                              }
                            />

                          {/* 训练失败但旧结果可用的提示 */}
                            {predictionsError && predictions && (
                              <DataError
                                message="训练失败，当前显示最近成功结果"
                                detail={predictionsError}
                                stale
                              />
                            )}

                          {/* Top 10 表格（仅在非 invalid 时显示） */}
                            {hasPredictions ? (
                              <PotentialTable
                                rows={predictions.items}
                                onSelect={openStock}
                              />
                            ) : (
                              <EmptyResult description="模型未通过有效性检查，暂无排名" />
                            )}
                          </>
                        ) : (
                          <EmptyResult description="尚未运行模型，请配置因子并点击训练" />
                        )}
                      </Card>
                    </Col>
                  </Row>
                ) : market ? (
                  <Card className="workspace-card screener-workspace" title="成分股行情">
                    <ScreenerFilters
                      value={filters}
                      onChange={setFilters}
                      hasModel={hasPredictions}
                    />
                    <ScreenerTable
                      stocks={market.stocks}
                      filters={filters}
                      onSelect={openStock}
                    />
                  </Card>
                ) : null}
              </section>
            </>
          )}

          {/* ── 免责声明 ───────────────────────────── */}
          <footer>
            模型仅使用历史行情和技术因子。历史测试结果不代表未来表现；预测相对收益和潜力分不是收益承诺、目标价或交易建议。
            当前版本使用当前沪深 300 成分股，存在幸存者偏差。本页面不构成投资建议。
          </footer>
        </main>

        {/* ── 个股详情抽屉 (D 维护内部实现) ──────── */}
        <StockDrawer
          open={drawerOpen}
          loading={detailLoading}
          detail={detail}
          onClose={() => setDrawerOpen(false)}
        />
      </Layout>
    </ConfigProvider>
  )
}
