import { queryOptions } from '@tanstack/react-query'
import { getDashboardDataFn, getCalendarInvoicesFn } from './server/dashboard.fn'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  calendar: (year: number, month: number) =>
    [...dashboardKeys.all, 'calendar', year, month] as const,
}

export const dashboardQueryOptions = () =>
  queryOptions({
    queryKey: dashboardKeys.summary(),
    queryFn: () => getDashboardDataFn(),
  })

export const calendarInvoicesQueryOptions = (year: number, month: number) =>
  queryOptions({
    queryKey: dashboardKeys.calendar(year, month),
    queryFn: () => getCalendarInvoicesFn({ data: { year, month } }),
  })
