import { Input, Select, Slider, Space } from 'antd'
import type { ModelStatus } from '../types'

export interface ScreenerFilterState {
  keyword: string
  changeRange: [number, number]
  ret20Range: [number, number]
  trend: string       // 'all' | 'bullish' | 'bearish' | 'above_ma20'
  rsiRange: [number, number]
  volatility: string  // 'all' | 'low' | 'medium' | 'high'
  volumeRatioMin: number
  potentialScoreMin: number
  modelFilter: string  // 'all' | 'top10' | 'positive'
}

export const DEFAULT_FILTERS: ScreenerFilterState = {
  keyword: '',
  changeRange: [-10, 10],
  ret20Range: [-30, 50],
  trend: 'all',
  rsiRange: [20, 80],
  volatility: 'all',
  volumeRatioMin: 0,
  potentialScoreMin: 0,
  modelFilter: 'all',
}

interface Props {
  value: ScreenerFilterState
  onChange: (value: ScreenerFilterState) => void
  hasModel: boolean // 是否有已训练的模型
}

const TREND_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'bullish', label: '多头 (close > MA20 > MA60)' },
  { value: 'bearish', label: '空头 (close < MA20 < MA60)' },
  { value: 'above_ma20', label: '站上 MA20' },
]

const VOL_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'low', label: '低波动' },
  { value: 'medium', label: '中波动' },
  { value: 'high', label: '高波动' },
]

const MODEL_FILTER_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'top10', label: 'Top 10' },
  { value: 'positive', label: '预测为正' },
]

export function ScreenerFilters({ value, onChange, hasModel }: Props) {
  const update = (patch: Partial<ScreenerFilterState>) => onChange({ ...value, ...patch })

  return (
    <Space wrap style={{ marginBottom: 16 }}>
      <Input.Search
        placeholder="搜索代码或名称"
        value={value.keyword}
        onChange={(e) => update({ keyword: e.target.value })}
        allowClear
        style={{ width: 180 }}
      />

      <Select
        value={value.trend}
        onChange={(v) => update({ trend: v })}
        options={TREND_OPTIONS}
        style={{ width: 160 }}
      />

      <Select
        value={value.volatility}
        onChange={(v) => update({ volatility: v })}
        options={VOL_OPTIONS}
        style={{ width: 120 }}
      />

      {hasModel && (
        <>
          <Select
            value={value.modelFilter}
            onChange={(v) => update({ modelFilter: v })}
            options={MODEL_FILTER_OPTIONS}
            style={{ width: 120 }}
          />

          <span style={{ fontSize: 12, color: '#8FA1B8', display: 'flex', alignItems: 'center', gap: 6 }}>
            潜力分 ≥ {value.potentialScoreMin}
            <Slider
              min={0}
              max={100}
              value={value.potentialScoreMin}
              onChange={(v) => update({ potentialScoreMin: v as number })}
              style={{ width: 100, margin: 0 }}
              tooltip={{ formatter: (v) => `${v}` }}
            />
          </span>
        </>
      )}
    </Space>
  )
}
