import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesQueryOptions, categoryKeys } from '@/features/categories/queries'
import {
  createCategoryFn,
  updateCategoryFn,
  deleteCategoryFn,
} from '@/features/categories/server/categories.fn'
import { slugify } from '@/features/categories/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Tags } from 'lucide-react'

export const Route = createFileRoute('/_admin/categories')({
  component: CategoriesPage,
})

interface CategoryItem {
  id: string
  name: string
  slug: string
  equipmentCount: number
  createdAt: string
  updatedAt: string
}

function CategoriesPage() {
  const queryClient = useQueryClient()
  const { data: categories, isLoading, error } = useQuery(categoriesQueryOptions())

  // Pagination states
  const [page, setPage] = React.useState<number>(1)
  const [pageSize, setPageSize] = React.useState<number>(10)

  const total = categories?.length ?? 0
  const totalPages = Math.ceil(total / pageSize) || 1

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const paginatedCategories = React.useMemo(() => {
    if (!categories) return []
    const start = (page - 1) * pageSize
    return categories.slice(start, start + pageSize)
  }, [categories, page, pageSize])

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<CategoryItem | null>(null)
  const [deletingCategory, setDeletingCategory] = React.useState<CategoryItem | null>(null)

  // Form states
  const [name, setName] = React.useState('')
  const [slug, setSlug] = React.useState('')
  const [formError, setFormError] = React.useState<string | null>(null)

  // Mutations
  const createMutation = useMutation({
    mutationFn: (vars: { name: string; slug?: string }) =>
      createCategoryFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      setIsCreateOpen(false)
      resetForm()
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Gagal menambahkan kategori')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; name: string; slug: string }) =>
      updateCategoryFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      setEditingCategory(null)
      resetForm()
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Gagal mengubah kategori')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategoryFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      setDeletingCategory(null)
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Gagal menghapus kategori')
    },
  })

  function resetForm() {
    setName('')
    setSlug('')
    setFormError(null)
  }

  function handleOpenCreate() {
    resetForm()
    setIsCreateOpen(true)
  }

  function handleOpenEdit(cat: CategoryItem) {
    resetForm()
    setEditingCategory(cat)
    setName(cat.name)
    setSlug(cat.slug)
  }

  function handleNameChange(val: string) {
    setName(val)
    if (!editingCategory) {
      setSlug(slugify(val))
    }
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!name.trim()) {
      setFormError('Nama kategori wajib diisi')
      return
    }
    createMutation.mutate({ name, slug: slug.trim() ? slug : undefined })
  }

  function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCategory) return
    setFormError(null)
    if (!name.trim()) {
      setFormError('Nama kategori wajib diisi')
      return
    }
    updateMutation.mutate({ id: editingCategory.id, name, slug })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategori Equipment</h1>
          <p className="text-sm text-muted-foreground">
            Kelola pengelompokan perlengkapan outdoor untuk memudahkan pencarian dan filter katalog.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="size-4" />
          <span>Tambah Kategori</span>
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Memuat daftar kategori...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-6 text-sm text-destructive">
            <AlertCircle className="size-5 shrink-0" />
            <span>Terjadi kesalahan saat memuat kategori.</span>
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Tags className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-medium">Belum ada kategori</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Tambahkan kategori seperti Tenda, Carrier, Cooking Set, atau Sleeping Gear untuk mulai mengelompokkan alat.
            </p>
            <Button onClick={handleOpenCreate} variant="outline" className="mt-4 gap-2 text-xs">
              <Plus className="size-3.5" />
              <span>Tambah Kategori Pertama</span>
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Nama Kategori</TableHead>
                  <TableHead className="w-[30%]">Slug</TableHead>
                  <TableHead className="w-[20%] text-center">Equipment Terdaftar</TableHead>
                  <TableHead className="w-[20%] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCategories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium text-foreground">
                      {cat.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {cat.slug}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {cat.equipmentCount} alat
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(cat)}
                          className="size-8 p-0"
                          title="Edit Kategori"
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormError(null)
                            setDeletingCategory(cat)
                          }}
                          className="size-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
              entityName="kategori"
            />
          </>
        )}
      </div>

      {/* Dialog Tambah Kategori */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Tambah Kategori</DialogTitle>
              <DialogDescription>
                Masukkan nama kategori perlengkapan baru. Slug akan dibuat secara otomatis.
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="my-3 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="my-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name" className="text-xs">
                  Nama Kategori
                </Label>
                <Input
                  id="cat-name"
                  placeholder="Contoh: Tenda & Shelter"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-slug" className="text-xs">
                  Slug URL
                </Label>
                <Input
                  id="cat-slug"
                  placeholder="tenda-shelter"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                />
                <p className="text-[11px] text-muted-foreground">
                  Digunakan untuk identifikasi unik dan filter data.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={createMutation.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Kategori */}
      <Dialog
        open={Boolean(editingCategory)}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      >
        <DialogContent>
          <form onSubmit={handleUpdateSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Kategori</DialogTitle>
              <DialogDescription>
                Ubah nama atau slug kategori perlengkapan ini.
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="my-3 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="my-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs">
                  Nama Kategori
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-slug" className="text-xs">
                  Slug URL
                </Label>
                <Input
                  id="edit-slug"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCategory(null)}
                disabled={updateMutation.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <Dialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kategori</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori{' '}
              <strong className="text-foreground">{deletingCategory?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="my-3 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {deletingCategory && deletingCategory.equipmentCount > 0 && (
            <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
              Kategori ini memiliki {deletingCategory.equipmentCount} equipment aktif. Kategori yang masih berisi alat tidak dapat dihapus.
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingCategory(null)}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                deleteMutation.isPending ||
                (Boolean(deletingCategory) && deletingCategory!.equipmentCount > 0)
              }
              onClick={() => deletingCategory && deleteMutation.mutate(deletingCategory.id)}
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
