import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import type { StockSnapshot } from '../types'
import {
  changeClass,
  formatChangePct,
  formatDecimal,
  formatPotentialScore,
  formatPrice,
  MA20_LABELS,
  RISK_COLORS,
  RISK_LABELS,
} from '../utils/format'
import type { ScreenerFilterState } from './ScreenerFilters'
import { EmptyResult } from './common/EmptyResult'

interface Props {
  stocks: StockSnapshot[]
  filters: ScreenerFilterState
  onSelect: (symbol: string) => void
}

export function ScreenerTable({ stocks, filters, onSelect }: Props) {
  const filtered = useMemo(() => {
    return stocks.filter((s) => {
      // 关键词
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase()
        if (!`${s.name}${s.symbol}`.toLowerCase().includes(kw)) return false
      }

      // 涨跌幅范围
      if (s.change_pct < filters.changeRange[0] || s.change_pct > filters.changeRange[1])
        return false

      // 20 日收益范围
      if (
        s.ret_20 != null &&
        (s.ret_20 * 100 < filters.ret20Range[0] || s.ret_20 * 100 > filters.ret20Range[1])
      )
        return false

      // 趋势
      if (filters.trend === 'above_ma20' && s.ma20_status !== 'above') return false
      // Note: bullish/bearish need MA60 data not yet in StockSnapshot; skip for now
      // (will be added when backend provides MA60 status)

      // RSI 范围
      if (
        s.rsi_14 != null &&
        (s.rsi_14 < filters.rsiRange[0] || s.rsi_14 > filters.rsiRange[1])
      )
        return false

      // 波动率
      if (filters.volatility !== 'all' && s.vol_20 != null) {
        if (filters.volatility === 'low' && s.vol_20 > 0.25) return false
        if (filters.volatility === 'medium' && (s.vol_20 < 0.15 || s.vol_20 > 0.4))
          return false
        if (filters.volatility === 'high' && s.vol_20 < 0.35) return false
      }

      // 量比
      if (s.volume_ratio != null && s.volume_ratio < filters.volumeRatioMin) return false

      // 潜力分
      if (
        s.potential_score != null &&
        s.potential_score < filters.potentialScoreMin
      )
        return false

      // 模型筛选
      if (filters.modelFilter === 'positive' && (s.predicted_excess_20 ?? 0) <= 0) return false

      return true
    })
  }, [stocks, filters])

  const columns: ColumnsType<StockSnapshot> = [
    {
      title: '股票',
      key: 'stock',
      width: 160,
      fixed: 'left',
      render: (_, x) => (
        <button className="stock-link" onClick={() => onSelect(x.symbol)}>
          <b>{x.name}</b>
          <small>{x.symbol}</small>
        </button>
      ),
    },
    {
      title: '行业',
      dataIndex: 'industry',
      width: 90,
      render: (v: string) => (
        <Tag style={{ margin: 0 }}>{v}</Tag>
      ),
    },
    {
      title: '最新价',
      dataIndex: 'price',
      width: 90,
      sorter: (a, b) => a.price - b.price,
      render: (v: number) => formatPrice(v),
    },
    {
      title: '当日涨跌',
      dataIndex: 'change_pct',
      width: 100,
      sorter: (a, b) => a.change_pct - b.change_pct,
      render: (v: number) => <span className={changeClass(v)}>{formatChangePct(v)}</span>,
    },
    {
      title: '20日收益',
      dataIndex: 'ret_20',
      width: 100,
      sorter: (a, b) => (a.ret_20 ?? 0) - (b.ret_20 ?? 0),
      render: (v: number | null) => <span className={changeClass(v)}>{formatChangePct(v)}</span>,
    },
    {
      title: 'MA20',
      dataIndex: 'ma20_status',
      width: 72,
      render: (v: string | null) =>
        v ? <Tag>{MA20_LABELS[v as keyof typeof MA20_LABELS]}</Tag> : '--',
    },
    {
      title: 'RSI(14)',
      dataIndex: 'rsi_14',
      width: 80,
      sorter: (a, b) => (a.rsi_14 ?? 0) - (b.rsi_14 ?? 0),
      render: (v: number | null) => formatDecimal(v, 1),
    },
    {
      title: '波动率',
      dataIndex: 'vol_20',
      width: 80,
      sorter: (a, b) => (a.vol_20 ?? 0) - (b.vol_20 ?? 0),
      render: (v: number | null) => (v != null ? `${(v * 100).toFixed(1)}%` : '--'),
    },
    {
      title: '量比',
      dataIndex: 'volume_ratio',
      width: 72,
      sorter: (a, b) => (a.volume_ratio ?? 0) - (b.volume_ratio ?? 0),
      render: (v: number | null) => formatDecimal(v, 2),
    },
    {
      title: '潜力分',
      dataIndex: 'potential_score',
      width: 90,
      sorter: (a, b) => (a.potential_score ?? 0) - (b.potential_score ?? 0),
      render: (v: number | null) => formatPotentialScore(v),
    },
    {
      title: '预测相对收益',
      dataIndex: 'predicted_excess_20',
      width: 120,
      responsive: ['lg'],
      sorter: (a, b) => (a.predicted_excess_20 ?? 0) - (b.predicted_excess_20 ?? 0),
      render: (v: number | null) => (
        <span className={changeClass(v)}>{formatChangePct(v)}</span>
      ),
    },
    {
      title: '风险',
      dataIndex: 'risk_level',
      width: 68,
      render: (v: string | null) =>
        v ? (
          <Tag color={RISK_COLORS[v as keyof typeof RISK_COLORS]}>
            {RISK_LABELS[v as keyof typeof RISK_LABELS]}
          </Tag>
        ) : (
          '--'
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 72,
      fixed: 'right',
      render: (_, x) => (
        <a onClick={() => onSelect(x.symbol)} style={{ cursor: 'pointer' }}>
          详情
        </a>
      ),
    },
  ]

  return (
    <Table
      rowKey="symbol"
      columns={columns}
      dataSource={filtered}
      pagination={{
        pageSize: 50,
        showSizeChanger: true,
        pageSizeOptions: ['20', '50', '100'],
        showTotal: (total) => `共 ${total} 只`,
      }}
      scroll={{ x: 1300 }}
      locale={{ emptyText: <EmptyResult description="没有符合条件的股票" /> }}
    />
  )
}
