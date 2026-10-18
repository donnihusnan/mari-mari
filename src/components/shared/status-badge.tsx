import { invoiceStatusLabels, paymentStatusLabels } from '@/lib/labels'

export function InvoiceStatusBadge({
  status,
}: {
  status: 'DRAFT' | 'BOOKED' | 'ACTIVE' | 'RETURNED' | 'CANCELLED'
}) {
  const label = invoiceStatusLabels[status] || status

  switch (status) {
    case 'DRAFT':
      return (
        <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {label}
        </span>
      )
    case 'BOOKED':
      return (
        <span className="inline-flex items-center rounded-md border border-info/30 bg-info/15 px-2 py-0.5 text-xs font-medium text-info">
          {label}
        </span>
      )
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-xs">
          {label}
        </span>
      )
    case 'RETURNED':
      return (
        <span className="inline-flex items-center rounded-md border border-success/30 bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
          {label}
        </span>
      )
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center rounded-md border border-destructive/30 bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
          {label}
        </span>
      )
  }
}

export function PaymentStatusBadge({
  status,
}: {
  status: 'UNPAID' | 'DP' | 'PAID'
}) {
  const label = paymentStatusLabels[status] || status

  switch (status) {
    case 'UNPAID':
      return (
        <span className="inline-flex items-center rounded-md border border-destructive/30 bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
          {label}
        </span>
      )
    case 'DP':
      return (
        <span className="inline-flex items-center rounded-md border border-warning/40 bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning-foreground">
          {label}
        </span>
      )
    case 'PAID':
      return (
        <span className="inline-flex items-center rounded-md border border-success/30 bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
          {label}
        </span>
      )
  }
}
