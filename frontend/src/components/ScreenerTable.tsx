import { Input, Select, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import type { StockSnapshot } from '../types'

export function ScreenerTable({ stocks, onSelect }: { stocks: StockSnapshot[]; onSelect: (symbol: string) => void }) {
  const [keyword, setKeyword] = useState('')
  const [industry, setIndustry] = useState('all')
  const industries = [...new Set(stocks.map(x => x.industry))]
  const rows = useMemo(() => stocks.filter(x => (industry === 'all' || x.industry === industry) && `${x.name}${x.symbol}`.toLowerCase().includes(keyword.toLowerCase())), [stocks, keyword, industry])
  const columns: ColumnsType<StockSnapshot> = [
    { title: '股票', render: (_, x) => <button className="stock-link" onClick={() => onSelect(x.symbol)}><b>{x.name}</b><small>{x.symbol}</small></button> },
    { title: '行业', dataIndex: 'industry', render: value => <Tag>{value}</Tag> },
    { title: '现价', dataIndex: 'price', sorter: (a, b) => a.price - b.price, render: value => value.toFixed(2) },
    { title: '涨跌幅', dataIndex: 'change_pct', sorter: (a, b) => a.change_pct - b.change_pct, render: value => <span className={value >= 0 ? 'positive' : 'negative'}>{value >= 0 ? '+' : ''}{value.toFixed(2)}%</span> },
    { title: 'PE(TTM)', dataIndex: 'pe_ttm', sorter: (a, b) => (a.pe_ttm ?? 0) - (b.pe_ttm ?? 0) },
    { title: 'PB', dataIndex: 'pb' },
    { title: '换手率', dataIndex: 'turnover_rate', render: value => `${value?.toFixed(2)}%` },
  ]
  return <><Space wrap style={{ marginBottom: 16 }}><Input.Search placeholder="搜索股票或代码" value={keyword} onChange={e => setKeyword(e.target.value)} allowClear /><Select value={industry} onChange={setIndustry} style={{ width: 150 }} options={[{ value: 'all', label: '全部行业' }, ...industries.map(x => ({ value: x, label: x }))]} /></Space><Table rowKey="symbol" columns={columns} dataSource={rows} pagination={{ pageSize: 6, showSizeChanger: false }} scroll={{ x: 760 }} /></>
}

