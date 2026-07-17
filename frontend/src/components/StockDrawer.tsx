import { Descriptions, Drawer, Spin, Tag } from 'antd'
import type { StockDetail } from '../types'
import { KlineChart } from './KlineChart'

export function StockDrawer({ open, loading, detail, onClose }: { open: boolean; loading: boolean; detail?: StockDetail; onClose: () => void }) {
  return <Drawer size="large" open={open} onClose={onClose} title={detail ? `${detail.snapshot.name} · ${detail.snapshot.symbol}` : '股票详情'}>
    <Spin spinning={loading}>{detail && <><Descriptions column={2} bordered size="small" items={[
      { key: 'price', label: '现价', children: detail.snapshot.price.toFixed(2) },
      { key: 'change', label: '涨跌幅', children: `${detail.snapshot.change_pct.toFixed(2)}%` },
      { key: 'pe', label: 'PE(TTM)', children: detail.snapshot.pe_ttm },
      { key: 'pb', label: 'PB', children: detail.snapshot.pb },
    ]} /><KlineChart detail={detail} /><div className="factor-tags">{Object.entries(detail.factor_values).map(([key, value]) => <Tag color="cyan" key={key}>{key} {value.toFixed(2)}</Tag>)}</div></>}</Spin>
  </Drawer>
}
