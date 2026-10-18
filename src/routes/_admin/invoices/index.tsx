import * as React from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { invoicesListQueryOptions } from '@/features/invoices/queries'
import { InvoiceStatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { formatIDR } from '@/lib/money'
import { formatDateID } from '@/lib/dates'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  FileText,
  Loader2,
  AlertCircle,
  Eye,
  Calendar,
  RotateCcw,
} from 'lucide-react'

export const Route = createFileRoute('/_admin/invoices/')({
  component: InvoicesListPage,
})

function InvoicesListPage() {
  const router = useRouter()
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')
  const [paymentFilter, setPaymentFilter] = React.useState<string>('ALL')
  const [page, setPage] = React.useState<number>(1)
  const [pageSize, setPageSize] = React.useState<number>(10)

  const { data, isLoading, error } = useQuery(
    invoicesListQueryOptions({
      search: search.trim() || undefined,
      status: statusFilter !== 'ALL' ? (statusFilter as any) : undefined,
      paymentStatus: paymentFilter !== 'ALL' ? (paymentFilter as any) : undefined,
      page,
      pageSize,
    }),
  )

  const invoices = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleStatusChange = (val: string | null) => {
    if (val) {
      setStatusFilter(val)
      setPage(1)
    }
  }

  const handlePaymentChange = (val: string | null) => {
    if (val) {
      setPaymentFilter(val)
      setPage(1)
    }
  }

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setPaymentFilter('ALL')
    setPage(1)
  }

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'ALL' || paymentFilter !== 'ALL'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice & Transaksi</h1>
          <p className="text-sm text-muted-foreground">
            Kelola pesanan sewa, ketersediaan jadwal alat, dan pencatatan pembayaran DP & lunas.
          </p>
        </div>
        <Link
          to={'/invoices/new' as any}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="size-4" />
          <span>Buat Invoice Baru</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari nomor invoice, nama pelanggan, atau nomor HP..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={statusFilter}
            onValueChange={handleStatusChange}
            items={[
              { value: 'ALL', label: 'Semua Status' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'BOOKED', label: 'Booked' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'RETURNED', label: 'Returned' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          >
            <SelectTrigger className="h-8 min-w-[125px] text-xs">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="BOOKED">Booked</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="RETURNED">Returned</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={paymentFilter}
            onValueChange={handlePaymentChange}
            items={[
              { value: 'ALL', label: 'Semua Pembayaran' },
              { value: 'UNPAID', label: 'Belum Bayar' },
              { value: 'DP', label: 'DP' },
              { value: 'PAID', label: 'Lunas' },
            ]}
          >
            <SelectTrigger className="h-8 min-w-[145px] text-xs">
              <SelectValue placeholder="Semua Pembayaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Pembayaran</SelectItem>
              <SelectItem value="UNPAID">Belum Bayar</SelectItem>
              <SelectItem value="DP">DP</SelectItem>
              <SelectItem value="PAID">Lunas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table & Pagination Container */}
      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Memuat daftar invoice...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-6 text-sm text-destructive">
            <AlertCircle className="size-5 shrink-0" />
            <span>Terjadi kesalahan saat memuat data invoice.</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <FileText className="size-6 text-muted-foreground" />
            </div>
            {hasActiveFilters ? (
              <>
                <h3 className="mt-4 text-base font-medium">Tidak ada invoice yang cocok</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Tidak ditemukan invoice dengan kata kunci pencarian atau filter yang dipilih.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground shadow-xs transition hover:bg-muted"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reset Filter</span>
                </button>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-base font-medium">Belum ada invoice</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Buat invoice pertama untuk menyewakan perlengkapan outdoor kepada pelanggan.
                </p>
                <Link
                  to={'/invoices/new' as any}
                  className="mt-4 inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition hover:opacity-90"
                >
                  <Plus className="size-3.5" />
                  <span>Buat Invoice Sekarang</span>
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[18%]">No. Invoice</TableHead>
                  <TableHead className="w-[22%]">Pelanggan</TableHead>
                  <TableHead className="w-[20%]">Periode Sewa</TableHead>
                  <TableHead className="w-[12%] text-center">Status</TableHead>
                  <TableHead className="w-[13%] text-center">Pembayaran</TableHead>
                  <TableHead className="w-[15%] text-right">Total Tagihan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    onClick={() => router.navigate({ to: `/invoices/${inv.id}` as any })}
                    className="group cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="font-mono text-xs font-semibold text-foreground">
                        {inv.number}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {inv.itemCount} jenis alat
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-foreground">{inv.customerName}</div>
                      <div className="text-xs text-muted-foreground">{inv.customerPhone}</div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <Calendar className="size-3 text-muted-foreground" />
                        <span>
                          {formatDateID(inv.rentStart)} - {formatDateID(inv.rentEnd)}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium">
                        {inv.days} hari sewa
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <InvoiceStatusBadge status={inv.status as any} />
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <PaymentStatusBadge status={inv.paymentStatus as any} />
                        {inv.amountPaid > 0 && inv.paymentStatus !== 'PAID' && (
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {formatIDR(inv.amountPaid)}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="font-bold tabular-nums text-foreground">
                        {formatIDR(inv.total)}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
                        <Eye className="size-3" />
                        <span>Detail</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              entityName="invoice"
            />
          </>
        )}
      </div>
    </div>
  )
}
