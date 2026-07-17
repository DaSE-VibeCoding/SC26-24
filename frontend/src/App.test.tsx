import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)))

describe('App shell', () => {
  it('renders the product identity', () => {
    render(<App />)
    expect(screen.getByText('AlphaScope')).toBeInTheDocument()
    expect(screen.getByText(/多因子信号/)).toBeInTheDocument()
  })
})
