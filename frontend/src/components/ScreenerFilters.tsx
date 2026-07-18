import { Input, Select, Slider, Space, Switch, Typography } from 'antd'
import { useState } from 'react'

export interface ScreenerFilterState {
  keyword: string
  changeRange: [number, number]
  ret20Range: [number, number]
  trend: string
  rsiRange: [number, number]
  volatility: string
  volumeRatioMin: number
  potentialScoreMin: number
  modelFilter: string
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
  hasModel: boolean
}

const TREND_OPTIONS = [
  { value: 'all', label: '全部趋势' },
  { value: 'above_ma20', label: '站上 MA20' },
  { value: 'bullish', label: '多头 (MA20 > MA60)' },
  { value: 'bearish', label: '空头 (MA20 < MA60)' },
]

const VOL_OPTIONS = [
  { value: 'all', label: '全部波动' },
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
  const [expanded, setExpanded] = useState(false)
  const update = (patch: Partial<ScreenerFilterState>) => onChange({ ...value, ...patch })

  return (
    <div style={{ marginBottom: 16 }}>
      {/* 第一行：常用控件 */}
      <Space wrap size={[8, 8]}>
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
          style={{ width: 180 }}
        />

        <Select
          value={value.volatility}
          onChange={(v) => update({ volatility: v })}
          options={VOL_OPTIONS}
          style={{ width: 140 }}
        />

        {hasModel && (
          <Select
            value={value.modelFilter}
            onChange={(v) => update({ modelFilter: v })}
            options={MODEL_FILTER_OPTIONS}
            style={{ width: 120 }}
          />
        )}

        <Typography.Link
          onClick={() => setExpanded(!expanded)}
          style={{ fontSize: 12, whiteSpace: 'nowrap' }}
        >
          {expanded ? '收起筛选' : '更多筛选 ▾'}
        </Typography.Link>
      </Space>

      {/* 第二行：高级筛选（可展开） */}
      {expanded && (
        <Space wrap size={[16, 12]} style={{ marginTop: 12, width: '100%' }}>
          {/* 当日涨跌幅 */}
          <div style={{ minWidth: 200 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              当日涨跌幅 ({value.changeRange[0]}% ~ {value.changeRange[1]}%)
            </Typography.Text>
            <Slider
              range
              min={-10}
              max={10}
              step={0.5}
              value={value.changeRange}
              onChange={(v) => update({ changeRange: v as [number, number] })}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
          </div>

          {/* 20日收益 */}
          <div style={{ minWidth: 200 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              20日收益 ({value.ret20Range[0]}% ~ {value.ret20Range[1]}%)
            </Typography.Text>
            <Slider
              range
              min={-30}
              max={50}
              step={1}
              value={value.ret20Range}
              onChange={(v) => update({ ret20Range: v as [number, number] })}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
          </div>

          {/* RSI */}
          <div style={{ minWidth: 200 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              RSI(14) ({value.rsiRange[0]} ~ {value.rsiRange[1]})
            </Typography.Text>
            <Slider
              range
              min={0}
              max={100}
              step={1}
              value={value.rsiRange}
              onChange={(v) => update({ rsiRange: v as [number, number] })}
            />
          </div>

          {/* 量比 */}
          <div style={{ minWidth: 150 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              量比 ≥ {value.volumeRatioMin.toFixed(1)}
            </Typography.Text>
            <Slider
              min={0}
              max={3}
              step={0.1}
              value={value.volumeRatioMin}
              onChange={(v) => update({ volumeRatioMin: v as number })}
              tooltip={{ formatter: (v) => `${v}` }}
            />
          </div>

          {/* 潜力分（有模型时） */}
          {hasModel && (
            <div style={{ minWidth: 150 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                潜力分 ≥ {value.potentialScoreMin}
              </Typography.Text>
              <Slider
                min={0}
                max={100}
                step={1}
                value={value.potentialScoreMin}
                onChange={(v) => update({ potentialScoreMin: v as number })}
                tooltip={{ formatter: (v) => `${v}` }}
              />
            </div>
          )}
        </Space>
      )}
    </div>
  )
}
