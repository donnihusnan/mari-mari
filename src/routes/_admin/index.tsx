import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardQueryOptions, dashboardKeys } from '@/features/dashboard/queries'
import { updateInvoiceStatusFn } from '@/features/invoices/server/invoices.fn'
import { InvoiceStatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { formatIDR } from '@/lib/money'
import { formatDateID } from '@/lib/dates'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Calendar,
  AlertCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  PackageCheck,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react'

export const Route = createFileRoute('/_admin/')({
  component: DashboardPage,
})

function DashboardPage() {
  const queryClient = useQueryClient()
  const { data: dash, isLoading, error } = useQuery(dashboardQueryOptions())

  // Quick transition mutation
  const transitionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'RETURNED' }) =>
      updateInvoiceStatusFn({ data: { id, status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Memuat data operasional dashboard...
      </div>
    )
  }

  if (error || !dash) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>Gagal memuat ringkasan dashboard.</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Operasional</h1>
          <p className="text-xs text-muted-foreground">
            Ringkasan ketersediaan jadwal, pengambilan alat hari ini, dan penagihan sewa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={'/invoices/new' as any}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground shadow-xs transition hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="size-3.5" />
            <span>Buat Invoice Baru</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Rentals */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Rental Sedang Aktif
            </CardTitle>
            <Clock className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {dash.activeCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Perlengkapan sedang dibawa pelanggan
            </p>
          </CardContent>
        </Card>

        {/* Booked Upcoming */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Booking Terjadwal
            </CardTitle>
            <Calendar className="size-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {dash.bookedCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Menunggu jadwal pengambilan
            </p>
          </CardContent>
        </Card>

        {/* Unpaid Invoices */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Belum Lunas / DP
            </CardTitle>
            <AlertCircle className="size-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {dash.unpaidCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Invoice memerlukan pelunasan
            </p>
          </CardContent>
        </Card>

        {/* Month Revenue */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Pemasukan Bulan Ini
            </CardTitle>
            <TrendingUp className="size-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {formatIDR(dash.monthRevenue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Total pembayaran diterima
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Operational Schedules & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Schedules for Today (Pickups & Returns) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Today's Pickups */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <PackageCheck className="size-4 text-info" />
                  <span>Jadwal Pengambilan (Pickups Hari Ini)</span>
                </span>
                <span className="text-xs font-normal text-muted-foreground tabular-nums">
                  {dash.todayPickups.length} pesanan
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Booking yang dijadwalkan untuk diambil oleh pelanggan hari ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dash.todayPickups.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Tidak ada jadwal pengambilan alat untuk hari ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {dash.todayPickups.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 text-xs"
                    >
                      <div>
                        <Link
                          to={`/invoices/${item.id}` as any}
                          className="font-mono font-semibold hover:underline"
                        >
                          {item.number}
                        </Link>
                        <div className="font-medium text-foreground">{item.customerName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.customerPhone}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            transitionMutation.mutate({ id: item.id, status: 'ACTIVE' })
                          }
                          disabled={transitionMutation.isPending}
                          className="text-xs h-7 gap-1"
                        >
                          <CheckCircle2 className="size-3 text-success" />
                          <span>Tandai Diambil</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Returns */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="size-4 text-warning" />
                  <span>Jadwal Pengembalian (Returns Hari Ini)</span>
                </span>
                <span className="text-xs font-normal text-muted-foreground tabular-nums">
                  {dash.todayReturns.length} pesanan
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Rental aktif yang dijadwalkan kembali hari ini atau telah melewati batas sewa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dash.todayReturns.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Tidak ada pengembalian alat yang dijadwalkan hari ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {dash.todayReturns.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 text-xs"
                    >
                      <div>
                        <Link
                          to={`/invoices/${item.id}` as any}
                          className="font-mono font-semibold hover:underline"
                        >
                          {item.number}
                        </Link>
                        <div className="font-medium text-foreground">{item.customerName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Tenggat: {formatDateID(item.rentEnd)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            transitionMutation.mutate({ id: item.id, status: 'RETURNED' })
                          }
                          disabled={transitionMutation.isPending}
                          className="text-xs h-7 gap-1"
                        >
                          <CheckCircle2 className="size-3 text-primary" />
                          <span>Tandai Kembali</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Invoices & Quick Links */}
        <div className="space-y-6 lg:col-span-5">
          {/* Recent Invoices Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span>Transaksi Terkini</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Invoice terbaru yang tercatat di sistem.
                </CardDescription>
              </div>
              <Link
                to={'/invoices' as any}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium"
              >
                <span>Semua</span>
                <ArrowRight className="size-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {dash.recentInvoices.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Belum ada transaksi invoice.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {dash.recentInvoices.map((inv) => (
                    <Link
                      key={inv.id}
                      to={`/invoices/${inv.id}` as any}
                      className="flex items-center justify-between py-3 hover:bg-muted/30 px-2 rounded-lg transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {inv.number}
                          </span>
                          <InvoiceStatusBadge status={inv.status as any} />
                        </div>
                        <div className="text-xs text-foreground">{inv.customerName}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold tabular-nums text-foreground">
                          {formatIDR(inv.total)}
                        </div>
                        <PaymentStatusBadge status={inv.paymentStatus as any} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
