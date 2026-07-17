export interface DataStatus {
  mode: 'mock' | 'quantdash'
  is_mock: boolean
  as_of: string
  message: string
}

export interface StockSnapshot {
  symbol: string
  name: string
  industry: string
  price: number
  change_pct: number
  pe_ttm?: number
  pb?: number
  turnover_rate?: number
  market_cap_billion?: number
}

export interface MarketResponse {
  status: DataStatus
  summary: { csi300_level: number; change_pct: number; up_count: number; down_count: number; flat_count: number }
  stocks: StockSnapshot[]
}

export interface FactorOption { key: string; label: string; group: string; default_selected: boolean }
export interface ModelOption { key: string; label: string; description: string }
export interface OptionsResponse { factors: FactorOption[]; models: ModelOption[] }

export interface PredictionItem extends StockSnapshot {
  rank: number
  score: number
  predicted_return_pct: number
  reasons: string[]
}

export interface PredictionResponse {
  status: DataStatus
  model: string
  factors: string[]
  generated_at: string
  items: PredictionItem[]
  disclaimer: string
}

export interface StockDetail {
  snapshot: StockSnapshot
  bars: Array<{ trade_date: string; open: number; high: number; low: number; close: number; volume: number }>
  factor_values: Record<string, number>
}

