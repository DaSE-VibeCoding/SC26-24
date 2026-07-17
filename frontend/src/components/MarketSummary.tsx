import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  PercentageOutlined,
  RiseOutlined,
  StockOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { Card, Col, Row, Statistic } from 'antd'
import type { MarketResponse } from '../types'
import { changeClass, formatChangePct, formatPercent } from '../utils/format'

export function MarketSummary({ data }: { data: MarketResponse }) {
  const { summary } = data
  const indexChangeClass = (summary.change_pct ?? 0) >= 0 ? 'positive' : 'negative'

  return (
    <Row gutter={[14, 14]}>
      {/* 沪深 300 指数 */}
      <Col xs={24} sm={12} md={8} xl={4}>
        <Card>
          <Statistic
            title="沪深 300"
            value={summary.csi300_level ?? '--'}
            precision={summary.csi300_level != null ? 2 : undefined}
            prefix={<StockOutlined />}
            suffix={
              summary.change_pct != null ? (
                <span className={`small ${indexChangeClass}`}>
                  {formatChangePct(summary.change_pct)}
                </span>
              ) : null
            }
          />
        </Card>
      </Col>

      {/* 上涨家数 */}
      <Col xs={8} sm={4} md={4} xl={4}>
        <Card>
          <Statistic
            title="上涨"
            value={summary.up_count}
            valueStyle={{ color: '#F05B72' }}
            prefix={<ArrowUpOutlined />}
            suffix="家"
          />
        </Card>
      </Col>

      {/* 下跌家数 */}
      <Col xs={8} sm={4} md={4} xl={4}>
        <Card>
          <Statistic
            title="下跌"
            value={summary.down_count}
            valueStyle={{ color: '#2BB673' }}
            prefix={<ArrowDownOutlined />}
            suffix="家"
          />
        </Card>
      </Col>

      {/* 中位涨跌幅 */}
      <Col xs={8} sm={4} md={4} xl={4}>
        <Card>
          <Statistic
            title="中位涨跌幅"
            value={summary.median_change_pct ?? '--'}
            precision={summary.median_change_pct != null ? 2 : undefined}
            valueStyle={{
              color:
                summary.median_change_pct != null
                  ? summary.median_change_pct >= 0
                    ? '#F05B72'
                    : '#2BB673'
                  : undefined,
            }}
            prefix={<PercentageOutlined />}
            suffix="%"
          />
        </Card>
      </Col>

      {/* 站上 MA20 比例 */}
      <Col xs={12} sm={6} md={4} xl={4}>
        <Card>
          <Statistic
            title="站上 MA20"
            value={summary.standing_above_ma20_pct ?? '--'}
            precision={summary.standing_above_ma20_pct != null ? 1 : undefined}
            prefix={<RiseOutlined />}
            suffix="%"
          />
        </Card>
      </Col>

      {/* 高波动 */}
      <Col xs={12} sm={6} md={4} xl={4}>
        <Card>
          <Statistic
            title="高波动"
            value={summary.high_volatility_count}
            prefix={<ThunderboltOutlined />}
            suffix="只"
          />
        </Card>
      </Col>
    </Row>
  )
}
