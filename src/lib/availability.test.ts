import { describe, expect, it } from 'bun:test'
import {
  calculateAvailableStock,
  isDateRangeOverlapping,
  shouldDeductStock,
} from './availability'

describe('calculateAvailableStock', () => {
  it('returns remaining stock when booked is less than total', () => {
    expect(calculateAvailableStock(10, 3)).toBe(7)
  })

  it('returns 0 when booked equals total stock', () => {
    expect(calculateAvailableStock(5, 5)).toBe(0)
  })

  it('returns 0 and does not return negative numbers if booked exceeds total', () => {
    expect(calculateAvailableStock(3, 8)).toBe(0)
  })

  it('handles 0 total stock (e.g. outsource only items)', () => {
    expect(calculateAvailableStock(0, 0)).toBe(0)
    expect(calculateAvailableStock(0, 5)).toBe(0)
  })
})

describe('isDateRangeOverlapping (inclusive boundary rule)', () => {
  it('detects partial overlap', () => {
    // Rental: 10th - 14th, Target: 12th - 16th
    expect(isDateRangeOverlapping('2026-10-10', '2026-10-14', '2026-10-12', '2026-10-16')).toBe(true)
  })

  it('detects fully contained range', () => {
    expect(isDateRangeOverlapping('2026-10-10', '2026-10-20', '2026-10-12', '2026-10-15')).toBe(true)
  })

  it('detects exact same dates', () => {
    expect(isDateRangeOverlapping('2026-10-10', '2026-10-12', '2026-10-10', '2026-10-12')).toBe(true)
  })

  it('blocks on inclusive boundary: rental return date matches new rent start date', () => {
    // Rental ends on the 12th, target starts on the 12th -> MUST overlap because return is on the 12th
    expect(isDateRangeOverlapping('2026-10-10', '2026-10-12', '2026-10-12', '2026-10-15')).toBe(true)
  })

  it('blocks on inclusive boundary: target return date matches existing rent start date', () => {
    // Target ends on the 10th, rental starts on the 10th
    expect(isDateRangeOverlapping('2026-10-10', '2026-10-15', '2026-10-07', '2026-10-10')).toBe(true)
  })

  it('does not overlap when rental ends strictly before target starts', () => {
    // Rental ends 9th, target starts 10th
    expect(isDateRangeOverlapping('2026-10-05', '2026-10-09', '2026-10-10', '2026-10-15')).toBe(false)
  })

  it('does not overlap when rental starts strictly after target ends', () => {
    // Rental starts 16th, target ends 15th
    expect(isDateRangeOverlapping('2026-10-16', '2026-10-20', '2026-10-10', '2026-10-15')).toBe(false)
  })
})

describe('shouldDeductStock', () => {
  const baseItem = {
    source: 'STOCK' as const,
    invoice: {
      id: 'inv-1',
      status: 'BOOKED' as const,
      rentStart: '2026-10-10',
      rentEnd: '2026-10-12',
    },
  }

  it('deducts stock for BOOKED status and overlapping range', () => {
    expect(shouldDeductStock(baseItem, '2026-10-11', '2026-10-13')).toBe(true)
  })

  it('deducts stock for ACTIVE status and overlapping range', () => {
    const activeItem = {
      ...baseItem,
      invoice: { ...baseItem.invoice, status: 'ACTIVE' as const },
    }
    expect(shouldDeductStock(activeItem, '2026-10-11', '2026-10-13')).toBe(true)
  })

  it('never deducts stock for OUTSOURCE source', () => {
    const outsourceItem = {
      ...baseItem,
      source: 'OUTSOURCE' as const,
    }
    expect(shouldDeductStock(outsourceItem, '2026-10-11', '2026-10-13')).toBe(false)
  })

  it('does not deduct stock for DRAFT status', () => {
    const draftItem = {
      ...baseItem,
      invoice: { ...baseItem.invoice, status: 'DRAFT' as const },
    }
    expect(shouldDeductStock(draftItem, '2026-10-11', '2026-10-13')).toBe(false)
  })

  it('does not deduct stock for RETURNED status', () => {
    const returnedItem = {
      ...baseItem,
      invoice: { ...baseItem.invoice, status: 'RETURNED' as const },
    }
    expect(shouldDeductStock(returnedItem, '2026-10-11', '2026-10-13')).toBe(false)
  })

  it('does not deduct stock for CANCELLED status', () => {
    const cancelledItem = {
      ...baseItem,
      invoice: { ...baseItem.invoice, status: 'CANCELLED' as const },
    }
    expect(shouldDeductStock(cancelledItem, '2026-10-11', '2026-10-13')).toBe(false)
  })

  it('ignores the invoice being edited when excludeInvoiceId is provided', () => {
    expect(shouldDeductStock(baseItem, '2026-10-11', '2026-10-13', 'inv-1')).toBe(false)
    expect(shouldDeductStock(baseItem, '2026-10-11', '2026-10-13', 'inv-other')).toBe(true)
  })
})
