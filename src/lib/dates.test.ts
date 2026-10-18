import { describe, expect, it } from 'bun:test'
import { calculateRentalDays, formatDateID } from './dates'

describe('calculateRentalDays', () => {
  it('calculates inclusive days correctly (10th to 12th = 3 days)', () => {
    const days = calculateRentalDays('2026-10-10', '2026-10-12')
    expect(days).toBe(3)
  })

  it('same start and end date equals 1 day', () => {
    const days = calculateRentalDays('2026-10-10', '2026-10-10')
    expect(days).toBe(1)
  })

  it('1 week rental equals 8 days inclusive', () => {
    const days = calculateRentalDays('2026-10-01', '2026-10-07')
    expect(days).toBe(7)
  })

  it('formats Indonesian date correctly', () => {
    const formatted = formatDateID('2026-10-18')
    expect(formatted).toContain('2026')
    expect(formatted).toContain('18')
  })
})

