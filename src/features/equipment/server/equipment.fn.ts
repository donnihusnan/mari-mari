import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/features/auth/server/auth.middleware'
import {
  equipmentCreateSchema,
  equipmentUpdateSchema,
  equipmentDeleteSchema,
  equipmentFilterSchema,
} from '../schemas'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const listEquipmentFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: unknown) => equipmentFilterSchema.optional().parse(data))
  .handler(async ({ data }) => {
    const where: any = {
      deletedAt: null,
    }

    if (data?.categoryId) {
      where.categoryId = data.categoryId
    }

    if (data?.search && data.search.trim()) {
      where.name = {
        contains: data.search.trim(),
        mode: 'insensitive',
      }
    }

    if (data?.isActive !== undefined) {
      where.isActive = data.isActive
    }

    const page = data?.page ?? 1
    const pageSize = data?.pageSize ?? 10
    const skip = (page - 1) * pageSize

    const [total, items] = await Promise.all([
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
    ])

    const totalPages = Math.ceil(total / pageSize) || 1

    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        pricePerDay: item.pricePerDay,
        totalStock: item.totalStock,
        imagePath: item.imagePath,
        isActive: item.isActive,
        categoryId: item.categoryId,
        categoryName: item.category.name,
        categorySlug: item.category.slug,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages,
    }
  })

export const getEquipmentFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const item = await prisma.equipment.findFirst({
      where: {
        id: data.id,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!item) {
      throw new Error('Equipment tidak ditemukan atau sudah dihapus')
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      pricePerDay: item.pricePerDay,
      totalStock: item.totalStock,
      imagePath: item.imagePath,
      isActive: item.isActive,
      categoryId: item.categoryId,
      categoryName: item.category.name,
      categorySlug: item.category.slug,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }
  })

export const createEquipmentFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => equipmentCreateSchema.parse(data))
  .handler(async ({ data }) => {
    const categoryExists = await prisma.category.findUnique({
      where: { id: data.categoryId },
    })

    if (!categoryExists) {
      throw new Error('Kategori yang dipilih tidak valid')
    }

    const created = await prisma.equipment.create({
      data: {
        name: data.name.trim(),
        categoryId: data.categoryId,
        description: data.description?.trim() || null,
        pricePerDay: data.pricePerDay,
        totalStock: data.totalStock,
        imagePath: data.imagePath || null,
        isActive: data.isActive,
      },
      include: {
        category: true,
      },
    })

    return {
      id: created.id,
      name: created.name,
      pricePerDay: created.pricePerDay,
      totalStock: created.totalStock,
      imagePath: created.imagePath,
      isActive: created.isActive,
    }
  })

export const updateEquipmentFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => equipmentUpdateSchema.parse(data))
  .handler(async ({ data }) => {
    const existing = await prisma.equipment.findFirst({
      where: { id: data.id, deletedAt: null },
    })

    if (!existing) {
      throw new Error('Equipment tidak ditemukan')
    }

    const categoryExists = await prisma.category.findUnique({
      where: { id: data.categoryId },
    })

    if (!categoryExists) {
      throw new Error('Kategori yang dipilih tidak valid')
    }

    const updated = await prisma.equipment.update({
      where: { id: data.id },
      data: {
        name: data.name.trim(),
        categoryId: data.categoryId,
        description: data.description?.trim() || null,
        pricePerDay: data.pricePerDay,
        totalStock: data.totalStock,
        imagePath: data.imagePath !== undefined ? data.imagePath : existing.imagePath,
        isActive: data.isActive,
      },
    })

    return {
      id: updated.id,
      name: updated.name,
      pricePerDay: updated.pricePerDay,
      totalStock: updated.totalStock,
      imagePath: updated.imagePath,
      isActive: updated.isActive,
    }
  })

export const deleteEquipmentFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => equipmentDeleteSchema.parse(data))
  .handler(async ({ data }) => {
    const existing = await prisma.equipment.findFirst({
      where: { id: data.id, deletedAt: null },
    })

    if (!existing) {
      throw new Error('Equipment tidak ditemukan')
    }

    // Soft delete: sets deletedAt
    await prisma.equipment.update({
      where: { id: data.id },
      data: { deletedAt: new Date() },
    })

    return { success: true }
  })
