import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface FactorProfileProps {
  values: Record<string, number>
}

interface FactorGroup {
  name: string
  shortName: string
  keys: string[]
  color: string
  risk?: boolean
}

const FACTOR_LABELS: Record<string, string> = {
  ret_5: '5 日动量',
  ret_20: '20 日动量',
  ret_60: '60 日动量',
  close_ma20_gap: '收盘 / MA20 偏离',
  ma20_ma60_gap: 'MA20 / MA60 偏离',
  ma20_slope_5: 'MA20 斜率',
  rsi_14: 'RSI(14)',
  vol_20: '20 日波动率',
  maxdd_60: '60 日最大回撤',
  volume_ratio_5_20: '量比 (5/20)',
  price_volume_5: '价量联动',
  distance_high_60: '距 60 日高点',
}

const GROUPS: FactorGroup[] = [
  { name: '动量', shortName: '动量', keys: ['ret_5', 'ret_20', 'ret_60'], color: '#007AFF' },
  { name: '趋势', shortName: '趋势', keys: ['close_ma20_gap', 'ma20_ma60_gap', 'ma20_slope_5'], color: '#32ADE6' },
  { name: '超买超卖', shortName: 'RSI', keys: ['rsi_14'], color: '#AF52DE' },
  { name: '风险暴露', shortName: '风险', keys: ['vol_20', 'maxdd_60'], color: '#FF3B30', risk: true },
  { name: '量价', shortName: '量价', keys: ['volume_ratio_5_20', 'price_volume_5'], color: '#30B0C7' },
  { name: '价格位置', shortName: '位置', keys: ['distance_high_60'], color: '#FF9F0A' },
]

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function percentileRank(value: number): string {
  const rank = Math.max(1, Math.round((1 - clamp(value)) * 100))
  return `前 ${rank}%`
}

function positionLabel(value: number): string {
  const pct = clamp(value)
  if (pct >= 0.8) return '显著高位'
  if (pct >= 0.6) return '偏高'
  if (pct >= 0.4) return '中位附近'
  if (pct >= 0.2) return '偏低'
  return '显著低位'
}

function riskLabel(value: number): string {
  const pct = clamp(value)
  if (pct >= 0.7) return '风险暴露偏高'
  if (pct >= 0.4) return '风险暴露中等'
  return '风险暴露偏低'
}

function factorColor(value: number, isRisk: boolean): string {
  const pct = clamp(value)
  if (isRisk) {
    if (pct >= 0.7) return '#FF3B30'
    if (pct >= 0.4) return '#FF9F0A'
    return '#34C759'
  }
  if (pct >= 0.75) return '#007AFF'
  if (pct >= 0.5) return '#32ADE6'
  return '#8E8E93'
}

