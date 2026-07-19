import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

// Stub fetch — the App calls three endpoints on mount
vi.stubGlobal(
  'fetch',
  vi.fn(() => new Promise(() => undefined)),
)

describe('App shell', () => {
  it('renders the product identity', () => {
    render(<App />)
    expect(screen.getByText('AlphaScope')).toBeInTheDocument()
    expect(screen.getByText(/多因子信号/)).toBeInTheDocument()
    expect(screen.getByText(/不构成投资建议/)).toBeInTheDocument()
  })
})
