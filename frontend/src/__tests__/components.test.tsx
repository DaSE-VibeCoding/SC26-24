import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'

// Ant Design 6 uses useBreakpoint which needs matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})

import { EmptyResult } from '../components/common/EmptyResult'
import { DataError } from '../components/common/DataError'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { MetricsSummary } from '../components/MetricsSummary'
import type { ModelMetrics, ModelStatus } from '../types'

const mockMetrics: ModelMetrics = {
  rank_ic: 0.062,
  ic_positive_ratio: 0.58,
  top10_excess_return: 0.031,
  top10_hit_rate: 0.61,
  mae: 0.042,
}

describe('EmptyResult', () => {
  it('renders default message', () => {
    render(<EmptyResult />)
    expect(screen.getByText('暂无数据')).toBeInTheDocument()
  })

  it('renders custom description', () => {
    render(<EmptyResult description="没有符合条件的股票" />)
    expect(screen.getByText('没有符合条件的股票')).toBeInTheDocument()
  })
})

describe('DataError', () => {
  it('renders error message', () => {
    render(<DataError message="加载失败" />)
    expect(screen.getByText('加载失败')).toBeInTheDocument()
  })

  it('renders stale warning mode', () => {
    render(<DataError message="刷新失败" stale />)
    expect(screen.getByText(/最近缓存数据/)).toBeInTheDocument()
  })

  it('renders retry button when onRetry provided', () => {
    render(<DataError message="错误" onRetry={() => {}} />)
    // Ant Design's button class adds spaces between Chinese chars
    expect(screen.getByText(/重\s*试/)).toBeInTheDocument()
  })
})

describe('LoadingSkeleton', () => {
  it('renders default skeleton', () => {
    const { container } = render(<LoadingSkeleton />)
    expect(container.querySelector('.ant-skeleton')).toBeInTheDocument()
  })

  it('renders table style', () => {
    const { container } = render(<LoadingSkeleton table />)
    expect(container.querySelector('.ant-skeleton')).toBeInTheDocument()
  })
})

describe('MetricsSummary', () => {
  const baseProps = {
    status: 'valid' as ModelStatus,
    metrics: mockMetrics,
    trainedAt: '2026-07-17T16:00:00',
    predictionDate: '2026-07-17',
    trainPeriod: ['2023-01-01', '2026-04-30'] as [string, string],
    testPeriod: ['2026-05-01', '2026-07-15'] as [string, string],
    modelName: '直方图梯度提升',
  }

  it('renders valid status', () => {
    render(<MetricsSummary {...baseProps} />)
    expect(screen.getByText('历史测试有效')).toBeInTheDocument()
    expect(screen.getByText('0.0620')).toBeInTheDocument()
  })

  it('renders weak warning', () => {
    render(<MetricsSummary {...baseProps} status="weak" />)
    expect(screen.getByText('历史表现较弱')).toBeInTheDocument()
    expect(screen.getByText(/模型历史测试表现较弱/)).toBeInTheDocument()
  })

  it('renders invalid warning', () => {
    render(<MetricsSummary {...baseProps} status="invalid" />)
    expect(screen.getByText('结果不可用于排名')).toBeInTheDocument()
    expect(screen.getByText(/模型未通过有效性检查/)).toBeInTheDocument()
  })

  it('displays all metrics', () => {
    render(<MetricsSummary {...baseProps} />)
    expect(screen.getByText('直方图梯度提升')).toBeInTheDocument()
    // Ant Design splits "58.0" and "%" into separate text nodes
    expect(screen.getByText(/58\.0/)).toBeInTheDocument()
    expect(screen.getByText(/61\.0/)).toBeInTheDocument()
    expect(screen.getByText('0.0420')).toBeInTheDocument()
  })
})
