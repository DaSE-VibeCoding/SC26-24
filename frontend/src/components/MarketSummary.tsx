import { ArrowDownOutlined, ArrowUpOutlined, RiseOutlined, StockOutlined } from '@ant-design/icons'
import { Card, Col, Row, Statistic } from 'antd'
import type { MarketResponse } from '../types'

export function MarketSummary({ data }: { data: MarketResponse }) {
  const { summary } = data
  return <Row gutter={[14, 14]}>
    <Col xs={24} md={12} xl={6}><Card><Statistic title="沪深300" value={summary.csi300_level} precision={2} prefix={<StockOutlined />} suffix={<span className="positive small">+{summary.change_pct}%</span>} /></Card></Col>
    <Col xs={8} md={4} xl={6}><Card><Statistic title="上涨" value={summary.up_count} valueStyle={{ color: '#ff6b6b' }} prefix={<ArrowUpOutlined />} /></Card></Col>
    <Col xs={8} md={4} xl={6}><Card><Statistic title="下跌" value={summary.down_count} valueStyle={{ color: '#45d6b5' }} prefix={<ArrowDownOutlined />} /></Card></Col>
    <Col xs={8} md={4} xl={6}><Card><Statistic title="候选范围" value={300} suffix="只" prefix={<RiseOutlined />} /></Card></Col>
  </Row>
}

