import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { calendarInvoicesQueryOptions } from '../queries'
import { formatDateID } from '@/lib/dates'
import { formatIDR } from '@/lib/money'
import { InvoiceStatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  User,
  Phone,
  Package,
  ArrowRight,
  Loader2,
  CalendarCheck2,
} from 'lucide-react'
import { cn } from 'cn'
import { TooltipWrapper } from '@/components/ui/tooltip'

type CalendarEventItem = {
  id: string
  number: string
  customerName: string
  customerPhone: string
  rentStart: string
  rentEnd: string
  days: number
  status: any
  paymentStatus: any
  total: number
  items?: Array<{ name: string; quantity: number }>
}

function EventTooltipCard({
  type,
  invoice,
}: {
  type: 'pickup' | 'return' | 'ongoing'
  invoice: CalendarEventItem
}) {
  const isPickup = type === 'pickup'
  const isReturn = type === 'return'

  return (
    <div className="flex flex-col gap-1.5 p-1 max-w-[260px] text-left">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider',
            isPickup && 'text-emerald-600 dark:text-emerald-400',
            isReturn && 'text-amber-600 dark:text-amber-400',
            !isPickup && !isReturn && 'text-muted-foreground'
          )}
        >
          {isPickup && <ArrowUpRight className="size-3 shrink-0" />}
          {isReturn && <ArrowDownLeft className="size-3 shrink-0" />}
          {!isPickup && !isReturn && <Clock className="size-3 shrink-0" />}
          <span>{isPickup ? 'Ambil (Pickup)' : isReturn ? 'Kembali (Return)' : 'Sewa Aktif'}</span>
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {invoice.number}
        </span>
      </div>

      <div className="space-y-0.5">
        <div className="font-semibold text-foreground text-xs leading-tight truncate">
          {invoice.customerName}
        </div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <CalendarIcon className="size-3 shrink-0 text-muted-foreground/70" />
          <span>
            {formatDateID(invoice.rentStart)} - {formatDateID(invoice.rentEnd)} ({invoice.days} hari)
          </span>
        </div>
      </div>

      {invoice.items && invoice.items.length > 0 && (
        <div className="text-[11px] text-muted-foreground/90 border-t border-border/40 pt-1 flex items-start gap-1.5">
          <Package className="size-3 shrink-0 mt-0.5 text-muted-foreground/70" />
          <span className="line-clamp-2">
            {invoice.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/40 text-[10px]">
        <span className="font-semibold text-foreground tabular-nums">
          {formatIDR(invoice.total)}
        </span>
        <div className="flex items-center gap-1">
          <InvoiceStatusBadge status={invoice.status} />
        </div>
      </div>
    </div>
  )
}

function OverflowEventsTooltipCard({
  hiddenEvents,
  dateFormatted,
}: {
  hiddenEvents: Array<{
    invoice: CalendarEventItem
    type: 'pickup' | 'return' | 'ongoing'
  }>
  dateFormatted: string
}) {
  return (
    <div className="flex flex-col gap-2 p-1 min-w-[260px] max-w-[300px] text-left">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
        <span className="text-[11px] font-semibold text-foreground">
          +{hiddenEvents.length} Jadwal Lainnya
        </span>
        <span className="text-[10px] text-muted-foreground">
          {dateFormatted}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 divide-y divide-border/40 max-h-[240px] overflow-y-auto pr-0.5">
        {hiddenEvents.map(({ invoice, type }) => {
          const isPickup = type === 'pickup'
          const isReturn = type === 'return'

          return (
            <div key={`${type}-${invoice.id}`} className="pt-2.5 first:pt-0 space-y-1">
              <div className="flex items-center justify-between gap-1.5 text-[10px]">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 font-semibold',
                    isPickup && 'text-emerald-600 dark:text-emerald-400',
                    isReturn && 'text-amber-600 dark:text-amber-400',
                    !isPickup && !isReturn && 'text-muted-foreground'
                  )}
                >
                  {isPickup && <ArrowUpRight className="size-2.5 shrink-0" />}
                  {isReturn && <ArrowDownLeft className="size-2.5 shrink-0" />}
                  {!isPickup && !isReturn && <Clock className="size-2.5 shrink-0" />}
                  <span>{isPickup ? 'Ambil' : isReturn ? 'Kembali' : 'Aktif'}</span>
                </span>
                <span className="font-mono text-muted-foreground">
                  {invoice.number}
                </span>
              </div>

              <div className="font-medium text-foreground text-[11px] truncate">
                {invoice.customerName}
              </div>

              {invoice.items && invoice.items.length > 0 && (
                <div className="text-[10px] text-muted-foreground line-clamp-1 flex items-center gap-1">
                  <Package className="size-2.5 shrink-0 text-muted-foreground/70" />
                  <span>
                    {invoice.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <CalendarIcon className="size-2.5 shrink-0 text-muted-foreground/70" />
                <span>
                  {formatDateID(invoice.rentStart)} - {formatDateID(invoice.rentEnd)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 text-[10px] pt-1 border-t border-border/40">
                <span className="font-semibold text-foreground tabular-nums">
                  {formatIDR(invoice.total)}
                </span>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function formatYMD(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

export function MonthlyCalendar() {
  const now = new Date()
  const todayYMD = formatYMD(now.getFullYear(), now.getMonth(), now.getDate())

  const [currentYear, setCurrentYear] = React.useState<number>(now.getFullYear())
  const [currentMonth, setCurrentMonth] = React.useState<number>(now.getMonth() + 1) // 1-12
  const [selectedDate, setSelectedDate] = React.useState<string>(todayYMD)

  // Query invoices for current month & year
  const { data: invoices = [], isLoading } = useQuery(
    calendarInvoicesQueryOptions(currentYear, currentMonth)
  )

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleCurrentMonth = () => {
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth() + 1)
    setSelectedDate(todayYMD)
  }

  // Days calculation for calendar grid (Monday-first: 0 = Mon, 6 = Sun)
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const rawFirstDay = new Date(currentYear, currentMonth - 1, 1).getDay() // 0 = Sun
  const firstDayOfWeek = (rawFirstDay + 6) % 7 // 0 = Mon, 6 = Sun
  const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate()

  const calendarDays = React.useMemo(() => {
    const cells: Array<{
      year: number
      month: number
      day: number
      ymd: string
      isCurrentMonth: boolean
    }> = []

    // Previous month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevM = currentMonth === 1 ? 12 : currentMonth - 1
      const prevY = currentMonth === 1 ? currentYear - 1 : currentYear
      const d = daysInPrevMonth - i
      cells.push({
        year: prevY,
        month: prevM,
        day: d,
        ymd: formatYMD(prevY, prevM - 1, d),
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        year: currentYear,
        month: currentMonth,
        day: d,
        ymd: formatYMD(currentYear, currentMonth - 1, d),
        isCurrentMonth: true,
      })
    }

    // Next month leading days (fill grid to 35 or 42)
    const totalCells = cells.length > 35 ? 42 : 35
    const remaining = totalCells - cells.length
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 12 ? 1 : currentMonth + 1
      const nextY = currentMonth === 12 ? currentYear + 1 : currentYear
      cells.push({
        year: nextY,
        month: nextM,
        day: d,
        ymd: formatYMD(nextY, nextM - 1, d),
        isCurrentMonth: false,
      })
    }

    return cells
  }, [currentYear, currentMonth, daysInMonth, firstDayOfWeek, daysInPrevMonth])

  // Map invoices by date
  // For each date, categorize:
  // - pickups (rentStart === date)
  // - returns (rentEnd === date)
  // - active (rentStart < date && rentEnd > date)
  const eventsByDate = React.useMemo(() => {
    const map: Record<
      string,
      Array<{
        invoice: (typeof invoices)[number]
        type: 'pickup' | 'return' | 'ongoing'
      }>
    > = {}

    for (const inv of invoices) {
      const start = inv.rentStart
      const end = inv.rentEnd

      // Pickup date
      if (!map[start]) map[start] = []
      map[start].push({ invoice: inv, type: 'pickup' })

      // Return date (if different from start)
      if (end !== start) {
        if (!map[end]) map[end] = []
        map[end].push({ invoice: inv, type: 'return' })
      }

      // Check dates in between for ongoing status
      const startDate = new Date(start)
      const endDate = new Date(end)
      const cur = new Date(startDate)
      cur.setDate(cur.getDate() + 1)

      while (cur < endDate) {
        const ymd = cur.toISOString().split('T')[0]
        if (!map[ymd]) map[ymd] = []
        // Avoid duplicate
        if (!map[ymd].some((e) => e.invoice.id === inv.id)) {
          map[ymd].push({ invoice: inv, type: 'ongoing' })
        }
        cur.setDate(cur.getDate() + 1)
      }
    }

    return map
  }, [invoices])

  // Events on selected date
  const selectedEvents = React.useMemo(() => {
    return eventsByDate[selectedDate] || []
  }, [eventsByDate, selectedDate])

  // Month counts
  const monthPickups = React.useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    return invoices.filter((i) => i.rentStart.startsWith(prefix)).length
  }, [invoices, currentYear, currentMonth])

  const monthReturns = React.useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    return invoices.filter((i) => i.rentEnd.startsWith(prefix)).length
  }, [invoices, currentYear, currentMonth])

  return (
    <Card className="border-border">
      {/* Calendar Header with Switcher */}
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" />
              <span>Kalender Operasional & Transaksi</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Jadwal pengambilan (pickup), masa sewa aktif, dan pengembalian (return) alat outdoor.
            </CardDescription>
          </div>

          {/* Month Switcher Controls */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCurrentMonth}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              Bulan Ini
            </Button>

            <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                className="size-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="min-w-36 text-center text-xs font-semibold text-foreground px-2">
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="size-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer"
                title="Bulan Selanjutnya"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Legend & Month Summary Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Pengambilan (Pickup)</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full bg-amber-500" />
              <span>Pengembalian (Return)</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full bg-slate-400" />
              <span>Sewa Aktif</span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-medium text-[11px] text-muted-foreground">
            <span>
              Total {invoices.length} Invoice ({monthPickups} Ambil • {monthReturns} Kembali)
            </span>
            {isLoading && (
              <span className="flex items-center gap-1 text-primary">
                <Loader2 className="size-3 animate-spin" />
                <span>Memuat...</span>
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Calendar Grid Container (Horizontally scrollable on small mobile) */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <div className="min-w-[680px]">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center">
              {DAY_NAMES.map((name, idx) => (
                <div
                  key={name}
                  className={cn(
                    'py-2 text-xs font-semibold text-muted-foreground',
                    idx === 6 && 'text-destructive/80' // Sunday
                  )}
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Days Grid Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-border bg-background">
              {calendarDays.map((cell) => {
                const dayEvents = eventsByDate[cell.ymd] || []
                const isToday = cell.ymd === todayYMD
                const isSelected = cell.ymd === selectedDate

                const pickups = dayEvents.filter((e) => e.type === 'pickup')
                const returns = dayEvents.filter((e) => e.type === 'return')
                const ongoing = dayEvents.filter((e) => e.type === 'ongoing')

                const displayedPickups = pickups.slice(0, 2)
                const remainingSlotAfterPickups = Math.max(0, 2 - displayedPickups.length)
                const displayedReturns = returns.slice(0, remainingSlotAfterPickups)
                const remainingSlotAfterReturns = Math.max(0, remainingSlotAfterPickups - displayedReturns.length)
                const displayedOngoing = ongoing.slice(0, remainingSlotAfterReturns)

                const displayedEvents = [...displayedPickups, ...displayedReturns, ...displayedOngoing]
                const hiddenEvents = dayEvents.filter((ev) => !displayedEvents.includes(ev))

                return (
                  <div
                    key={cell.ymd}
                    onClick={() => setSelectedDate(cell.ymd)}
                    className={cn(
                      'group relative flex min-h-[100px] flex-col justify-between p-1.5 transition-colors cursor-pointer select-none',
                      // Background states
                      cell.isCurrentMonth ? 'bg-card' : 'bg-muted/15',
                      isSelected && '!bg-accent/40 ring-2 ring-primary ring-inset z-10',
                      !isSelected && cell.isCurrentMonth && 'hover:bg-accent/25'
                    )}
                  >
                    {/* Top Row: Date Number & Count Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-xs font-semibold inline-flex size-6 items-center justify-center rounded-full',
                          isToday
                            ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                            : cell.isCurrentMonth
                              ? 'text-foreground'
                              : 'text-muted-foreground/35'
                        )}
                      >
                        {cell.day}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event Chips List */}
                    <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                      {/* Pickups */}
                      {displayedPickups.map(({ invoice }) => (
                        <TooltipWrapper
                          key={`p-${invoice.id}`}
                          content={<EventTooltipCard type="pickup" invoice={invoice} />}
                        >
                          <div className="flex items-center gap-1 rounded bg-emerald-500/10 px-1 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 truncate transition-colors hover:bg-emerald-500/20">
                            <ArrowUpRight className="size-2.5 shrink-0 text-emerald-600" />
                            <span className="truncate">{invoice.customerName}</span>
                          </div>
                        </TooltipWrapper>
                      ))}

                      {/* Returns */}
                      {displayedReturns.map(({ invoice }) => (
                        <TooltipWrapper
                          key={`r-${invoice.id}`}
                          content={<EventTooltipCard type="return" invoice={invoice} />}
                        >
                          <div className="flex items-center gap-1 rounded bg-amber-500/10 px-1 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 border border-amber-500/20 truncate transition-colors hover:bg-amber-500/20">
                            <ArrowDownLeft className="size-2.5 shrink-0 text-amber-600" />
                            <span className="truncate">{invoice.customerName}</span>
                          </div>
                        </TooltipWrapper>
                      ))}

                      {/* Ongoing (if room left) */}
                      {displayedOngoing.map(({ invoice }) => (
                        <TooltipWrapper
                          key={`o-${invoice.id}`}
                          content={<EventTooltipCard type="ongoing" invoice={invoice} />}
                        >
                          <div className="flex items-center gap-1 rounded bg-muted/60 px-1 py-0.5 text-[10px] font-medium text-muted-foreground border border-border truncate transition-colors hover:bg-muted">
                            <Clock className="size-2.5 shrink-0" />
                            <span className="truncate">{invoice.customerName}</span>
                          </div>
                        </TooltipWrapper>
                      ))}

                      {/* Remaining badge */}
                      {hiddenEvents.length > 0 && (
                        <TooltipWrapper
                          content={
                            <OverflowEventsTooltipCard
                              hiddenEvents={hiddenEvents}
                              dateFormatted={formatDateID(cell.ymd)}
                            />
                          }
                        >
                          <div className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[9px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer w-fit">
                            <span>+{hiddenEvents.length} lagi</span>
                          </div>
                        </TooltipWrapper>
                      )}
                    </div>

                    {/* Bottom Indicator Dots */}
                    <div className="mt-1 flex items-center gap-1">
                      {pickups.length > 0 && <span className="size-1.5 rounded-full bg-emerald-500" />}
                      {returns.length > 0 && <span className="size-1.5 rounded-full bg-amber-500" />}
                      {ongoing.length > 0 && <span className="size-1.5 rounded-full bg-slate-400" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Details Panel */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Jadwal & Transaksi: {formatDateID(selectedDate)}
              </h3>
              {selectedDate === todayYMD && (
                <Badge variant="outline" className="text-[10px] py-0">
                  Hari Ini
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedEvents.length === 0
                ? 'Tidak ada aktivitas'
                : `${selectedEvents.length} transaksi / jadwal operasional`}
            </div>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Tidak ada jadwal pengambilan, pengembalian, atau sewa aktif pada tanggal ini.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {selectedEvents.map(({ invoice, type }) => {
                const isPickup = type === 'pickup'
                const isReturn = type === 'return'

                return (
                  <div
                    key={`${invoice.id}-${type}`}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 px-2 rounded-lg transition"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/invoices/${invoice.id}` as any}
                          className="font-mono text-xs font-bold text-foreground hover:underline"
                        >
                          {invoice.number}
                        </Link>

                        {isPickup && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0"
                          >
                            Pengambilan Hari Ini
                          </Badge>
                        )}
                        {isReturn && (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] py-0"
                          >
                            Pengembalian Hari Ini
                          </Badge>
                        )}
                        {!isPickup && !isReturn && (
                          <Badge variant="secondary" className="text-[10px] py-0">
                            Sewa Aktif Berjalan
                          </Badge>
                        )}

                        <InvoiceStatusBadge status={invoice.status as any} />
                        <PaymentStatusBadge status={invoice.paymentStatus as any} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground">
                        <span className="font-semibold flex items-center gap-1">
                          <User className="size-3 text-muted-foreground" />
                          {invoice.customerName}
                        </span>
                        {invoice.customerPhone && (
                          <a
                            href={`https://wa.me/${invoice.customerPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px]"
                          >
                            <Phone className="size-3 text-muted-foreground" />
                            {invoice.customerPhone}
                          </a>
                        )}
                        <span className="text-muted-foreground text-[11px]">
                          Periode: {formatDateID(invoice.rentStart)} s/d {formatDateID(invoice.rentEnd)} (
                          {invoice.days} hari)
                        </span>
                      </div>

                      {/* Equipment items summary */}
                      {invoice.items && invoice.items.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Package className="size-3 shrink-0" />
                          <span className="truncate">
                            Alat: {invoice.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1.5 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold tabular-nums text-foreground">
                          {formatIDR(invoice.total)}
                        </div>
                      </div>

                      <Link
                        to={`/invoices/${invoice.id}` as any}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <span>Lihat Invoice</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
