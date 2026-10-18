import { z } from 'zod'

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

export const categoryCreateSchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter').max(50, 'Nama kategori maksimal 50 karakter'),
  slug: z.string().optional(),
})

export const categoryUpdateSchema = z.object({
  id: z.string().min(1, 'ID kategori diperlukan'),
  name: z.string().min(2, 'Nama kategori minimal 2 karakter').max(50, 'Nama kategori maksimal 50 karakter'),
  slug: z.string().min(2, 'Slug minimal 2 karakter').max(50, 'Slug maksimal 50 karakter'),
})

export const categoryDeleteSchema = z.object({
  id: z.string().min(1, 'ID kategori diperlukan'),
})

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
export type CategoryDeleteInput = z.infer<typeof categoryDeleteSchema>
