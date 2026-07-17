import { Descriptions, Drawer, Spin } from 'antd'
import type { StockDetail } from '../types'
import { FactorProfile } from './FactorProfile'
import { KlineChart } from './KlineChart'

export function StockDrawer({ open, loading, detail, onClose }: {
  open: boolean; loading: boolean; detail?: StockDetail; onClose: () => void
}) {
  return (
    <Drawer
      size="large"
      open={open}
      onClose={onClose}
      title={detail ? `${detail.snapshot.name} · ${detail.snapshot.symbol}` : '股票详情'}
    >
      <Spin spinning={loading}>
        {detail && (
          <>
            {/* 基本信息 */}
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="现价">
                {detail.snapshot.price.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="涨跌幅">
                <span className={detail.snapshot.change_pct >= 0 ? 'positive' : 'negative'}>
                  {detail.snapshot.change_pct >= 0 ? '+' : ''}
                  {detail.snapshot.change_pct.toFixed(2)}%
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="PE(TTM)">
                {detail.snapshot.pe_ttm?.toFixed(1) ?? '--'}
              </Descriptions.Item>
              <Descriptions.Item label="PB">
                {detail.snapshot.pb?.toFixed(1) ?? '--'}
              </Descriptions.Item>
            </Descriptions>

            {/* K 线图 */}
            <KlineChart detail={detail} />

            <FactorProfile values={detail.factor_values} />
          </>
        )}
      </Spin>
    </Drawer>
  )
}
