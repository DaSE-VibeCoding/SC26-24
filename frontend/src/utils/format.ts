import type { Ma20Status, ModelStatus, RiskLevel } from '../types'

/**
 * 格式化涨跌幅百分比
 * 始终带正负号，保留两位小数
 */
export function formatChangePct(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '--'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

/**
 * 格式化价格
 */
export function formatPrice(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '--'
  return value.toFixed(2)
}

/**
 * 格式化数值（一位小数）
 */
export function formatDecimal(value: number | null | undefined, decimals = 1): string {
  if (value == null || isNaN(value)) return '--'
  return value.toFixed(decimals)
}

/**
 * 格式化百分比（如 64.2 → "64.2%"）
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null || isNaN(value)) return '--'
  return `${value.toFixed(decimals)}%`
}

/**
 * 获取涨跌 CSS 类名
 */
export function changeClass(value: number | null | undefined): string {
  if (value == null) return ''
  return value >= 0 ? 'positive' : 'negative'
}

/**
 * 格式化潜力分 (0–100)
 */
export function formatPotentialScore(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '--'
  return value.toFixed(1)
}

/**
 * 风险等级 → 显示文本 + 颜色
 */
export const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#2BB673',
  medium: '#F5B942',
  high: '#F05B72',
}

/**
 * 模型状态 → 显示文本 + 颜色
 */
export const MODEL_STATUS_LABELS: Record<ModelStatus, string> = {
  valid: '历史测试有效',
  weak: '历史表现较弱',
  invalid: '结果不可用于排名',
}

export const MODEL_STATUS_COLORS: Record<ModelStatus, string> = {
  valid: '#21D4B4',
  weak: '#F5B942',
  invalid: '#F05B72',
}

/**
 * MA20 状态 → 显示文本
 */
export const MA20_LABELS: Record<Ma20Status, string> = {
  above: '上方',
  below: '下方',
}

/**
 * 截断小数（避免展示过长的浮点数）
 */
export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
