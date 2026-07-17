import type {
  MarketResponse,
  OptionsResponse,
  PredictionResponse,
  StockDetail,
  TrainRequest,
} from './types'

// ── 配置 ────────────────────────────────────────────

const BASE = '' // Vite proxy 转发 /api 到后端
const TIMEOUT_MS = 120_000 // 训练最长 120s

// ── 错误类型 ────────────────────────────────────────

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ── 基础请求 ────────────────────────────────────────

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...init,
    })

    if (!response.ok) {
      if (response.status === 409) {
        throw new ApiError(409, '训练任务正在进行中，请稍后再试')
      }
      let detail = ''
      try {
        const body = await response.json()
        detail = body.detail || body.message || ''
      } catch { /* ignore */ }
      throw new ApiError(response.status, detail || `请求失败 (${response.status})`)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, '请求超时，请检查网络或稍后重试')
    }
    throw new ApiError(0, error instanceof Error ? error.message : '网络异常')
  } finally {
    clearTimeout(timer)
  }
}

// ── API 端点 ────────────────────────────────────────

export const api = {
  /** 获取市场概览与 300 只股票快照 */
  market: () => request<MarketResponse>('/api/market'),

  /** 获取模型与因子选项 */
  options: () => request<OptionsResponse>('/api/model/options'),

  /** 获取最近一次成功的预测结果 */
  latestPredictions: () => request<PredictionResponse>('/api/predictions/latest'),

  /** 训练并预测 */
  trainAndPredict: (body: TrainRequest) =>
    request<PredictionResponse>('/api/model/train-and-predict', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** 获取个股详情 */
  stock: (symbol: string) => request<StockDetail>(`/api/stocks/${symbol}`),

  /** 获取数据与模型状态 */
  status: () => request<{ data_mode: string; quantdash_configured: boolean }>('/api/status'),

  /** 触发数据刷新 */
  refreshData: () =>
    request<{ ok: boolean; message: string }>('/api/data/refresh', {
      method: 'POST',
    }),
}
