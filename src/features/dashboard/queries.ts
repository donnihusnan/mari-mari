import { queryOptions } from '@tanstack/react-query'
import { getDashboardDataFn } from './server/dashboard.fn'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
}

export const dashboardQueryOptions = () =>
  queryOptions({
    queryKey: dashboardKeys.summary(),
    queryFn: () => getDashboardDataFn(),
  })
