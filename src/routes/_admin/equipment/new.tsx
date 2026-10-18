import * as React from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesQueryOptions } from '@/features/categories/queries'
import { equipmentKeys } from '@/features/equipment/queries'
import { createEquipmentFn } from '@/features/equipment/server/equipment.fn'
import { uploadEquipmentImage } from '@/features/equipment/lib/upload-image'
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
import { ArrowLeft, Upload, Loader2, AlertCircle, X, Image as ImageIcon } from 'lucide-react'

export const Route = createFileRoute('/_admin/equipment/new')({
  component: NewEquipmentPage,
})

function NewEquipmentPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: categories, isLoading: categoriesLoading } = useQuery(categoriesQueryOptions())

  // Form states
  const [name, setName] = React.useState('')
  const [categoryId, setCategoryId] = React.useState('')
  const [pricePerDay, setPricePerDay] = React.useState<number | ''>('')
  const [totalStock, setTotalStock] = React.useState<number | ''>(0)
  const [description, setDescription] = React.useState('')
  const [isActive, setIsActive] = React.useState(true)

  // Image states
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Format gambar harus JPEG, PNG, atau WebP')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Ukuran file gambar maksimal 2 MB')
      return
    }

    setErrorMessage(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveImage() {
    setImageFile(null)
    setImagePreview(null)
  }

  const createMutation = useMutation({
    mutationFn: createEquipmentFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
      router.navigate({ to: '/equipment' as any })
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Gagal menyimpan equipment')
    },
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage('Nama equipment wajib diisi')
      return
    }

    if (!categoryId) {
      setErrorMessage('Kategori wajib dipilih')
      return
    }

    if (pricePerDay === '' || Number(pricePerDay) < 0) {
      setErrorMessage('Harga sewa per hari harus diisi dengan angka positif')
      return
    }

    try {
      let uploadedPath: string | null = null
      if (imageFile) {
        setIsUploading(true)
        uploadedPath = await uploadEquipmentImage(imageFile)
        setIsUploading(false)
      }

      createMutation.mutate({
        data: {
          name: name.trim(),
          categoryId,
          pricePerDay: Number(pricePerDay),
          totalStock: totalStock === '' ? 0 : Number(totalStock),
          description: description.trim() || null,
          imagePath: uploadedPath,
          isActive,
        },
      })
    } catch (err: unknown) {
      setIsUploading(false)
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat upload gambar'
      setErrorMessage(msg)
    }
  }

  const isSubmitting = isUploading || createMutation.isPending

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={'/equipment' as any}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Equipment Baru</h1>
          <p className="text-xs text-muted-foreground">
            Lengkapi data perlengkapan outdoor untuk katalog Mari Mari Equipment.
          </p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Informasi Perlengkapan</CardTitle>
          <CardDescription className="text-xs">
            Pastikan harga dan ketersediaan stok fisik sesuai kondisi terkini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-6 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload Area */}
            <div className="space-y-1.5">
              <Label className="text-xs">Foto Equipment</Label>
              <div className="flex items-center gap-4">
                <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted">
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-xs hover:opacity-90"
                      >
                        <X className="size-3" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="size-8 text-muted-foreground/50" />
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="equipment-img"
                    className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-3 text-xs font-medium hover:bg-accent transition"
                  >
                    <Upload className="size-3.5" />
                    <span>Pilih Foto</span>
                  </label>
                  <input
                    id="equipment-img"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Format: JPG, PNG, atau WebP. Maks 2 MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="eq-name" className="text-xs">
                Nama Equipment *
              </Label>
              <Input
                id="eq-name"
                placeholder="Contoh: Tenda Dome 4P Double Layer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="eq-category" className="text-xs">
                Kategori *
              </Label>
              <Select
                value={categoryId || null}
                onValueChange={(val) => setCategoryId(val ?? '')}
                items={categories?.map((cat) => ({ value: cat.id, label: cat.name }))}
                disabled={categoriesLoading || isSubmitting}
              >
                <SelectTrigger id="eq-category" className="h-9 w-full text-sm">
                  <SelectValue placeholder="Pilih Kategori Perlengkapan" />
                </SelectTrigger>
                <SelectContent className="w-[var(--anchor-width)]">
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price & Stock */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="eq-price" className="text-xs">
                  Harga Sewa / Hari (IDR) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-medium text-muted-foreground pointer-events-none">
                    Rp
                  </span>
                  <Input
                    id="eq-price"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="50000"
                    value={pricePerDay}
                    onChange={(e) =>
                      setPricePerDay(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="pl-9 tabular-nums"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eq-stock" className="text-xs">
                  Total Stok Fisik (Unit) *
                </Label>
                <Input
                  id="eq-stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="5"
                  value={totalStock}
                  onChange={(e) =>
                    setTotalStock(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="tabular-nums"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-[11px] text-muted-foreground">
                  Isi 0 jika item katalog ini khusus outsource.
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="eq-desc" className="text-xs">
                Deskripsi & Kelengkapan (Opsional)
              </Label>
              <Textarea
                id="eq-desc"
                placeholder="Spesifikasi, kelengkapan pasak/frame, atau catatan kondisi alat..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Is Active Toggle */}
            <div className="flex items-center gap-2 pt-2">
              <input
                id="eq-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
                className="size-4 rounded border-border text-primary accent-primary"
              />
              <Label htmlFor="eq-active" className="cursor-pointer text-xs font-medium">
                Tampilkan di katalog aktif (Dapat dipilih saat membuat invoice baru)
              </Label>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link
                to={'/equipment' as any}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-xs font-medium hover:bg-accent"
              >
                Batal
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isUploading ? 'Mengunggah Foto...' : 'Simpan Equipment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
