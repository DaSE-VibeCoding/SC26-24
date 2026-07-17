import type { MarketResponse, OptionsResponse, PredictionResponse, StockDetail } from './types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init })
  if (!response.ok) throw new Error(`请求失败：${response.status}`)
  return response.json() as Promise<T>
}

export const api = {
  market: () => request<MarketResponse>('/api/market'),
  options: () => request<OptionsResponse>('/api/model/options'),
  latestPredictions: () => request<PredictionResponse>('/api/predictions/latest'),
  stock: (symbol: string) => request<StockDetail>(`/api/stocks/${symbol}`),
  predict: (body: { model: string; factors: string[]; top_n: number }) =>
    request<PredictionResponse>('/api/model/train-and-predict', { method: 'POST', body: JSON.stringify(body) }),
}

