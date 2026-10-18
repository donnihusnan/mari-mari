export const ADMIN_CONTACT = {
  name: "Mari Mari Outdoor",
  tagline: "Penyewaan Perlengkapan Outdoor & Camping",
  instagram: "@marimari_outdoor",
  phoneDisplay: "+62 851-7975-6835",
  phoneRaw: "6285179756835",
  whatsappUrl: "https://wa.me/6285179756835",
} as const;

export const ADMIN_WHATSAPP_PHONE = ADMIN_CONTACT.phoneDisplay;
export const ADMIN_WHATSAPP_NUMBER = ADMIN_CONTACT.phoneRaw;
export const ADMIN_WHATSAPP_URL = ADMIN_CONTACT.whatsappUrl;

export function getAdminWhatsAppUrl(message?: string): string {
  if (!message) {
    return ADMIN_CONTACT.whatsappUrl;
  }
  return `https://wa.me/${ADMIN_CONTACT.phoneRaw}?text=${encodeURIComponent(message)}`;
}

export function formatInvoiceFileName(
  invoiceNumber: string,
  customerName?: string,
): string {
  const cleanNumber = invoiceNumber.trim().replace(/[/\\:*?"<>|]/g, "-");
  if (!customerName?.trim()) {
    return `Invoice-${cleanNumber}`;
  }
  const cleanCustomer = customerName.trim().replace(/[/\\:*?"<>|]/g, "-");
  return `Invoice-${cleanNumber}-${cleanCustomer}`;
}

