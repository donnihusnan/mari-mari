import { queryOptions } from '@tanstack/react-query'
import { getStatisticsFn } from './server/statistics.fn'

export const statisticsKeys = {
  all: ['statistics'] as const,
  byYear: (year?: number) => [...statisticsKeys.all, year ?? 'current'] as const,
}

export const statisticsQueryOptions = (year?: number) =>
  queryOptions({
    queryKey: statisticsKeys.byYear(year),
    queryFn: () => getStatisticsFn({ data: { year } }),
  })
