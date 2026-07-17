import { Progress, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { PredictionItem } from '../types'

export function PotentialTable({ rows, onSelect }: { rows: PredictionItem[]; onSelect: (symbol: string) => void }) {
  const columns: ColumnsType<PredictionItem> = [
    { title: '#', dataIndex: 'rank', width: 48 },
    { title: '股票', render: (_, x) => <button className="stock-link" onClick={() => onSelect(x.symbol)}><b>{x.name}</b><small>{x.symbol}</small></button> },
    { title: '行业', dataIndex: 'industry', render: value => <Tag>{value}</Tag> },
    { title: '模型分', dataIndex: 'score', render: value => <Progress percent={value} size="small" strokeColor="#45d6b5" format={() => value.toFixed(1)} /> },
    { title: '预测收益', dataIndex: 'predicted_return_pct', sorter: (a, b) => a.predicted_return_pct - b.predicted_return_pct, render: value => <span className={value >= 0 ? 'positive' : 'negative'}>{value >= 0 ? '+' : ''}{value.toFixed(2)}%</span> },
    { title: '主要信号', dataIndex: 'reasons', responsive: ['lg'], render: values => values.map((x: string) => <Tag color="cyan" key={x}>{x}</Tag>) },
  ]
  return <Table rowKey="symbol" columns={columns} dataSource={rows} pagination={false} scroll={{ x: 780 }} />
}

