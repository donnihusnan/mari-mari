import { z } from 'zod'

export const invoiceItemSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment wajib dipilih'),
  equipmentName: z.string().min(1, 'Nama equipment diperlukan'),
  source: z.enum(['STOCK', 'OUTSOURCE']).default('STOCK'),
  supplierName: z.string().optional().nullable(),
  costPrice: z.coerce.number().int().min(0).optional().nullable(),
  quantity: z.coerce.number().int('Jumlah harus bulat').min(1, 'Minimal 1 unit'),
  unitPrice: z.coerce.number().int('Harga sewa harus bulat').min(0, 'Harga minimal 0'),
})

export const invoiceCreateSchema = z.object({
  customerName: z.string().min(2, 'Nama pelanggan minimal 2 karakter'),
  customerPhone: z.string().min(8, 'Nomor HP minimal 8 digit'),
  rentStart: z.string().min(1, 'Tanggal mulai sewa wajib diisi'),
  rentEnd: z.string().min(1, 'Tanggal selesai sewa wajib diisi'),
  days: z.coerce.number().int().min(1).optional(),
  status: z.enum(['DRAFT', 'BOOKED', 'ACTIVE', 'RETURNED', 'CANCELLED']).default('BOOKED'),
  amountPaid: z.coerce.number().int().min(0).default(0),
  discount: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'Invoice harus memiliki minimal 1 item alat'),
})

export const invoiceUpdateSchema = z.object({
  id: z.string().min(1, 'ID Invoice diperlukan'),
  customerName: z.string().min(2, 'Nama pelanggan minimal 2 karakter'),
  customerPhone: z.string().min(8, 'Nomor HP minimal 8 digit'),
  rentStart: z.string().min(1, 'Tanggal mulai sewa wajib diisi'),
  rentEnd: z.string().min(1, 'Tanggal selesai sewa wajib diisi'),
  days: z.coerce.number().int().min(1).optional(),
  status: z.enum(['DRAFT', 'BOOKED', 'ACTIVE', 'RETURNED', 'CANCELLED']),
  amountPaid: z.coerce.number().int().min(0).default(0),
  discount: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'Invoice harus memiliki minimal 1 item alat'),
})

export const invoiceRecordPaymentSchema = z.object({
  id: z.string().min(1, 'ID Invoice diperlukan'),
  amountPaid: z.coerce.number().int().min(0, 'Jumlah pembayaran minimal 0'),
})

export const invoiceUpdateStatusSchema = z.object({
  id: z.string().min(1, 'ID Invoice diperlukan'),
  status: z.enum(['DRAFT', 'BOOKED', 'ACTIVE', 'RETURNED', 'CANCELLED']),
})

export const invoiceFilterSchema = z.object({
  status: z.enum(['DRAFT', 'BOOKED', 'ACTIVE', 'RETURNED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'DP', 'PAID']).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).optional(),
})


export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>
export type InvoiceRecordPaymentInput = z.infer<typeof invoiceRecordPaymentSchema>
export type InvoiceUpdateStatusInput = z.infer<typeof invoiceUpdateStatusSchema>
export type InvoiceFilterInput = z.infer<typeof invoiceFilterSchema>
