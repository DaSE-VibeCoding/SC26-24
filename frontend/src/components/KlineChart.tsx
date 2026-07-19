import ReactECharts from 'echarts-for-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Bar, StockDetail } from '../types'

/** A 股视觉约定：红涨绿跌 */
const UP_COLOR = '#FF3B30'
const DOWN_COLOR = '#34C759'
const MA5_COLOR = '#0A84FF'
const MA20_COLOR = '#FF9F0A'
const MA60_COLOR = '#AF52DE'
const TEXT_COLOR = '#6E6E73'
const GRID_COLOR = 'rgba(60, 60, 67, 0.10)'
const MIN_VISIBLE_BARS = 36

type ChartRange = '3M' | '6M' | '1Y' | '全部'

const RANGE_OPTIONS: Array<{ label: ChartRange; count: number }> = [
  { label: '3M', count: 66 },
  { label: '6M', count: 132 },
  { label: '1Y', count: 252 },
  { label: '全部', count: Number.POSITIVE_INFINITY },
]

function calcMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = []
  let rollingSum = 0

  for (let i = 0; i < data.length; i += 1) {
    rollingSum += data[i]
    if (i >= period) rollingSum -= data[i - period]
    result.push(i < period - 1 ? null : +(rollingSum / period).toFixed(2))
  }
  return result
}

