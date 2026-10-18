import * as React from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { equipmentListQueryOptions, equipmentKeys } from '@/features/equipment/queries'
import { categoriesQueryOptions } from '@/features/categories/queries'
import { deleteEquipmentFn } from '@/features/equipment/server/equipment.fn'
import { getEquipmentImageUrl } from '@/features/equipment/lib/upload-image'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { formatIDR } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Loader2,
  AlertCircle,
  ImageIcon,
  RotateCcw,
} from 'lucide-react'

export const Route = createFileRoute('/_admin/equipment/')({
  component: EquipmentListPage,
})

function EquipmentListPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('')
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [page, setPage] = React.useState<number>(1)
  const [pageSize, setPageSize] = React.useState<number>(10)
  const [deletingId, setDeletingId] = React.useState<{ id: string; name: string } | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const activeParam =
    statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined

  const { data: categories } = useQuery(categoriesQueryOptions())

  const { data, isLoading, error } = useQuery(
    equipmentListQueryOptions({
      search: search.trim() || undefined,
      categoryId: selectedCategory || undefined,
      isActive: activeParam,
      page,
      pageSize,
    }),
  )

  const equipmentList = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEquipmentFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
      setDeletingId(null)
      setDeleteError(null)
    },
    onError: (err: Error) => {
      setDeleteError(err.message || 'Gagal menghapus equipment')
    },
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleCategoryChange = (val: string | null) => {
    setSelectedCategory(val === 'ALL' || !val ? '' : val)
    setPage(1)
  }

  const handleStatusChange = (val: string | null) => {
    if (val) {
      setStatusFilter(val as any)
      setPage(1)
    }
  }

  const handleResetFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setStatusFilter('ALL')
    setPage(1)
  }

  const hasActiveFilters = search.trim() !== '' || selectedCategory !== '' || statusFilter !== 'ALL'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Katalog Equipment</h1>
          <p className="text-sm text-muted-foreground">
            Daftar perlengkapan outdoor, ketersediaan stok fisik, dan tarif sewa harian.
          </p>
        </div>
        <Link
          to={'/equipment/new' as any}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="size-4" />
          <span>Tambah Equipment</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari nama alat..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={selectedCategory || 'ALL'}
            onValueChange={handleCategoryChange}
            items={[
              { value: 'ALL', label: 'Semua Kategori' },
              ...(categories?.map((cat) => ({ value: cat.id, label: cat.name })) ?? []),
            ]}
          >
            <SelectTrigger className="h-8 min-w-[130px] text-xs">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={handleStatusChange}
            items={[
              { value: 'ALL', label: 'Semua Status' },
              { value: 'ACTIVE', label: 'Aktif' },
              { value: 'INACTIVE', label: 'Nonaktif' },
            ]}
          >
            <SelectTrigger className="h-8 min-w-[115px] text-xs">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="ACTIVE">Aktif</SelectItem>
              <SelectItem value="INACTIVE">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Memuat daftar perlengkapan...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-6 text-sm text-destructive">
            <AlertCircle className="size-5 shrink-0" />
            <span>Terjadi kesalahan saat memuat katalog equipment.</span>
          </div>
        ) : equipmentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Package className="size-6 text-muted-foreground" />
            </div>
            {hasActiveFilters ? (
              <>
                <h3 className="mt-4 text-base font-medium">Tidak ada equipment yang cocok</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Tidak ditemukan alat dengan kata kunci pencarian atau filter kategori/status yang dipilih.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground shadow-xs transition hover:bg-muted"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reset Filter</span>
                </button>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-base font-medium">Belum ada equipment</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Tambahkan perlengkapan pertama Anda untuk mulai mencatat stok dan membuat invoice sewa.
                </p>
                <Link
                  to={'/equipment/new' as any}
                  className="mt-4 inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs transition hover:opacity-90"
                >
                  <Plus className="size-3.5" />
                  <span>Tambah Equipment Sekarang</span>
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[10%] text-center">Foto</TableHead>
                  <TableHead className="w-[35%]">Equipment & Kategori</TableHead>
                  <TableHead className="w-[20%]">Harga Sewa / Hari</TableHead>
                  <TableHead className="w-[15%] text-center">Total Stok</TableHead>
                  <TableHead className="w-[10%] text-center">Status</TableHead>
                  <TableHead className="w-[10%] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipmentList.map((item) => {
                  const imgUrl = getEquipmentImageUrl(item.imagePath)
                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => router.navigate({ to: `/equipment/${item.id}` as any })}
                      className="group cursor-pointer transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="text-center">
                        <div className="mx-auto flex size-11 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={item.name}
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <ImageIcon className="size-4 text-muted-foreground/60" />
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-foreground">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.categoryName}
                          {item.description && (
                            <span className="block max-w-xs truncate font-normal">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-semibold tabular-nums text-foreground">
                        {formatIDR(item.pricePerDay)}
                        <span className="text-[11px] font-normal text-muted-foreground"> /hari</span>
                      </TableCell>

                      <TableCell className="text-center">
                        {item.totalStock > 0 ? (
                          <Badge variant="outline" className="font-mono text-xs tabular-nums">
                            {item.totalStock} unit
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[11px]">
                            Outsource (0 unit)
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        {item.isActive ? (
                          <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Nonaktif
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/equipment/${item.id}` as any}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                            title="Edit Equipment"
                          >
                            <Pencil className="size-3.5" />
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteError(null)
                              setDeletingId({ id: item.id, name: item.name })
                            }}
                            className="size-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Hapus Equipment"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              entityName="equipment"
            />
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Equipment</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus perlengkapan{' '}
              <strong className="text-foreground">{deletingId?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="my-2 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Equipment akan diarsipkan secara aman (soft delete) sehingga data transaksi invoice masa lalu tetap utuh.
          </p>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingId(null)}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && deleteMutation.mutate(deletingId.id)}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