export function FactorProfile({ values }: FactorProfileProps) {
  const entries = useMemo(
    () => Object.entries(values)
      .filter(([, value]) => Number.isFinite(value))
      .map(([key, value]) => ({ key, value: clamp(value) })),
    [values],
  )

  const groups = useMemo(() => GROUPS.map((group) => {
    const items = group.keys
      .map((key) => entries.find((entry) => entry.key === key))
      .filter((entry): entry is { key: string; value: number } => entry != null)
      .sort((a, b) => b.value - a.value)

    return { ...group, items, score: average(items.map((item) => item.value)) }
  }).filter((group) => group.items.length > 0), [entries])

  const strongestSignals = useMemo(
    () => entries
      .filter((entry) => !GROUPS.find((group) => group.risk)?.keys.includes(entry.key))
      .sort((a, b) => b.value - a.value)
      .slice(0, 2),
    [entries],
  )

  const riskScore = groups.find((group) => group.risk)?.score

  const radarOption = useMemo(() => ({
    animationDuration: 400,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: 'rgba(60,60,67,0.14)',
      textStyle: { color: '#1D1D1F', fontSize: 11 },
      formatter: () => groups
        .map((group) => `${group.name}　${Math.round(group.score * 100)}%`)
        .join('<br/>'),
    },
    radar: {
      center: ['50%', '52%'],
      radius: '65%',
      splitNumber: 4,
      indicator: groups.map((group) => ({ name: group.shortName, max: 100 })),
      axisName: { color: '#6E6E73', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(60,60,67,0.16)' } },
      splitLine: { lineStyle: { color: 'rgba(60,60,67,0.12)' } },
      splitArea: {
        areaStyle: {
          color: ['rgba(0,122,255,0.018)', 'rgba(0,122,255,0.04)'],
        },
      },
    },
    series: [{
      type: 'radar',
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#007AFF', width: 1.6 },
      itemStyle: { color: '#0A84FF', borderColor: '#FFFFFF', borderWidth: 1 },
      areaStyle: { color: 'rgba(0,122,255,0.18)' },
      data: [{ value: groups.map((group) => Math.round(group.score * 100)) }],
    }],
    aria: {
      enabled: true,
      decal: { show: false },
      description: '因子分组截面百分位雷达图',
    },
  }), [groups])

  if (!entries.length) {
    return <div className="factor-profile-empty">暂无因子截面数据</div>
  }

  return (
    <section className="factor-profile" aria-labelledby="factor-profile-title">
      <header className="factor-profile-heading">
        <div>
          <span className="eyebrow">CROSS-SECTION PROFILE</span>
          <h3 id="factor-profile-title">因子截面画像</h3>
        </div>
        <span className="factor-profile-date-tag">当日截面</span>
      </header>
      <p className="factor-profile-explainer">
        百分位表示该股票在沪深 300 成分股中的相对位置，不直接等于预期收益；风险类因子越高，代表风险暴露越高。
      </p>

      <div className="factor-profile-overview">
        <div className="factor-radar-card">
          <div className="factor-card-caption">
            <strong>分组轮廓</strong>
            <span>外圈代表截面位置更高</span>
          </div>
          <ReactECharts option={radarOption} style={{ height: 238 }} notMerge lazyUpdate />
        </div>

        <aside className="factor-highlights" aria-label="关键因子读数">
          <div className="factor-card-caption">
            <strong>关键读数</strong>
            <span>优先关注显著偏离中位的信号</span>
          </div>
          {strongestSignals.map((signal, index) => {
            const group = GROUPS.find((item) => item.keys.includes(signal.key))
            return (
              <div className="factor-highlight" key={signal.key}>
                <span className="factor-highlight-index">0{index + 1}</span>
                <div>
                  <small>{group?.name ?? '其他'}</small>
                  <strong>{FACTOR_LABELS[signal.key] ?? signal.key}</strong>
                  <span>{positionLabel(signal.value)} · {percentileRank(signal.value)}</span>
                </div>
                <b>{Math.round(signal.value * 100)}</b>
              </div>
            )
          })}
          {riskScore != null && (
            <div className={`factor-risk-summary factor-risk-summary--${riskScore >= 0.7 ? 'high' : riskScore >= 0.4 ? 'mid' : 'low'}`}>
              <div>
                <small>综合风险百分位</small>
                <strong>{riskLabel(riskScore)}</strong>
              </div>
              <b>{Math.round(riskScore * 100)}</b>
            </div>
          )}
        </aside>
      </div>

      <div className="factor-detail-heading">
        <div>
          <strong>详细因子位置</strong>
          <span>中线为全体成分股中位水平</span>
        </div>
        <div className="factor-scale" aria-hidden="true">
          <span>低位 0</span><span>中位 50</span><span>高位 100</span>
        </div>
      </div>

      <div className="factor-groups">
        {groups.map((group) => (
          <section className="factor-group" key={group.name}>
            <div className="factor-group-heading">
              <span><i style={{ background: group.color }} />{group.name}</span>
              <b>{Math.round(group.score * 100)}<small> 分组均值</small></b>
            </div>
            <div className="factor-rows">
              {group.items.map((item) => {
                const color = factorColor(item.value, Boolean(group.risk))
                return (
                  <div className={`factor-row${group.risk ? ' factor-row--risk' : ''}`} key={item.key}>
                    <span className="factor-name">{FACTOR_LABELS[item.key] ?? item.key}</span>
                    <div className="factor-position-track">
                      <span className="factor-position-mid" />
                      <span
                        className="factor-position-fill"
                        style={{ width: `${item.value * 100}%`, background: color }}
                      />
                      <span
                        className="factor-position-dot"
                        style={{ left: `calc(${item.value * 100}% - 4px)`, background: color }}
                      />
                    </div>
                    <div className="factor-position-value">
                      <strong style={{ color }}>{Math.round(item.value * 100)}</strong>
                      <small>{group.risk ? riskLabel(item.value).replace('风险暴露', '') : percentileRank(item.value)}</small>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
