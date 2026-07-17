import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import type { StockDetail } from '../types'

/** A 股涨跌颜色 */
const UP_COLOR = '#F05B72'
const DOWN_COLOR = '#2BB673'
const MA20_COLOR = '#F5B942'
const MA60_COLOR = '#6C7CFF'

/** 计算简单移动平均 */
function calcMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
      continue
    }
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j]
    }
    result.push(+(sum / period).toFixed(2))
  }
  return result
}

export function KlineChart({ detail }: { detail: StockDetail }) {
  const option = useMemo(() => {
    const dates = detail.bars.map((b) => b.trade_date)
    const ohlc = detail.bars.map((b) => [b.open, b.close, b.low, b.high])
    const volumes = detail.bars.map((b, i) => {
      const up = b.close >= b.open
      return [i, b.volume, up ? 1 : -1]
    })

    const closes = detail.bars.map((b) => b.close)
    const ma20 = calcMA(closes, 20)
    const ma60 = calcMA(closes, 60)

    const stockName = detail.snapshot.name

    return {
      backgroundColor: 'transparent',
      animation: true,
      legend: {
        data: ['K线', 'MA20', 'MA60'],
        bottom: 0,
        textStyle: { color: '#8FA1B8', fontSize: 11 },
        itemWidth: 14,
        itemHeight: 6,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        valueFormatter: (value: unknown) =>
          value != null ? (value as number).toFixed(2) : '--',
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
      },
      grid: [
        { left: 60, right: 20, top: 16, height: '55%' },
        { left: 60, right: 20, top: '76%', height: '14%' },
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          boundaryGap: true,
          axisLine: { lineStyle: { color: '#40546f' } },
          axisLabel: { color: '#8FA1B8', fontSize: 10 },
          gridIndex: 0,
        },
        {
          type: 'category',
          data: dates,
          boundaryGap: true,
          axisLine: { lineStyle: { color: '#40546f' } },
          axisLabel: { show: false },
          gridIndex: 1,
        },
      ],
      yAxis: [
        {
          scale: true,
          splitLine: { lineStyle: { color: '#1d3048' } },
          axisLabel: { color: '#8FA1B8', fontSize: 10 },
          gridIndex: 0,
        },
        {
          scale: true,
          splitLine: { show: false },
          axisLabel: { color: '#8FA1B8', fontSize: 10 },
          gridIndex: 1,
        },
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], start: 50, end: 100 },
        {
          type: 'slider',
          xAxisIndex: [0, 1],
          start: 50,
          end: 100,
          bottom: 24,
          height: 16,
          borderColor: '#203249',
          backgroundColor: '#0F1B2D',
          fillerColor: 'rgba(108,124,255,0.12)',
          handleStyle: { color: '#6C7CFF', borderColor: '#6C7CFF' },
          selectedDataBackground: {
            lineStyle: { color: '#6C7CFF', opacity: 0.2 },
            areaStyle: { color: 'rgba(108,124,255,0.08)' },
          },
          dataBackground: {
            lineStyle: { color: '#40546f', opacity: 0.15 },
            areaStyle: { color: 'transparent' },
          },
          textStyle: { color: '#8FA1B8' },
        },
      ],
      series: [
        // ── 蜡烛图 ──
        {
          name: 'K线',
          type: 'candlestick',
          data: ohlc,
          xAxisIndex: 0,
          yAxisIndex: 0,
          itemStyle: {
            color: UP_COLOR,
            color0: DOWN_COLOR,
            borderColor: UP_COLOR,
            borderColor0: DOWN_COLOR,
          },
          markLine: {
            silent: true,
            symbol: 'none',
            label: { fontSize: 10, color: '#8FA1B8' },
            data: [
              { name: '最新收盘', yAxis: closes[closes.length - 1], lineStyle: { color: '#8FA1B8', type: 'dashed' } },
            ],
          },
        },
        // ── MA20 ──
        {
          name: 'MA20',
          type: 'line',
          data: ma20,
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1.5, color: MA20_COLOR, opacity: 0.85 },
        },
        // ── MA60 ──
        {
          name: 'MA60',
          type: 'line',
          data: ma60,
          xAxisIndex: 0,
          yAxisIndex: 0,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 1.5, color: MA60_COLOR, opacity: 0.85 },
        },
        // ── 成交量 ──
        {
          name: '成交量',
          type: 'bar',
          data: volumes,
          xAxisIndex: 1,
          yAxisIndex: 1,
          itemStyle: {
            color: (params: { data: [number, number, number] }) =>
              params.data[2] > 0 ? UP_COLOR : DOWN_COLOR,
          },
        },
      ],
    }
  }, [detail])

  return <ReactECharts option={option} style={{ height: 480 }} notMerge lazyUpdate />
}
