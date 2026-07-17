import { Descriptions, Drawer, Spin, Tag } from 'antd'
import type { StockDetail } from '../types'
import { KlineChart } from './KlineChart'

/** 因子 key → 中文标签 */
const FACTOR_LABEL: Record<string, string> = {
  ret_5: '5日动量', ret_20: '20日动量', ret_60: '60日动量',
  close_ma20_gap: '收盘/MA20偏离', ma20_ma60_gap: 'MA20/MA60偏离', ma20_slope_5: 'MA20斜率',
  rsi_14: 'RSI(14)',
  vol_20: '20日波动率', maxdd_60: '60日最大回撤',
  volume_ratio_5_20: '量比(5/20)', price_volume_5: '价量联动',
  distance_high_60: '距60日高点',
}

const FACTOR_GROUP: Record<string, string> = {
  ret_5: '动量', ret_20: '动量', ret_60: '动量',
  close_ma20_gap: '趋势', ma20_ma60_gap: '趋势', ma20_slope_5: '趋势',
  rsi_14: '超买超卖',
  vol_20: '风险', maxdd_60: '风险',
  volume_ratio_5_20: '量价', price_volume_5: '量价',
  distance_high_60: '价格位置',
}

/** 百分位转颜色：越高越暖 */
function percentileColor(v: number): string {
  if (v >= 0.7) return '#F05B72'
  if (v >= 0.5) return '#F5B942'
  if (v >= 0.3) return '#6C7CFF'
  return '#21D4B4'
}

/** 百分位转中文描述 */
function percentileLabel(v: number): string {
  if (v >= 0.8) return '前 20%'
  if (v >= 0.6) return '前 40%'
  if (v >= 0.4) return '中等'
  if (v >= 0.2) return '后 40%'
  return '后 20%'
}

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

            {/* 因子百分位横向条形图 */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, color: '#8FA1B8', marginBottom: 12, fontWeight: 600 }}>
                因子当日截面百分位
                <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 8 }}>
                  （数值越高，因子表现在成分股中越靠前）
                </span>
              </div>

              {/* 按分组展示 */}
              {[...new Set(Object.keys(detail.factor_values).map(k => FACTOR_GROUP[k] ?? '其他'))].map(group => {
                const items = Object.entries(detail.factor_values)
                  .filter(([k]) => (FACTOR_GROUP[k] ?? '其他') === group)
                  .sort((a, b) => b[1] - a[1])

                if (!items.length) return null

                return (
                  <div key={group} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#526b84', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                      {group}
                    </div>
                    {items.map(([key, value]) => {
                      const pct = Math.max(0, Math.min(1, value))
                      const label = FACTOR_LABEL[key] ?? key
                      const barColor = percentileColor(pct)
                      return (
                        <div
                          key={key}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            marginBottom: 5, fontSize: 12,
                          }}
                        >
                          <span style={{ width: 110, color: '#8FA1B8', textAlign: 'right', flexShrink: 0 }}>
                            {label}
                          </span>
                          <div style={{ flex: 1, height: 16, background: '#14243A', borderRadius: 4, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${pct * 100}%`, height: '100%',
                                background: barColor, borderRadius: 4,
                                transition: 'width 0.3s',
                                minWidth: pct > 0 ? 2 : 0,
                              }}
                            />
                          </div>
                          <span style={{ width: 48, color: barColor, fontWeight: 600, flexShrink: 0 }}>
                            {(pct * 100).toFixed(0)}%
                          </span>
                          <Tag style={{ margin: 0, fontSize: 10, width: 52, textAlign: 'center' }}>
                            {percentileLabel(pct)}
                          </Tag>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* 因子画像摘要 */}
              {(() => {
                const entries = Object.entries(detail.factor_values).filter(([, v]) => !isNaN(v))
                const sorted = [...entries].sort((a, b) => b[1] - a[1])
                const top2 = sorted.slice(0, 2)
                const riskKeys = ['vol_20', 'maxdd_60']
                const worstRisk = entries
                  .filter(([k]) => riskKeys.includes(k))
                  .sort((a, b) => b[1] - a[1])[0]

                return (
                  <div style={{
                    marginTop: 16, padding: '10px 14px',
                    background: 'rgba(108,124,255,0.06)', borderRadius: 8,
                    border: '1px solid rgba(108,124,255,0.12)',
                    fontSize: 12, color: '#8FA1B8', lineHeight: 1.8,
                  }}>
                    {top2.map(([k, v]) => (
                      <div key={k}>
                        <span style={{ color: '#E8EEF7' }}>{FACTOR_LABEL[k] ?? k}</span>
                        {' '}位于成分股{' '}
                        <span style={{ color: percentileColor(v), fontWeight: 600 }}>前 {(100 - v * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                    {worstRisk && (
                      <div>
                        <span style={{ color: '#E8EEF7' }}>{FACTOR_LABEL[worstRisk[0]] ?? worstRisk[0]}</span>
                        {' '}处于{' '}
                        <span style={{ color: percentileColor(worstRisk[1]), fontWeight: 600 }}>
                          {worstRisk[1] >= 0.7 ? '较高' : worstRisk[1] >= 0.4 ? '中等' : '较低'}
                        </span>
                        {' '}水平
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </>
        )}
      </Spin>
    </Drawer>
  )
}
