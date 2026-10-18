import { z } from 'zod'

export const equipmentCreateSchema = z.object({
  name: z.string().min(2, 'Nama equipment minimal 2 karakter').max(100, 'Nama equipment maksimal 100 karakter'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().nullable(),
  pricePerDay: z.coerce.number().int('Harga per hari harus bilangan bulat').min(0, 'Harga per hari minimal 0'),
  totalStock: z.coerce.number().int('Stok harus bilangan bulat').min(0, 'Stok minimal 0').default(0),
  imagePath: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export const equipmentUpdateSchema = z.object({
  id: z.string().min(1, 'ID equipment diperlukan'),
  name: z.string().min(2, 'Nama equipment minimal 2 karakter').max(100, 'Nama equipment maksimal 100 karakter'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().nullable(),
  pricePerDay: z.coerce.number().int('Harga per hari harus bilangan bulat').min(0, 'Harga per hari minimal 0'),
  totalStock: z.coerce.number().int('Stok harus bilangan bulat').min(0, 'Stok minimal 0'),
  imagePath: z.string().optional().nullable(),
  isActive: z.boolean(),
})

export const equipmentDeleteSchema = z.object({
  id: z.string().min(1, 'ID equipment diperlukan'),
})

export const equipmentFilterSchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).optional(),
})

export type EquipmentCreateInput = z.infer<typeof equipmentCreateSchema>
export type EquipmentUpdateInput = z.infer<typeof equipmentUpdateSchema>
export type EquipmentDeleteInput = z.infer<typeof equipmentDeleteSchema>
export type EquipmentFilterInput = z.input<typeof equipmentFilterSchema>
