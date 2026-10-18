import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/features/auth/server/auth.middleware'
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  categoryDeleteSchema,
  slugify,
} from '../schemas'
import { prisma } from '@/lib/prisma'

export const listCategoriesFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            equipment: {
              where: { deletedAt: null },
            },
          },
        },
      },
    })

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      equipmentCount: cat._count.equipment,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    }))
  })

export const createCategoryFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => categoryCreateSchema.parse(data))
  .handler(async ({ data }) => {
    const slug = data.slug?.trim() ? slugify(data.slug) : slugify(data.name)

    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: data.name.trim() }, { slug }],
      },
    })

    if (existing) {
      throw new Error(
        existing.name.toLowerCase() === data.name.trim().toLowerCase()
          ? 'Kategori dengan nama tersebut sudah ada'
          : 'Slug kategori sudah digunakan, silakan pilih slug lain',
      )
    }

    const created = await prisma.category.create({
      data: {
        name: data.name.trim(),
        slug,
      },
    })

    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      equipmentCount: 0,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    }
  })

export const updateCategoryFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => categoryUpdateSchema.parse(data))
  .handler(async ({ data }) => {
    const slug = slugify(data.slug)

    const duplicate = await prisma.category.findFirst({
      where: {
        id: { not: data.id },
        OR: [{ name: data.name.trim() }, { slug }],
      },
    })

    if (duplicate) {
      throw new Error(
        duplicate.name.toLowerCase() === data.name.trim().toLowerCase()
          ? 'Kategori lain sudah menggunakan nama ini'
          : 'Slug kategori sudah digunakan oleh kategori lain',
      )
    }

    const updated = await prisma.category.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        slug,
      },
    })

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  })

export const deleteCategoryFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => categoryDeleteSchema.parse(data))
  .handler(async ({ data }) => {
    const activeEquipmentCount = await prisma.equipment.count({
      where: {
        categoryId: data.id,
        deletedAt: null,
      },
    })

    if (activeEquipmentCount > 0) {
      throw new Error(
        `Kategori tidak dapat dihapus karena masih digunakan oleh ${activeEquipmentCount} equipment aktif. Hapus atau pindahkan equipment terlebih dahulu.`,
      )
    }

    await prisma.category.delete({
      where: { id: data.id },
    })

    return { success: true }
  })
