import { describe, it, expect } from 'bun:test'
import {
  ADMIN_CONTACT,
  ADMIN_WHATSAPP_PHONE,
  ADMIN_WHATSAPP_NUMBER,
  ADMIN_WHATSAPP_URL,
  getAdminWhatsAppUrl,
  formatInvoiceFileName,
} from './constants'

describe('Admin Constants', () => {
  it('has valid phone numbers and contact details', () => {
    expect(ADMIN_CONTACT.phoneDisplay).toBe('+62 851-7975-6835')
    expect(ADMIN_CONTACT.phoneRaw).toBe('6285179756835')
    expect(ADMIN_CONTACT.whatsappUrl).toBe('https://wa.me/6285179756835')
    expect(ADMIN_WHATSAPP_PHONE).toBe('+62 851-7975-6835')
    expect(ADMIN_WHATSAPP_NUMBER).toBe('6285179756835')
    expect(ADMIN_WHATSAPP_URL).toBe('https://wa.me/6285179756835')
  })

  it('generates whatsapp url without message', () => {
    expect(getAdminWhatsAppUrl()).toBe('https://wa.me/6285179756835')
  })

  it('generates whatsapp url with encoded message', () => {
    const url = getAdminWhatsAppUrl('Halo Admin!')
    expect(url).toBe('https://wa.me/6285179756835?text=Halo%20Admin!')
  })

  it('formats clean invoice filename for download and print', () => {
    expect(formatInvoiceFileName('MM-2026-0001', 'Test')).toBe('Invoice-MM-2026-0001-Test')
    expect(formatInvoiceFileName('MM-2026-0002', 'Budi Santoso')).toBe('Invoice-MM-2026-0002-Budi Santoso')
    expect(formatInvoiceFileName('MM-2026-0003', '')).toBe('Invoice-MM-2026-0003')
    expect(formatInvoiceFileName('MM/2026/0004', 'John: Doe*')).toBe('Invoice-MM-2026-0004-John- Doe-')
  })
})
