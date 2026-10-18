import { describe, expect, it } from 'bun:test'
import { normalizePhoneNumber, buildWhatsAppInvoiceUrl } from './whatsapp'

describe('normalizePhoneNumber', () => {
  it('normalizes leading 0 numbers', () => {
    expect(normalizePhoneNumber('081234567890')).toBe('6281234567890')
  })

  it('handles formatted numbers with dashes and spaces', () => {
    expect(normalizePhoneNumber('0812-3456-7890')).toBe('6281234567890')
    expect(normalizePhoneNumber('0812 3456 7890')).toBe('6281234567890')
  })

  it('handles already normalized 62 prefix', () => {
    expect(normalizePhoneNumber('6281234567890')).toBe('6281234567890')
  })

  it('handles +62 prefix', () => {
    expect(normalizePhoneNumber('+6281234567890')).toBe('6281234567890')
  })

  it('handles leading 8 without 0 or 62', () => {
    expect(normalizePhoneNumber('81234567890')).toBe('6281234567890')
  })
})

describe('buildWhatsAppInvoiceUrl', () => {
  it('constructs correct wa.me link with encoded text', () => {
    const url = buildWhatsAppInvoiceUrl('08123456789', {
      customerName: 'Budi',
      invoiceNumber: 'MM-2026-0001',
      rentStartFormatted: '10 Okt 2026',
      rentEndFormatted: '12 Okt 2026',
      days: 3,
      totalFormatted: 'Rp 150.000',
      paymentStatus: 'Lunas',
      publicInvoiceUrl: 'https://marimari.com/invoice/token-123',
    })

    expect(url.startsWith('https://wa.me/628123456789?text=')).toBe(true)
    expect(url).toContain('MM-2026-0001')
    expect(url).toContain('Budi')
  })
})
