import ReactECharts from 'echarts-for-react'
import type { StockDetail } from '../types'

export function KlineChart({ detail }: { detail: StockDetail }) {
  const option = {
    backgroundColor: 'transparent',
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    grid: { left: 52, right: 18, top: 20, bottom: 45 },
    xAxis: { type: 'category', data: detail.bars.map(x => x.trade_date), boundaryGap: true, axisLine: { lineStyle: { color: '#40546f' } } },
    yAxis: { scale: true, splitLine: { lineStyle: { color: '#1d3048' } } },
    dataZoom: [{ type: 'inside', start: 35, end: 100 }, { type: 'slider', start: 35, end: 100, height: 18, bottom: 5 }],
    series: [{ name: detail.snapshot.name, type: 'candlestick', data: detail.bars.map(x => [x.open, x.close, x.low, x.high]), itemStyle: { color: '#ff6b6b', color0: '#45d6b5', borderColor: '#ff6b6b', borderColor0: '#45d6b5' } }],
  }
  return <ReactECharts option={option} style={{ height: 360 }} />
}

