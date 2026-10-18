import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "cn"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { formatDateID } from "@/lib/dates"

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

function parseYMD(str?: string) {
  if (!str) return null
  const [y, m, d] = str.split("-").map(Number)
  if (!y || !m || !d) return null
  return { year: y, month: m - 1, day: d }
}

function formatYMD(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${year}-${m}-${d}`
}

export interface DatePickerProps {
  id?: string
  value?: string // YYYY-MM-DD
  onChange?: (value: string) => void
  minDate?: string // YYYY-MM-DD
  maxDate?: string // YYYY-MM-DD
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

export function DatePicker({
  id,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Pilih tanggal",
  disabled = false,
  required = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Current view month & year in calendar popup
  const parsedValue = React.useMemo(() => parseYMD(value), [value])

  const today = React.useMemo(() => {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      ymd: formatYMD(now.getFullYear(), now.getMonth(), now.getDate()),
    }
  }, [])

  const [viewYear, setViewYear] = React.useState<number>(
    () => parsedValue?.year ?? today.year
  )
  const [viewMonth, setViewMonth] = React.useState<number>(
    () => parsedValue?.month ?? today.month
  )

  // Sync view when opened with current selected value
  React.useEffect(() => {
    if (open) {
      if (parsedValue) {
        setViewYear(parsedValue.year)
        setViewMonth(parsedValue.month)
      } else {
        setViewYear(today.year)
        setViewMonth(today.month)
      }
    }
  }, [open, parsedValue, today])

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  // Generate calendar days grid (Monday-first: 0 = Mon, 6 = Sun)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const rawFirstDay = new Date(viewYear, viewMonth, 1).getDay() // 0 = Sun
  const firstDayOfWeek = (rawFirstDay + 6) % 7 // 0 = Mon, 6 = Sun
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const cells = React.useMemo(() => {
    const list: Array<{
      year: number
      month: number
      day: number
      ymd: string
      isCurrentMonth: boolean
      disabled: boolean
    }> = []

    // Previous month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear
      const d = daysInPrevMonth - i
      const ymd = formatYMD(prevY, prevM, d)
      const isDisabled = (minDate && ymd < minDate) || (maxDate && ymd > maxDate)
      list.push({
        year: prevY,
        month: prevM,
        day: d,
        ymd,
        isCurrentMonth: false,
        disabled: Boolean(isDisabled),
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = formatYMD(viewYear, viewMonth, d)
      const isDisabled = (minDate && ymd < minDate) || (maxDate && ymd > maxDate)
      list.push({
        year: viewYear,
        month: viewMonth,
        day: d,
        ymd,
        isCurrentMonth: true,
        disabled: Boolean(isDisabled),
      })
    }

    // Next month leading days (fill grid to 35 or 42 cells)
    const totalCells = list.length > 35 ? 42 : 35
    const remaining = totalCells - list.length
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear
      const ymd = formatYMD(nextY, nextM, d)
      const isDisabled = (minDate && ymd < minDate) || (maxDate && ymd > maxDate)
      list.push({
        year: nextY,
        month: nextM,
        day: d,
        ymd,
        isCurrentMonth: false,
        disabled: Boolean(isDisabled),
      })
    }

    return list
  }, [viewYear, viewMonth, daysInMonth, firstDayOfWeek, daysInPrevMonth, minDate, maxDate])

  const handleSelectDate = (ymd: string, disabledDay: boolean) => {
    if (disabledDay) return
    onChange?.(ymd)
    setOpen(false)
  }

  const handleSelectToday = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const isTodayDisabled =
      (minDate && today.ymd < minDate) || (maxDate && today.ymd > maxDate)
    if (!isTodayDisabled) {
      onChange?.(today.ymd)
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange?.("")
    setOpen(false)
  }

  // Display label
  const formattedDisplay = React.useMemo(() => {
    if (!value) return ""
    try {
      return formatDateID(value)
    } catch {
      return value
    }
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-required={required}
        type="button"
        className={cn(
          "flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-card px-2.5 py-1 text-xs font-normal text-foreground transition-colors hover:bg-accent/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 select-none",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span className="truncate">
          {formattedDisplay || placeholder}
        </span>
        <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[280px] p-3 shadow-md"
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            className="size-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="text-xs font-semibold text-foreground tracking-tight">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="size-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {DAY_NAMES.map((d, idx) => (
            <div
              key={d}
              className={cn(
                "text-[11px] font-medium text-muted-foreground py-1",
                idx === 6 && "text-destructive/80"
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const isSelected = value === cell.ymd
            const isToday = today.ymd === cell.ymd

            return (
              <button
                key={cell.ymd}
                type="button"
                disabled={cell.disabled}
                onClick={() => handleSelectDate(cell.ymd, cell.disabled)}
                className={cn(
                  "size-8 rounded-lg text-xs font-medium transition-colors flex items-center justify-center cursor-pointer select-none",
                  // Selected state (Monochrome Brand: solid primary black + white text)
                  isSelected &&
                    "!bg-primary !text-primary-foreground font-semibold shadow-xs",
                  // Today state (if not selected)
                  isToday &&
                    !isSelected &&
                    "border border-primary/40 font-semibold text-foreground",
                  // Normal day state
                  cell.isCurrentMonth &&
                    !isSelected &&
                    !cell.disabled &&
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
                  // Outside month state
                  !cell.isCurrentMonth &&
                    !isSelected &&
                    !cell.disabled &&
                    "text-muted-foreground/40 hover:bg-accent/40 hover:text-foreground",
                  // Disabled state
                  cell.disabled &&
                    "opacity-25 cursor-not-allowed pointer-events-none"
                )}
              >
                {cell.day}
              </button>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectToday}
            className="h-6 text-[11px] px-2 rounded-md cursor-pointer"
          >
            Hari Ini
          </Button>

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 text-[11px] px-2 text-muted-foreground hover:text-destructive rounded-md cursor-pointer flex items-center gap-1"
            >
              <X className="size-3" />
              <span>Hapus</span>
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
