import { queryOptions } from '@tanstack/react-query'
import { listInvoicesFn, getInvoiceFn } from './server/invoices.fn'
import type { InvoiceFilterInput } from './schemas'

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters?: InvoiceFilterInput) => [...invoiceKeys.lists(), filters ?? {}] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
}

export const invoicesListQueryOptions = (filters?: InvoiceFilterInput) =>
  queryOptions({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => listInvoicesFn({ data: filters }),
  })

export const invoiceDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoiceFn({ data: { id } }),
  })
