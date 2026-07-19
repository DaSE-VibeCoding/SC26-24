import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  LineChartOutlined,
  RiseOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { Card } from 'antd'
import type { ReactNode } from 'react'
import type { MarketResponse } from '../types'
import { formatChangePct } from '../utils/format'

interface MetricTileProps {
  label: string
  value: ReactNode
  note: ReactNode
  icon: ReactNode
  tone?: 'up' | 'down' | 'warning' | 'primary'
}

function MetricTile({ label, value, note, icon, tone = 'primary' }: MetricTileProps) {
  return (
    <Card className={`market-tile market-tile--${tone}`}>
      <div className="market-tile-head">
        <span>{label}</span>
        <i>{icon}</i>
      </div>
      <div className="market-tile-value">{value}</div>
      <div className="market-tile-note">{note}</div>
    </Card>
  )
}

export function MarketSummary({ data }: { data: MarketResponse }) {
  const { summary } = data
  const indexTone = (summary.change_pct ?? 0) >= 0 ? 'up' : 'down'
  const medianTone = (summary.median_change_pct ?? 0) >= 0 ? 'positive' : 'negative'
  const breadthTotal = summary.up_count + summary.down_count + summary.flat_count

  return (
    <section className="market-overview" aria-label="市场概览">
      <div className="section-heading">
        <div>
          <span className="eyebrow">MARKET PULSE</span>
          <h2>市场概览</h2>
        </div>
        <span className="muted">成分股共 {breadthTotal} 只</span>
      </div>

      <div className="market-grid">
        <MetricTile
          label="沪深 300"
          value={summary.csi300_level != null ? summary.csi300_level.toFixed(2) : '--'}
          note={
            summary.change_pct != null ? (
              <span className={indexTone === 'up' ? 'positive' : 'negative'}>
                {formatChangePct(summary.change_pct)}
              </span>
            ) : '--'
          }
          icon={<LineChartOutlined />}
          tone={indexTone}
        />
        <MetricTile
          label="上涨家数"
          value={<>{summary.up_count}<small> 家</small></>}
          note={`占比 ${breadthTotal ? ((summary.up_count / breadthTotal) * 100).toFixed(1) : '0.0'}%`}
          icon={<ArrowUpOutlined />}
          tone="up"
        />
        <MetricTile
          label="下跌家数"
          value={<>{summary.down_count}<small> 家</small></>}
          note={`平盘 ${summary.flat_count} 家`}
          icon={<ArrowDownOutlined />}
          tone="down"
        />
        <MetricTile
          label="中位涨跌幅"
          value={
            summary.median_change_pct != null ? (
              <span className={medianTone}>{formatChangePct(summary.median_change_pct)}</span>
            ) : '--'
          }
          note="成分股截面中位数"
          icon={<RiseOutlined />}
          tone={summary.median_change_pct != null && summary.median_change_pct < 0 ? 'down' : 'up'}
        />
        <MetricTile
          label="站上 MA20"
          value={<>{summary.standing_above_ma20_pct?.toFixed(1) ?? '--'}<small>%</small></>}
          note={
            <span className="breadth-track" aria-hidden="true">
              <span style={{ width: `${Math.max(0, Math.min(100, summary.standing_above_ma20_pct ?? 0))}%` }} />
            </span>
          }
          icon={<RiseOutlined />}
        />
        <MetricTile
          label="高波动股票"
          value={<>{summary.high_volatility_count}<small> 只</small></>}
          note="20 日年化波动偏高"
          icon={<ThunderboltOutlined />}
          tone="warning"
        />
      </div>
    </section>
  )
}
