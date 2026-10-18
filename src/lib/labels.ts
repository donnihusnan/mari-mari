export const invoiceStatusLabels = {
  DRAFT: 'Draft',
  BOOKED: 'Booked',
  ACTIVE: 'Active',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
} as const

export const paymentStatusLabels = {
  UNPAID: 'Belum Bayar',
  DP: 'DP',
  PAID: 'Lunas',
} as const

export const itemSourceLabels = {
  STOCK: 'Stock',
  OUTSOURCE: 'Outsource',
} as const

export const commonLabels = {
  dashboard: 'Dashboard',
  invoices: 'Invoice',
  equipment: 'Equipment',
  categories: 'Kategori',
  statistics: 'Statistik',
  customer: 'Pelanggan',
  phone: 'No. HP',
  startDate: 'Tanggal Mulai',
  endDate: 'Tanggal Selesai',
  rentalDays: 'Jumlah Hari',
  pricePerDay: 'Harga per Hari',
  quantity: 'Jumlah',
  total: 'Total',
  subtotal: 'Subtotal',
  save: 'Simpan',
  edit: 'Edit',
  delete: 'Hapus',
  cancel: 'Batal',
  search: 'Cari',
  empty: 'Tidak ada data',
  loading: 'Memuat...',
} as const
