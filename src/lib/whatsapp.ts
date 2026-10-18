/**
 * Normalizes Indonesian phone numbers into international 62XXXXXXXX format.
 * Examples:
 * - 08123456789 -> 628123456789
 * - +628123456789 -> 628123456789
 * - 628123456789 -> 628123456789
 * - 8123456789 -> 628123456789
 */
export function normalizePhoneNumber(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/\D/g, '')

  if (digitsOnly.startsWith('62')) {
    return digitsOnly
  }

  if (digitsOnly.startsWith('0')) {
    return `62${digitsOnly.slice(1)}`
  }

  if (digitsOnly.startsWith('8')) {
    return `62${digitsOnly}`
  }

  return digitsOnly
}

export interface WhatsAppInvoiceMessageParams {
  customerName: string
  invoiceNumber: string
  rentStartFormatted: string
  rentEndFormatted: string
  days: number
  totalFormatted: string
  paymentStatus: string
  publicInvoiceUrl: string
}

export function buildWhatsAppInvoiceUrl(
  phone: string,
  params: WhatsAppInvoiceMessageParams,
): string {
  const normalizedPhone = normalizePhoneNumber(phone)

  const message = [
    `Halo kak ${params.customerName},`,
    '',
    `Terima kasih telah menyewa perlengkapan outdoor di Mari Mari Equipment!`,
    '',
    `Berikut rincian invoice penyewaan Anda:`,
    `📄 Nomor: ${params.invoiceNumber}`,
    `📅 Periode: ${params.rentStartFormatted} s/d ${params.rentEndFormatted} (${params.days} hari)`,
    `💰 Total: ${params.totalFormatted}`,
    `💳 Status Pembayaran: ${params.paymentStatus}`,
    '',
    `Link rincian invoice & invoice digital:`,
    `${params.publicInvoiceUrl}`,
    '',
    `Salam lestari,`,
    `Mari Mari Outdoor Equipment`,
  ].join('\n')

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}
