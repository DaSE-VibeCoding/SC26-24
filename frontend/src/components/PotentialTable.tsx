import { Progress, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { PredictionItem } from '../types'
import {
  changeClass,
  formatChangePct,
  formatPotentialScore,
  RISK_COLORS,
  RISK_LABELS,
} from '../utils/format'

interface Props {
  rows: PredictionItem[]
  onSelect: (symbol: string) => void
}

export function PotentialTable({ rows, onSelect }: Props) {
  const columns: ColumnsType<PredictionItem> = [
    {
      title: '#',
      dataIndex: 'rank',
      width: 48,
      render: (v: number) => <span style={{ color: '#8FA1B8' }}>{v}</span>,
    },
    {
      title: '股票',
      key: 'stock',
      width: 160,
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
      title: '潜力分',
      dataIndex: 'potential_score',
      width: 140,
      sorter: (a, b) => a.potential_score - b.potential_score,
      defaultSortOrder: 'descend',
      render: (v: number) => (
        <Progress
          percent={v}
          size="small"
          strokeColor="#6C7CFF"
          format={() => formatPotentialScore(v)}
        />
      ),
    },
    {
      title: '预测相对收益',
      dataIndex: 'predicted_excess_20',
      width: 130,
      sorter: (a, b) => a.predicted_excess_20 - b.predicted_excess_20,
      render: (v: number) => (
        <span className={changeClass(v)}>{formatChangePct(v)}</span>
      ),
    },
    {
      title: '风险',
      dataIndex: 'risk_level',
      width: 68,
      render: (v: string) => (
        <Tag color={RISK_COLORS[v as keyof typeof RISK_COLORS]}>
          {RISK_LABELS[v as keyof typeof RISK_LABELS]}
        </Tag>
      ),
    },
    {
      title: '因子画像',
      dataIndex: 'tags',
      responsive: ['lg'],
      render: (tags: string[]) => (
        <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tags.map((t) => (
            <Tag key={t} color="cyan">
              {t}
            </Tag>
          ))}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 72,
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
      dataSource={rows}
      pagination={false}
      scroll={{ x: 900 }}
      locale={{ emptyText: '暂无预测结果' }}
    />
  )
}
