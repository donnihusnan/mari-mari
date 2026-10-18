import { queryOptions } from '@tanstack/react-query'
import { listCategoriesFn } from './server/categories.fn'

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
}

export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: categoryKeys.lists(),
    queryFn: () => listCategoriesFn(),
  })
