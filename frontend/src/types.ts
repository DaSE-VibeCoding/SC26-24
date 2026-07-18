// ── 枚举 ────────────────────────────────────────────
export type ModelStatus = 'valid' | 'weak' | 'invalid'
export type RiskLevel = 'low' | 'medium' | 'high'
export type DataMode = 'mock' | 'quantdash'
export type Ma20Status = 'above' | 'below'

// ── 数据状态 ────────────────────────────────────────
export interface DataStatus {
  mode: DataMode
  is_mock: boolean
  as_of: string // ISO datetime
  constituents_date: string | null
  latest_trade_date: string | null
  message: string
}

// ── 市场概览 ────────────────────────────────────────
export interface MarketSummary {
  csi300_level: number | null
  change_pct: number | null
  up_count: number
  down_count: number
  flat_count: number
  median_change_pct: number | null
  standing_above_ma20_pct: number | null
  high_volatility_count: number
}

// ── 股票快照 ────────────────────────────────────────
export interface StockSnapshot {
  symbol: string
  name: string
  industry: string
  price: number
  change_pct: number
  ret_20: number | null
  ma20_status: Ma20Status | null
  rsi_14: number | null
  vol_20: number | null
  volume_ratio: number | null
  potential_score: number | null // 0–100，未训练为 null
  predicted_excess_20: number | null
  risk_level: RiskLevel | null
  pe_ttm: number | null
  pb: number | null
  turnover_rate: number | null
  market_cap_billion: number | null
}

export interface MarketResponse {
  status: DataStatus
  summary: MarketSummary
  stocks: StockSnapshot[]
}

// ── 模型选项 ────────────────────────────────────────
export interface FactorOption {
  key: string
  label: string
  group: string
  default_selected: boolean
}

export interface ModelOption {
  key: string
  label: string
  description: string
}

export interface OptionsResponse {
  factors: FactorOption[]
  models: ModelOption[]
}

// ── 训练请求 ────────────────────────────────────────
export interface TrainRequest {
  model: 'ridge' | 'random_forest' | 'hist_gradient_boosting'
  factors: string[]
  top_n: number
}

// ── 模型指标 ────────────────────────────────────────
export interface ModelMetrics {
  rank_ic: number
  ic_positive_ratio: number
  top10_excess_return: number
  top10_hit_rate: number
  mae: number
}

// ── 预测结果 ────────────────────────────────────────
export interface PredictionItem {
  rank: number
  symbol: string
  name: string
  industry: string
  potential_score: number
  predicted_excess_20: number
  risk_level: RiskLevel
  factor_percentiles: Record<string, number>
  tags: string[]
  price: number
  change_pct: number
}

export interface PredictionResponse {
  model_run_id: string
  status: ModelStatus
  model: string
  factors: string[]
  trained_at: string
  prediction_date: string
  train_period: [string, string]
  test_period: [string, string]
  metrics: ModelMetrics
  items: PredictionItem[]
  disclaimer: string
}

// ── 个股详情 ────────────────────────────────────────
export interface Bar {
  trade_date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockDetail {
  snapshot: StockSnapshot
  bars: Bar[]
  factor_values: Record<string, number>
}

// ── API 错误 ────────────────────────────────────────
export interface ApiError {
  status: number
  message: string
  detail?: string
}
