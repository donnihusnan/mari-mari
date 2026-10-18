import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardQueryOptions, dashboardKeys } from '@/features/dashboard/queries'
import { updateInvoiceStatusFn } from '@/features/invoices/server/invoices.fn'
import { InvoiceStatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { formatIDR } from '@/lib/money'
import { formatDateID } from '@/lib/dates'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MonthlyCalendar } from '@/features/dashboard/components/monthly-calendar'
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
  Phone,
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

  // Current date in Asia/Jakarta (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  }, [])

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

      {/* Three Column Operational Grid: Pickups, Returns, Recent Activity */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Today's Pickups */}
        <Card className="border-border flex flex-col h-[460px]">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <PackageCheck className="size-4 text-info" />
                <span>Jadwal Pengambilan</span>
              </span>
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                {dash.todayPickups.length} pesanan
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Booking yang dijadwalkan diambil pelanggan hari ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col">
            {dash.todayPickups.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground my-auto flex flex-col items-center justify-center gap-2">
                <div className="size-9 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                  <PackageCheck className="size-4" />
                </div>
                <p className="font-medium text-foreground">Semua alat sudah diambil</p>
                <p className="text-[11px] text-muted-foreground">
                  Tidak ada jadwal pengambilan tersisa untuk hari ini.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {dash.todayPickups.map((item) => {
                  const isOverdue = item.rentStart < todayStr
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border/70 p-2.5 text-xs bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0 pr-2 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/invoices/${item.id}` as any}
                            className="font-mono font-semibold hover:underline"
                          >
                            {item.number}
                          </Link>
                          {item.status && <InvoiceStatusBadge status={item.status as any} />}
                        </div>
                        <div className="font-medium text-foreground truncate">{item.customerName}</div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {item.customerPhone && (
                            <a
                              href={`https://wa.me/${item.customerPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-primary transition-colors flex items-center gap-1 truncate"
                              title="Chat WhatsApp"
                            >
                              <Phone className="size-3 shrink-0" />
                              <span>{item.customerPhone}</span>
                            </a>
                          )}
                          {isOverdue && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              (Terlambat)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            transitionMutation.mutate({ id: item.id, status: 'ACTIVE' })
                          }
                          disabled={transitionMutation.isPending}
                          className="text-xs h-7 gap-1 active:scale-[0.98] transition-all"
                        >
                          <CheckCircle2 className="size-3 text-success" />
                          <span>Tandai Diambil</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Today's Returns */}
        <Card className="border-border flex flex-col h-[460px]">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="size-4 text-warning" />
                <span>Jadwal Pengembalian</span>
              </span>
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                {dash.todayReturns.length} pesanan
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Rental yang dijadwalkan kembali hari ini atau lewat batas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col">
            {dash.todayReturns.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground my-auto flex flex-col items-center justify-center gap-2">
                <div className="size-9 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                  <CheckCircle2 className="size-4 text-success" />
                </div>
                <p className="font-medium text-foreground">Tidak ada pengembalian</p>
                <p className="text-[11px] text-muted-foreground">
                  Tidak ada alat yang dijadwalkan kembali hari ini.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {dash.todayReturns.map((item) => {
                  const isOverdue = item.rentEnd < todayStr
                  const diffDays = isOverdue
                    ? Math.max(
                        1,
                        Math.round(
                          (new Date(todayStr).getTime() - new Date(item.rentEnd).getTime()) /
                            (1000 * 60 * 60 * 24),
                        ),
                      )
                    : 0
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border/70 p-2.5 text-xs bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0 pr-2 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/invoices/${item.id}` as any}
                            className="font-mono font-semibold hover:underline"
                          >
                            {item.number}
                          </Link>
                          {item.status && <InvoiceStatusBadge status={item.status as any} />}
                        </div>
                        <div className="font-medium text-foreground truncate">{item.customerName}</div>
                        <div className="text-[11px] truncate flex items-center gap-1.5">
                          {isOverdue ? (
                            <span className="text-destructive font-medium flex items-center gap-1">
                              <AlertCircle className="size-3 shrink-0" />
                              <span>
                                Tenggat: {formatDateID(item.rentEnd)} (Lewat {diffDays} hr)
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Tenggat: Hari Ini ({formatDateID(item.rentEnd)})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.status === 'BOOKED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              transitionMutation.mutate({ id: item.id, status: 'ACTIVE' })
                            }
                            disabled={transitionMutation.isPending}
                            className="text-xs h-7 px-2 gap-1 active:scale-[0.98] transition-all"
                            title="Tandai pesanan telah diambil"
                          >
                            <CheckCircle2 className="size-3 text-success" />
                            <span>Diambil</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            transitionMutation.mutate({ id: item.id, status: 'RETURNED' })
                          }
                          disabled={transitionMutation.isPending}
                          className="text-xs h-7 px-2.5 gap-1 active:scale-[0.98] transition-all"
                        >
                          <CheckCircle2 className="size-3 text-primary" />
                          <span>Kembali</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Recent Invoices */}
        <Card className="border-border flex flex-col h-[460px] md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3 shrink-0 flex flex-row items-center justify-between">
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
          <CardContent className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col">
            {dash.recentInvoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground my-auto flex flex-col items-center justify-center gap-2">
                <div className="size-9 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                  <FileText className="size-4" />
                </div>
                <p className="font-medium text-foreground">Belum ada transaksi</p>
                <p className="text-[11px] text-muted-foreground">
                  Invoice baru akan tercatat di sini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {dash.recentInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    to={`/invoices/${inv.id}` as any}
                    className="flex items-center justify-between py-2.5 hover:bg-muted/30 px-2 rounded-lg transition"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground shrink-0">
                          {inv.number}
                        </span>
                        <InvoiceStatusBadge status={inv.status as any} />
                        <span className="text-xs font-medium text-foreground truncate">
                          {inv.customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Calendar className="size-3 shrink-0 text-muted-foreground/70" />
                        <span>
                          {formatDateID(inv.rentStart)} - {formatDateID(inv.rentEnd)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
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

      {/* Monthly Operations & Transactions Calendar */}
      <MonthlyCalendar />
    </div>
  )
}

