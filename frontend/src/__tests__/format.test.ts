import { describe, expect, it } from 'vitest'
import {
  changeClass,
  formatChangePct,
  formatDecimal,
  formatPercent,
  formatPotentialScore,
  formatPrice,
  round,
} from '../utils/format'

describe('formatChangePct', () => {
  it('returns positive with + sign', () => {
    expect(formatChangePct(1.32)).toBe('+1.32%')
    expect(formatChangePct(0)).toBe('+0.00%')
  })

  it('returns negative with - sign', () => {
    expect(formatChangePct(-0.44)).toBe('-0.44%')
    expect(formatChangePct(-2.35)).toBe('-2.35%')
  })

  it('returns -- for null/undefined/NaN', () => {
    expect(formatChangePct(null)).toBe('--')
    expect(formatChangePct(undefined)).toBe('--')
    expect(formatChangePct(NaN)).toBe('--')
  })

  it('preserves two decimal places', () => {
    expect(formatChangePct(3.456)).toBe('+3.46%')
    expect(formatChangePct(-1.234)).toBe('-1.23%')
  })
})

describe('formatPrice', () => {
  it('formats price with two decimals', () => {
    expect(formatPrice(1488.20)).toBe('1488.20')
    expect(formatPrice(5.28)).toBe('5.28')
  })

  it('returns -- for null/undefined/NaN', () => {
    expect(formatPrice(null)).toBe('--')
    expect(formatPrice(undefined)).toBe('--')
    expect(formatPrice(NaN)).toBe('--')
  })
})

describe('formatDecimal', () => {
  it('defaults to 1 decimal place', () => {
    expect(formatDecimal(40.0)).toBe('40.0')
    expect(formatDecimal(40.56)).toBe('40.6')
  })

  it('accepts custom decimal count', () => {
    expect(formatDecimal(0.62, 2)).toBe('0.62')
    expect(formatDecimal(1.234, 3)).toBe('1.234')
  })

  it('returns -- for null/undefined/NaN', () => {
    expect(formatDecimal(null)).toBe('--')
    expect(formatDecimal(undefined)).toBe('--')
  })
})

describe('formatPercent', () => {
  it('appends % symbol', () => {
    expect(formatPercent(64.0)).toBe('64.0%')
    expect(formatPercent(0)).toBe('0.0%')
  })

  it('returns -- for null/undefined/NaN', () => {
    expect(formatPercent(null)).toBe('--')
    expect(formatPercent(NaN)).toBe('--')
  })
})

describe('formatPotentialScore', () => {
  it('formats score with one decimal', () => {
    expect(formatPotentialScore(96.8)).toBe('96.8')
    expect(formatPotentialScore(99.0)).toBe('99.0')
  })

  it('returns -- for null/undefined/NaN', () => {
    expect(formatPotentialScore(null)).toBe('--')
    expect(formatPotentialScore(undefined)).toBe('--')
    expect(formatPotentialScore(NaN)).toBe('--')
  })
})

describe('changeClass', () => {
  it('returns positive for zero or up', () => {
    expect(changeClass(0)).toBe('positive')
    expect(changeClass(1.32)).toBe('positive')
  })

  it('returns negative for down', () => {
    expect(changeClass(-0.5)).toBe('negative')
  })

  it('returns empty string for null/undefined', () => {
    expect(changeClass(null)).toBe('')
    expect(changeClass(undefined)).toBe('')
  })
})

describe('round', () => {
  it('rounds to specified decimals', () => {
    expect(round(3.14159, 2)).toBe(3.14)
    expect(round(3.14159, 4)).toBe(3.1416)
  })

  it('defaults to 2 decimals', () => {
    expect(round(3.456)).toBe(3.46)
  })
})
