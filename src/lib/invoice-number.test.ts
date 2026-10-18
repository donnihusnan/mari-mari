import { describe, expect, it } from 'bun:test'
import { formatInvoiceNumber } from './invoice-number'

describe('formatInvoiceNumber', () => {
  it('formats single digit sequence correctly', () => {
    expect(formatInvoiceNumber(2026, 1)).toBe('MM-2026-0001')
  })

  it('formats double digit sequence correctly', () => {
    expect(formatInvoiceNumber(2026, 42)).toBe('MM-2026-0042')
  })

  it('formats large sequence numbers correctly', () => {
    expect(formatInvoiceNumber(2026, 9999)).toBe('MM-2026-9999')
    expect(formatInvoiceNumber(2027, 10500)).toBe('MM-2027-10500')
  })
})
