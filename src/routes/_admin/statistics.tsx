import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { statisticsQueryOptions } from '@/features/statistics/queries'
import { formatIDR } from '@/lib/money'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  Download,
  Calendar,
  Package,
  Layers,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'

export const Route = createFileRoute('/_admin/statistics')({
  component: StatisticsPage,
})

function StatisticsPage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear)

  const { data: stats, isLoading, error } = useQuery(statisticsQueryOptions(selectedYear))

  function handleExportCSV() {
    if (!stats) return

    const rows = [
      ['Bulan', 'Pendapatan (IDR)', 'Jumlah Transaksi', 'Total Unit Tersewa'],
      ...stats.monthly.map((m) => [
        m.monthName,
        m.revenue.toString(),
        m.invoiceCount.toString(),
        m.itemCount.toString(),
      ]),
    ]

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `laporan-mari-mari-${selectedYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Memuat data statistik dan laporan...
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>Gagal memuat statistik.</span>
      </div>
    )
  }

  const maxMonthlyRevenue = Math.max(...stats.monthly.map((m) => m.revenue), 1)

  return (
    <div className="space-y-8">
      {/* Header & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistik & Analisis Bisnis</h1>
          <p className="text-xs text-muted-foreground">
            Laporan performa pendapatan, utilisasi stok alat, dan margin laba outsource tahun {selectedYear}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => {
              if (val) setSelectedYear(Number(val))
            }}
            items={[
              { value: String(currentYear), label: String(currentYear) },
              { value: String(currentYear - 1), label: String(currentYear - 1) },
            ]}
          >
            <SelectTrigger className="h-9 min-w-[96px] text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(currentYear)}>{currentYear}</SelectItem>
              <SelectItem value={String(currentYear - 1)}>{currentYear - 1}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs h-9"
          >
            <Download className="size-3.5" />
            <span>Ekspor CSV</span>
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Total Omset ({selectedYear})
            </CardTitle>
            <TrendingUp className="size-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {formatIDR(stats.totalYearRevenue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Dari {stats.totalYearInvoices} transaksi sewa
            </p>
          </CardContent>
        </Card>

        {/* Total Rented Units */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Total Unit Tersewa
            </CardTitle>
            <Package className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {stats.totalItemsRented}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Total perlengkapan disewa keluar
            </p>
          </CardContent>
        </Card>

        {/* Outsource Margin */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Laba Bersih Outsource
            </CardTitle>
            <ArrowUpRight className="size-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {formatIDR(stats.outsource.profit)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Margin {stats.outsource.marginPercent}% dari vendor luar
            </p>
          </CardContent>
        </Card>

        {/* Outsource Units */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Volume Outsource
            </CardTitle>
            <Layers className="size-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {stats.outsource.totalUnits} unit
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Omset outsource: {formatIDR(stats.outsource.totalRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Monthly Performance & Top Gear Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Monthly Breakdown Table & Visual Bars */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <span>Rincian Pendapatan Bulanan ({selectedYear})</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Perkembangan omset dan volume sewa per bulan kalender.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.monthly.map((m) => {
                  const percent = Math.round((m.revenue / maxMonthlyRevenue) * 100)
                  return (
                    <div key={m.monthIndex} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground w-12">{m.monthName}</span>
                        <span className="text-muted-foreground text-[11px]">
                          {m.invoiceCount} transaksi • {m.itemCount} unit
                        </span>
                        <span className="font-bold tabular-nums text-foreground">
                          {formatIDR(m.revenue)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Top Equipment & Outsource Economics */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top Equipment Leaderboard */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="size-4 text-muted-foreground" />
                <span>Top 5 Equipment Terlaris</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Perlengkapan yang paling sering disewa sepanjang tahun {selectedYear}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topEquipment.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Belum ada data persewaan alat untuk tahun ini.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {stats.topEquipment.map((eq, idx) => (
                    <div
                      key={eq.equipmentId}
                      className="flex items-center justify-between py-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-[10px]">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{eq.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {eq.invoiceCount}x disewa
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge variant="outline" className="font-bold tabular-nums">
                          {eq.rentedUnits} unit
                        </Badge>
                        <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                          {formatIDR(eq.totalRevenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outsource Margin Summary */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-muted-foreground" />
                <span>Ekonomi Outsource Alat</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Omset Sewa Outsource:</span>
                <span className="font-semibold tabular-nums">
                  {formatIDR(stats.outsource.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Modal Dibayar ke Vendor:</span>
                <span className="font-semibold tabular-nums text-muted-foreground">
                  {formatIDR(stats.outsource.totalCost)}
                </span>
              </div>
              <div className="border-t border-border pt-1 flex justify-between font-bold">
                <span className="text-foreground">Keuntungan Bersih (Margin):</span>
                <span className="text-success tabular-nums">
                  {formatIDR(stats.outsource.profit)} ({stats.outsource.marginPercent}%)
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                Laba bersih dari penyewaan alat vendor rekanan tanpa investasi modal aset sendiri.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