function formatVolume(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(2)} 亿`
  if (value >= 10_000) return `${(value / 10_000).toFixed(1)} 万`
  return value.toLocaleString('zh-CN')
}

function formatDate(value: string): string {
  return value.replaceAll('-', '/')
}

function changeFromPrevious(bars: Bar[], index: number): number | null {
  if (index <= 0 || !bars[index - 1]?.close) return null
  return ((bars[index].close / bars[index - 1].close) - 1) * 100
}

export function KlineChart({ detail }: { detail: StockDetail }) {
  const [range, setRange] = useState<ChartRange>('6M')
  const rangeCount = RANGE_OPTIONS.find((item) => item.label === range)?.count ?? 132

  const visibleBars = useMemo(
    () => detail.bars.slice(Number.isFinite(rangeCount) ? -rangeCount : 0),
    [detail.bars, rangeCount],
  )
  const [activeIndex, setActiveIndex] = useState(Math.max(0, visibleBars.length - 1))

  useEffect(() => {
    setActiveIndex(Math.max(0, visibleBars.length - 1))
  }, [visibleBars])

  const activeBar = visibleBars[activeIndex] ?? visibleBars.at(-1)
  const visibleStartIndex = detail.bars.length - visibleBars.length
  const activeChange = activeBar
    ? changeFromPrevious(detail.bars, visibleStartIndex + activeIndex)
    : null
  const activeTone = (activeChange ?? detail.snapshot.change_pct) >= 0 ? 'positive' : 'negative'

  const option = useMemo(() => {
    const dates = visibleBars.map((bar) => bar.trade_date)
    const allCloses = detail.bars.map((bar) => bar.close)
    const allVolumes = detail.bars.map((bar) => bar.volume)
    const startIndex = detail.bars.length - visibleBars.length
    const ohlc = visibleBars.map((bar) => [bar.open, bar.close, bar.low, bar.high])
    const volumes = visibleBars.map((bar) => ({
      value: bar.volume,
      itemStyle: { color: bar.close >= bar.open ? UP_COLOR : DOWN_COLOR, opacity: 0.72 },
    }))
    const latest = visibleBars.at(-1)
    const latestColor = latest && latest.close >= latest.open ? UP_COLOR : DOWN_COLOR
    const minValueSpan = Math.min(MIN_VISIBLE_BARS, visibleBars.length)

    return {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        showContent: false,
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#8E8E93', type: 'dashed', opacity: 0.7 },
          label: {
            color: '#1D1D1F',
            backgroundColor: 'rgba(255,255,255,0.94)',
            borderColor: 'rgba(60,60,67,0.16)',
            borderWidth: 1,
            borderRadius: 4,
            padding: [4, 7],
            fontSize: 11,
          },
        },
      },
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      grid: [
        { left: 10, right: 58, top: 12, height: '62%' },
        { left: 10, right: 58, top: '72%', height: '15%' },
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          boundaryGap: true,
          axisLine: { lineStyle: { color: GRID_COLOR } },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax',
        },
        {
          type: 'category',
          data: dates,
          boundaryGap: true,
          gridIndex: 1,
          axisLine: { lineStyle: { color: GRID_COLOR } },
          axisTick: { show: false },
          axisLabel: {
            color: TEXT_COLOR,
            fontSize: 10,
            margin: 10,
            hideOverlap: true,
            formatter: (value: string) => value.slice(5),
          },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax',
        },
      ],
      yAxis: [
        {
          scale: true,
          position: 'right',
          splitNumber: 5,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: TEXT_COLOR, fontSize: 10, formatter: (value: number) => value.toFixed(2) },
          splitLine: { lineStyle: { color: GRID_COLOR, type: 'dashed' } },
        },
        {
          scale: true,
          position: 'right',
          gridIndex: 1,
          splitNumber: 2,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: TEXT_COLOR,
            fontSize: 9,
            formatter: (value: number) => value >= 100_000_000
              ? `${(value / 100_000_000).toFixed(1)}亿`
              : `${(value / 10_000).toFixed(0)}万`,
          },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 0,
          end: 100,
          minValueSpan,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
        },
        {
          type: 'slider',
          xAxisIndex: [0, 1],
          start: 0,
          end: 100,
          minValueSpan,
          bottom: 2,
          height: 12,
          showDetail: false,
          showDataShadow: false,
          borderColor: 'transparent',
          backgroundColor: '#E9E9ED',
          fillerColor: 'rgba(0,122,255,0.14)',
          handleSize: 10,
          handleStyle: { color: '#007AFF', borderColor: '#007AFF' },
          moveHandleStyle: { color: '#007AFF', opacity: 0.45 },
        },
      ],
      series: [
        {
          name: '日K',
          type: 'candlestick',
          data: ohlc,
          barMaxWidth: 10,
          itemStyle: {
            color: UP_COLOR,
            color0: DOWN_COLOR,
            borderColor: UP_COLOR,
            borderColor0: DOWN_COLOR,
          },
          markLine: latest ? {
            silent: true,
            symbol: 'none',
            lineStyle: { color: latestColor, type: 'dashed', opacity: 0.55, width: 1 },
            label: {
              show: true,
              position: 'end',
              color: '#FFFFFF',
              backgroundColor: latestColor,
              borderRadius: 3,
              padding: [3, 5],
              fontSize: 10,
              formatter: latest.close.toFixed(2),
            },
            data: [{ yAxis: latest.close }],
          } : undefined,
        },
        {
          name: 'MA5',
          type: 'line',
          data: calcMA(allCloses, 5).slice(startIndex),
          symbol: 'none',
          connectNulls: false,
          lineStyle: { width: 1.15, color: MA5_COLOR, opacity: 0.88 },
        },
        {
          name: 'MA20',
          type: 'line',
          data: calcMA(allCloses, 20).slice(startIndex),
          symbol: 'none',
          connectNulls: false,
          lineStyle: { width: 1.2, color: MA20_COLOR, opacity: 0.9 },
        },
        {
          name: 'MA60',
          type: 'line',
          data: calcMA(allCloses, 60).slice(startIndex),
          symbol: 'none',
          connectNulls: false,
          lineStyle: { width: 1.2, color: MA60_COLOR, opacity: 0.9 },
        },
        {
          name: '成交量',
          type: 'bar',
          data: volumes,
          xAxisIndex: 1,
          yAxisIndex: 1,
          barMaxWidth: 9,
        },
        {
          name: 'MAVOL5',
          type: 'line',
          data: calcMA(allVolumes, 5).slice(startIndex),
          xAxisIndex: 1,
          yAxisIndex: 1,
          symbol: 'none',
          lineStyle: { width: 1, color: MA5_COLOR, opacity: 0.65 },
        },
      ],
    }
  }, [detail.bars, visibleBars])

  const handleAxisPointer = useCallback((event: unknown) => {
    const payload = event as { dataIndex?: number; axesInfo?: Array<{ value?: number }> }
    const nextIndex = payload.dataIndex ?? payload.axesInfo?.[0]?.value
    if (typeof nextIndex === 'number' && nextIndex >= 0 && nextIndex < visibleBars.length) {
      setActiveIndex(nextIndex)
    }
  }, [visibleBars.length])

  const chartEvents = useMemo(() => ({ updateAxisPointer: handleAxisPointer }), [handleAxisPointer])

  if (!detail.bars.length || !activeBar) {
    return <div className="kline-empty">暂无可用 K 线数据</div>
  }

  return (
    <section className="kline-panel" aria-label={`${detail.snapshot.name} K 线图`}>
      <div className="kline-toolbar">
        <div className="kline-ranges" aria-label="图表区间">
          {RANGE_OPTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              className={range === item.label ? 'active' : ''}
              onClick={() => setRange(item.label)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="kline-toolbar-meta">
          <span>日 K</span>
          <span>前复权</span>
          <span className="kline-hint">滚轮缩放 · 最少显示 {MIN_VISIBLE_BARS} 根</span>
        </div>
      </div>

      <div className="kline-readout">
        <div className="kline-price-block">
          <span className="kline-date">{formatDate(activeBar.trade_date)}</span>
          <strong className={activeTone}>{activeBar.close.toFixed(2)}</strong>
          <span className={activeTone}>
            {activeChange == null ? '--' : `${activeChange >= 0 ? '+' : ''}${activeChange.toFixed(2)}%`}
          </span>
        </div>
        <dl>
          <div><dt>开</dt><dd>{activeBar.open.toFixed(2)}</dd></div>
          <div><dt>高</dt><dd className="positive">{activeBar.high.toFixed(2)}</dd></div>
          <div><dt>低</dt><dd className="negative">{activeBar.low.toFixed(2)}</dd></div>
          <div><dt>收</dt><dd>{activeBar.close.toFixed(2)}</dd></div>
          <div><dt>成交量</dt><dd>{formatVolume(activeBar.volume)}</dd></div>
        </dl>
      </div>

      <div className="kline-indicators" aria-label="均线图例">
        <span><i style={{ background: MA5_COLOR }} />MA5</span>
        <span><i style={{ background: MA20_COLOR }} />MA20</span>
        <span><i style={{ background: MA60_COLOR }} />MA60</span>
        <span className="kline-volume-label">VOL</span>
      </div>

      <ReactECharts
        option={option}
        onEvents={chartEvents}
        style={{ height: 430 }}
        notMerge
        lazyUpdate
      />
    </section>
  )
}
