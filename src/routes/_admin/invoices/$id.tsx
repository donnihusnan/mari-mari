import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceDetailQueryOptions, invoiceKeys } from '@/features/invoices/queries'
import {
  updateInvoiceStatusFn,
  recordInvoicePaymentFn,
} from '@/features/invoices/server/invoices.fn'
import { InvoiceStatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { formatIDR } from '@/lib/money'
import { formatDateID } from '@/lib/dates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Printer,
  Share2,
  DollarSign,
  Loader2,
  AlertCircle,
  ExternalLink,
  CheckCircle,
} from 'lucide-react'

export const Route = createFileRoute('/_admin/invoices/$id')({
  component: InvoiceDetailPage,
})

function InvoiceDetailPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()

  const { data: invoice, isLoading, error } = useQuery(invoiceDetailQueryOptions(id))

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)
  const [newAmountPaid, setNewAmountPaid] = React.useState<number | ''>('')
  const [paymentError, setPaymentError] = React.useState<string | null>(null)

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus: 'DRAFT' | 'BOOKED' | 'ACTIVE' | 'RETURNED' | 'CANCELLED') =>
      updateInvoiceStatusFn({ data: { id, status: newStatus } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
    },
  })

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: (amount: number) =>
      recordInvoicePaymentFn({ data: { id, amountPaid: amount } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      setIsPaymentOpen(false)
      setPaymentError(null)
    },
    onError: (err: Error) => {
      setPaymentError(err.message || 'Gagal memperbarui pembayaran')
    },
  })

  function handleOpenPayment() {
    if (!invoice) return
    setNewAmountPaid(invoice.amountPaid)
    setPaymentError(null)
    setIsPaymentOpen(true)
  }

  function handleSavePayment(e: React.FormEvent) {
    e.preventDefault()
    if (newAmountPaid === '' || Number(newAmountPaid) < 0) {
      setPaymentError('Nominal pembayaran tidak valid')
      return
    }
    paymentMutation.mutate(Number(newAmountPaid))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Memuat rincian invoice...
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
        Invoice tidak ditemukan atau terjadi kesalahan saat memuat data.
      </div>
    )
  }

  // Format WhatsApp Link
  const cleanPhone = invoice.customerPhone.replace(/\D/g, '')
  const waPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone.startsWith('62')
      ? cleanPhone
      : '62' + cleanPhone

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/invoice/${invoice.publicToken}`
      : `/invoice/${invoice.publicToken}`

  const waMessage = encodeURIComponent(
    `Halo kak ${invoice.customerName},\n\nTerima kasih telah menyewa perlengkapan outdoor di Mari Mari Equipment!\n\nBerikut link invoice pesanan Anda:\n${publicUrl}\n\nNomor: ${invoice.number}\nPeriode: ${formatDateID(invoice.rentStart)} s/d ${formatDateID(invoice.rentEnd)} (${invoice.days} hari)\nTotal: ${formatIDR(invoice.total)}\nStatus Pembayaran: ${invoice.paymentStatus}\n\nSalam,\nMari Mari Outdoor`,
  )

  const waLink = `https://wa.me/${waPhone}?text=${waMessage}`
  const remainingBalance = Math.max(0, invoice.total - invoice.amountPaid)

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={'/invoices' as any}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                {invoice.number}
              </h1>
              <InvoiceStatusBadge status={invoice.status as any} />
              <PaymentStatusBadge status={invoice.paymentStatus as any} />
            </div>
            <p className="text-xs text-muted-foreground">
              Dibuat pada {formatDateID(invoice.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenPayment}
            className="gap-1.5 text-xs"
          >
            <DollarSign className="size-3.5" />
            <span>Catat Pembayaran</span>
          </Button>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-accent transition"
          >
            <Share2 className="size-3.5 text-success" />
            <span>Kirim WhatsApp</span>
          </a>

          <a
            href={`/invoice/${invoice.publicToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition hover:opacity-90"
          >
            <Printer className="size-3.5" />
            <span>Lihat / Cetak PDF</span>
          </a>
        </div>
      </div>

      {/* Status Transition Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div>
          <span className="text-xs font-semibold">Ubah Status Rental:</span>
          <p className="text-[11px] text-muted-foreground">
            Perbarui tahapan operasional pesanan pelanggan.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['BOOKED', 'ACTIVE', 'RETURNED', 'CANCELLED'] as const).map((st) => (
            <Button
              key={st}
              size="sm"
              variant={invoice.status === st ? 'default' : 'outline'}
              disabled={invoice.status === st || statusMutation.isPending}
              onClick={() => statusMutation.mutate(st)}
              className="text-xs h-7"
            >
              {st === 'BOOKED' && 'Booked'}
              {st === 'ACTIVE' && 'Active (Diambil)'}
              {st === 'RETURNED' && 'Returned (Kembali)'}
              {st === 'CANCELLED' && 'Cancelled'}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid: Customer & Schedule */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <User className="size-3.5" />
              <span>Informasi Pelanggan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <div className="font-bold text-base">{invoice.customerName}</div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
                <Phone className="size-3" />
                <span>{invoice.customerPhone}</span>
              </div>
            </div>
            <div className="pt-2">
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <span>Buka percakapan WhatsApp</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Calendar className="size-3.5" />
              <span>Periode Penyewaan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Mulai Sewa:</span>
              <span className="font-semibold">{formatDateID(invoice.rentStart)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Selesai Sewa:</span>
              <span className="font-semibold">{formatDateID(invoice.rentEnd)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
              <span className="text-muted-foreground">Durasi Inklusif:</span>
              <Badge variant="outline" className="font-bold">
                {invoice.days} Hari
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Breakdown Table */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Rincian Alat Disewa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3 text-left font-medium">Equipment</th>
                  <th className="py-2.5 px-2 text-center font-medium">Sumber</th>
                  <th className="py-2.5 px-2 text-center font-medium">Qty</th>
                  <th className="py-2.5 px-3 text-right font-medium">Tarif / Hari</th>
                  <th className="py-2.5 px-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2.5 px-3 font-medium">
                      {it.equipmentName}
                      {it.supplierName && (
                        <div className="text-[10px] text-muted-foreground">
                          Vendor: {it.supplierName}{' '}
                          {it.costPrice ? `(Modal: ${formatIDR(it.costPrice)}/hari)` : ''}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {it.source === 'STOCK' ? (
                        <Badge variant="outline" className="text-[10px] py-0">
                          Stock
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] py-0">
                          Outsource
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center tabular-nums font-semibold">
                      {it.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {formatIDR(it.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                      {formatIDR(it.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary */}
          <div className="mt-4 flex flex-col items-end space-y-1 text-xs">
            <div className="flex w-64 justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-medium tabular-nums">{formatIDR(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex w-64 justify-between text-destructive">
                <span>Diskon:</span>
                <span className="font-medium tabular-nums">-{formatIDR(invoice.discount)}</span>
              </div>
            )}
            <div className="flex w-64 justify-between border-t border-border pt-1 text-sm font-bold text-foreground">
              <span>Total Tagihan:</span>
              <span className="tabular-nums">{formatIDR(invoice.total)}</span>
            </div>
            <div className="flex w-64 justify-between text-success">
              <span>Telah Dibayar:</span>
              <span className="font-semibold tabular-nums">{formatIDR(invoice.amountPaid)}</span>
            </div>
            <div className="flex w-64 justify-between border-t border-border/60 pt-1 font-bold">
              <span>Sisa Tagihan:</span>
              <span
                className={`tabular-nums ${
                  remainingBalance > 0 ? 'text-destructive' : 'text-success'
                }`}
              >
                {remainingBalance > 0 ? formatIDR(remainingBalance) : 'LUNAS'}
              </span>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs">
              <span className="font-semibold text-foreground">Catatan:</span>
              <p className="mt-0.5 text-muted-foreground">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Recording Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <form onSubmit={handleSavePayment}>
            <DialogHeader>
              <DialogTitle>Catat Pembayaran Invoice</DialogTitle>
              <DialogDescription>
                Perbarui total nominal uang yang sudah diterima dari pelanggan.
              </DialogDescription>
            </DialogHeader>

            {paymentError && (
              <div className="my-3 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="my-4 space-y-4">
              <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tagihan:</span>
                  <span className="font-bold">{formatIDR(invoice.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telah Dibayar Saat Ini:</span>
                  <span className="font-semibold">{formatIDR(invoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1">
                  <span className="text-muted-foreground">Sisa Belum Dibayar:</span>
                  <span className="font-bold text-destructive">
                    {formatIDR(remainingBalance)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-amount" className="text-xs">
                  Total Nominal Diterima (Rp)
                </Label>
                <Input
                  id="pay-amount"
                  type="number"
                  min="0"
                  step="5000"
                  value={newAmountPaid}
                  onChange={(e) =>
                    setNewAmountPaid(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  required
                  autoFocus
                  className="tabular-nums font-semibold"
                />
              </div>

              {/* Quick shortcut buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewAmountPaid(invoice.total)}
                  className="text-xs flex-1 gap-1"
                >
                  <CheckCircle className="size-3 text-success" />
                  <span>Set Lunas ({formatIDR(invoice.total)})</span>
                </Button>
                {invoice.amountPaid === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewAmountPaid(Math.round(invoice.total * 0.5))}
                    className="text-xs flex-1"
                  >
                    <span>Set DP 50% ({formatIDR(Math.round(invoice.total * 0.5))})</span>
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentOpen(false)}
                disabled={paymentMutation.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={paymentMutation.isPending}>
                {paymentMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Simpan Pembayaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
