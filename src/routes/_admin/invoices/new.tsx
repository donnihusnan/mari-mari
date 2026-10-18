import * as React from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentListQueryOptions } from '@/features/equipment/queries'
import { invoiceKeys } from '@/features/invoices/queries'
import { createInvoiceFn } from '@/features/invoices/server/invoices.fn'
import { checkEquipmentAvailabilityFn } from '@/features/equipment/server/availability.fn'
import { useInvoiceDraftStore } from '@/stores/invoice-draft.store'
import { formatIDR } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  User,
  Phone,
  Package,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react'

export const Route = createFileRoute('/_admin/invoices/new')({
  component: NewInvoicePage,
})

function NewInvoicePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Draft store
  const {
    customerName,
    customerPhone,
    rentStart,
    rentEnd,
    days,
    discount,
    amountPaid,
    notes,
    status,
    items,
    setCustomerInfo,
    setDates,
    setDays,
    addItem,
    updateItem,
    removeItem,
    setDiscount,
    setAmountPaid,
    setStatus,
    setNotes,
    resetDraft,
  } = useInvoiceDraftStore()

  // Equipment query
  const { data: catalogData } = useQuery(
    equipmentListQueryOptions({ isActive: true, pageSize: 100 }),
  )
  const catalog = catalogData?.items ?? []

  // Local state for adding equipment modal/section
  const [selectedEquipmentId, setSelectedEquipmentId] = React.useState<string>('')
  const [addSource, setAddSource] = React.useState<'STOCK' | 'OUTSOURCE'>('STOCK')
  const [addSupplier, setAddSupplier] = React.useState('')
  const [addCostPrice, setAddCostPrice] = React.useState<number | ''>('')
  const [addQuantity, setAddQuantity] = React.useState<number>(1)
  const [addUnitPrice, setAddUnitPrice] = React.useState<number | ''>('')

  // Live availability state for selected equipment
  const [availabilityMap, setAvailabilityMap] = React.useState<Record<string, number>>({})
  const [checkingAvailability, setCheckingAvailability] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Fetch availability when dates change or catalog loads
  React.useEffect(() => {
    async function checkAvail() {
      if (!catalog || catalog.length === 0 || !rentStart || !rentEnd) return
      setCheckingAvailability(true)
      try {
        const eqIds = catalog.map((c) => c.id)
        const results = (await checkEquipmentAvailabilityFn({
          data: {
            equipmentIds: eqIds,
            rentStart,
            rentEnd,
          },
        })) as Record<string, { availableStock: number }>
        const map: Record<string, number> = {}
        for (const [id, res] of Object.entries(results)) {
          map[id] = res.availableStock
        }
        setAvailabilityMap(map)
      } catch {
        // Fallback to total stock if check fails
      } finally {
        setCheckingAvailability(false)
      }
    }

    checkAvail()
  }, [catalog, rentStart, rentEnd])

  // When selected equipment changes, prepopulate unit price and source
  function handleSelectEquipment(eqId: string) {
    setSelectedEquipmentId(eqId)
    const eq = catalog?.find((c) => c.id === eqId)
    if (eq) {
      setAddUnitPrice(eq.pricePerDay)
      const available = availabilityMap[eqId] ?? eq.totalStock
      if (available <= 0) {
        setAddSource('OUTSOURCE')
      } else {
        setAddSource('STOCK')
      }
    }
  }

  function handleAddItem() {
    if (!selectedEquipmentId) return
    const eq = catalog?.find((c) => c.id === selectedEquipmentId)
    if (!eq) return

    if (addUnitPrice === '' || Number(addUnitPrice) < 0) {
      setErrorMessage('Harga sewa per hari harus diisi')
      return
    }

    if (addQuantity < 1) {
      setErrorMessage('Jumlah unit minimal 1')
      return
    }

    const available = availabilityMap[eq.id] ?? eq.totalStock

    addItem({
      equipmentId: eq.id,
      equipmentName: eq.name,
      source: addSource,
      supplierName: addSource === 'OUTSOURCE' ? addSupplier.trim() || undefined : undefined,
      costPrice:
        addSource === 'OUTSOURCE' && addCostPrice !== ''
          ? Number(addCostPrice)
          : undefined,
      quantity: addQuantity,
      unitPrice: Number(addUnitPrice),
      availableStock: available,
    })

    // Reset picker
    setSelectedEquipmentId('')
    setAddQuantity(1)
    setAddUnitPrice('')
    setAddSupplier('')
    setAddCostPrice('')
    setAddSource('STOCK')
    setErrorMessage(null)
  }

  // Calculate totals
  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0)
  const total = Math.max(0, subtotal - discount)
  const derivedPayment =
    amountPaid <= 0 ? 'Belum Bayar' : amountPaid < total ? 'DP' : 'Lunas'

  const createMutation = useMutation({
    mutationFn: createInvoiceFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
      resetDraft()
      router.navigate({ to: `/invoices/${data.id}` as any })
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Gagal menyimpan invoice')
    },
  })

  function handleSubmitInvoice(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (!customerName.trim()) {
      setErrorMessage('Nama pelanggan wajib diisi')
      return
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Nomor HP pelanggan wajib diisi')
      return
    }

    if (items.length === 0) {
      setErrorMessage('Tambahkan minimal 1 perlengkapan ke dalam invoice')
      return
    }

    createMutation.mutate({
      data: {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        rentStart,
        rentEnd,
        days,
        status: status as any,
        amountPaid,
        discount,
        notes: notes.trim() || null,
        items: items.map((it) => ({
          equipmentId: it.equipmentId,
          equipmentName: it.equipmentName,
          source: it.source,
          supplierName: it.supplierName,
          costPrice: it.costPrice,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      },
    })
  }

  const filteredCatalog = catalog

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={'/invoices' as any}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buat Invoice Baru</h1>
          <p className="text-xs text-muted-foreground">
            Pilih tanggal sewa, cek ketersediaan stok fisik, dan susun pesanan pelanggan.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitInvoice} className="space-y-6">
        {/* Step 1: Customer Information & Rental Dates */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Info Card */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span>Data Pelanggan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="cust-name" className="text-xs">
                  Nama Pelanggan *
                </Label>
                <Input
                  id="cust-name"
                  placeholder="Contoh: Rian Pratama"
                  value={customerName}
                  onChange={(e) => setCustomerInfo(e.target.value, customerPhone)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="cust-phone" className="text-xs">
                  Nomor HP (WhatsApp) *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="cust-phone"
                    placeholder="081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerInfo(customerName, e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Dates Card */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <span>Jadwal & Durasi Sewa</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="rent-start" className="text-xs">
                    Tgl Mulai *
                  </Label>
                  <Input
                    id="rent-start"
                    type="date"
                    value={rentStart}
                    onChange={(e) => setDates(e.target.value, rentEnd)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="rent-end" className="text-xs">
                    Tgl Selesai *
                  </Label>
                  <Input
                    id="rent-end"
                    type="date"
                    value={rentEnd}
                    onChange={(e) => setDates(rentStart, e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div>
                  <div className="text-xs font-medium">Durasi Sewa Inklusif</div>
                  <div className="text-[11px] text-muted-foreground">
                    Tgl selesai dihitung penuh (inklusif)
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-16 text-center font-bold tabular-nums h-8"
                  />
                  <span className="text-xs font-medium">Hari</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step 2: Equipment Item Picker */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Package className="size-4 text-muted-foreground" />
                  <span>Daftar Perlengkapan Sewa</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Stok di bawah ini otomatis disinkronkan dengan jadwal sewa {rentStart} s/d {rentEnd}.
                </CardDescription>
              </div>
              {checkingAvailability && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  <span>Memeriksa ketersediaan...</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Catalog Selector Form */}
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <div className="text-xs font-semibold text-foreground">
                + Tambah Alat ke Invoice
              </div>

              <div className="grid gap-3 sm:grid-cols-12">
                {/* Equipment Dropdown */}
                <div className="sm:col-span-5 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Pilih Equipment</Label>
                  <Select
                    value={selectedEquipmentId || null}
                    onValueChange={(val) => handleSelectEquipment(val ?? '')}
                    items={filteredCatalog?.map((eq) => ({
                      value: eq.id,
                      label: `${eq.name} (Tersedia: ${availabilityMap[eq.id] ?? eq.totalStock} / ${eq.totalStock})`,
                    }))}
                  >
                    <SelectTrigger className="h-9 w-full text-xs">
                      <SelectValue placeholder="-- Pilih Equipment --" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--anchor-width)]">
                      {filteredCatalog?.map((eq) => {
                        const avail = availabilityMap[eq.id] ?? eq.totalStock
                        return (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.name} (Tersedia: {avail} / {eq.totalStock})
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Source: Stock vs Outsource */}
                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Sumber Item</Label>
                  <Select
                    value={addSource}
                    onValueChange={(val) => val && setAddSource(val as any)}
                    items={[
                      { value: 'STOCK', label: 'Stock Sendiri' },
                      { value: 'OUTSOURCE', label: 'Outsource (Vendor Luar)' },
                    ]}
                  >
                    <SelectTrigger className="h-9 w-full text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STOCK">Stock Sendiri</SelectItem>
                      <SelectItem value="OUTSOURCE">Outsource (Vendor Luar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Jumlah (Unit)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(Math.max(1, Number(e.target.value)))}
                    className="h-9 text-center tabular-nums text-xs"
                  />
                </div>

                {/* Unit Price per Day */}
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Tarif/Hari (Rp)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Harga/hari"
                    value={addUnitPrice}
                    onChange={(e) =>
                      setAddUnitPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="h-9 tabular-nums text-xs"
                  />
                </div>
              </div>

              {/* Extra Outsource Fields */}
              {addSource === 'OUTSOURCE' && (
                <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border/60">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Nama Supplier / Vendor Luar
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Contoh: Merbabu Outdoor Camp"
                        value={addSupplier}
                        onChange={(e) => setAddSupplier(e.target.value)}
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Harga Modal per Hari (Opsional, untuk laba internal)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Contoh: 30000"
                      value={addCostPrice}
                      onChange={(e) =>
                        setAddCostPrice(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="h-8 tabular-nums text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddItem}
                  disabled={!selectedEquipmentId}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Tambahkan Item</span>
                </Button>
              </div>
            </div>

            {/* Added Items Table */}
            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Belum ada perlengkapan yang ditambahkan ke invoice ini.
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="py-2.5 px-3 text-left font-medium">Perlengkapan</th>
                      <th className="py-2.5 px-2 text-center font-medium">Sumber</th>
                      <th className="py-2.5 px-2 text-center font-medium">Qty</th>
                      <th className="py-2.5 px-3 text-right font-medium">Tarif / Hari</th>
                      <th className="py-2.5 px-3 text-right font-medium">Total ({days} hari)</th>
                      <th className="py-2.5 px-2 text-center font-medium">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((it) => (
                      <tr key={it.tempId} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {it.equipmentName}
                          {it.supplierName && (
                            <div className="text-[10px] text-muted-foreground">
                              Vendor: {it.supplierName}
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

                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) =>
                              updateItem(it.tempId, {
                                quantity: Math.max(1, Number(e.target.value)),
                              })
                            }
                            className="w-14 rounded border border-input bg-transparent py-0.5 text-center font-medium tabular-nums text-xs"
                          />
                        </td>

                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {formatIDR(it.unitPrice)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-bold tabular-nums text-foreground">
                          {formatIDR(it.lineTotal)}
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(it.tempId)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded"
                            title="Hapus baris"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Payment, Discount, Status & Submission */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Notes & Status */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Status & Catatan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="inv-status" className="text-xs">
                  Status Awal Invoice
                </Label>
                <Select
                  value={status}
                  onValueChange={(val) => val && setStatus(val as any)}
                  items={[
                    { value: 'BOOKED', label: 'Booked (Jadwalkan & Kunci Stok)' },
                    { value: 'ACTIVE', label: 'Active (Barang Sudah Diambil)' },
                    { value: 'DRAFT', label: 'Draft (Penawaran Belum Final)' },
                  ]}
                >
                  <SelectTrigger id="inv-status" className="h-9 w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--anchor-width)]">
                    <SelectItem value="BOOKED">Booked (Jadwalkan & Kunci Stok)</SelectItem>
                    <SelectItem value="ACTIVE">Active (Barang Sudah Diambil)</SelectItem>
                    <SelectItem value="DRAFT">Draft (Penawaran Belum Final)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-notes" className="text-xs">
                  Catatan Transaksi / Penjamin (Opsional)
                </Label>
                <Textarea
                  id="inv-notes"
                  placeholder="KTP ditahan, lokasi pendakian Gunung Prau, perkiraan jam ambil..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Rincian Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Subtotal Sewa</span>
                <span className="font-semibold tabular-nums">{formatIDR(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs">
                <Label htmlFor="inv-discount" className="text-muted-foreground shrink-0">
                  Potongan / Diskon (IDR)
                </Label>
                <Input
                  id="inv-discount"
                  type="number"
                  min="0"
                  step="5000"
                  value={discount === 0 ? '' : discount}
                  placeholder="0"
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="h-8 w-32 text-right tabular-nums text-xs"
                />
              </div>

              <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
                <span className="font-bold">Total Akhir Tagihan</span>
                <span className="text-base font-bold tabular-nums text-foreground">
                  {formatIDR(total)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs pt-1">
                <Label htmlFor="inv-paid" className="text-muted-foreground shrink-0">
                  Jumlah Pembayaran Awal / DP
                </Label>
                <Input
                  id="inv-paid"
                  type="number"
                  min="0"
                  step="10000"
                  value={amountPaid === 0 ? '' : amountPaid}
                  placeholder="0"
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="h-8 w-32 text-right tabular-nums text-xs"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-xs">
                <span className="text-muted-foreground">Status Pembayaran:</span>
                <span className="font-semibold text-foreground">{derivedPayment}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to={'/invoices' as any}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-xs font-medium hover:bg-accent"
          >
            Batal
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending || items.length === 0}
            className="min-w-36"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan & Buat Invoice'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
