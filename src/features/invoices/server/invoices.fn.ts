import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/features/auth/server/auth.middleware'
import {
  invoiceCreateSchema,
  invoiceUpdateSchema,
  invoiceFilterSchema,
  invoiceRecordPaymentSchema,
  invoiceUpdateStatusSchema,
} from '../schemas'
import { prisma } from '@/lib/prisma'
import { getNextInvoiceNumber } from '@/lib/invoice-number'
import { calculateRentalDays } from '@/lib/dates'
import { calculateAvailableStock } from '@/lib/availability'
import { InvoiceStatus, PaymentStatus, ItemSource } from '@prisma/client'
import { z } from 'zod'

function derivePaymentStatus(amountPaid: number, total: number): PaymentStatus {
  if (amountPaid <= 0) return PaymentStatus.UNPAID
  if (amountPaid < total) return PaymentStatus.DP
  return PaymentStatus.PAID
}

export const listInvoicesFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: unknown) => invoiceFilterSchema.optional().parse(data))
  .handler(async ({ data }) => {
    const where: any = {}

    if (data?.status) {
      where.status = data.status
    }

    if (data?.paymentStatus) {
      where.paymentStatus = data.paymentStatus
    }

    if (data?.search && data.search.trim()) {
      const q = data.search.trim()
      where.OR = [
        { number: { contains: q, mode: 'insensitive' } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (data?.startDate) {
      where.rentStart = { gte: new Date(data.startDate) }
    }

    if (data?.endDate) {
      where.rentEnd = { lte: new Date(data.endDate) }
    }

    const page = data?.page ?? 1
    const pageSize = data?.pageSize ?? 10
    const skip = (page - 1) * pageSize

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          _count: {
            select: { items: true },
          },
        },
      }),
    ])

    const totalPages = Math.ceil(total / pageSize) || 1

    return {
      items: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        publicToken: inv.publicToken,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        rentStart: inv.rentStart.toISOString().split('T')[0],
        rentEnd: inv.rentEnd.toISOString().split('T')[0],
        days: inv.days,
        status: inv.status,
        paymentStatus: inv.paymentStatus,
        amountPaid: inv.amountPaid,
        subtotal: inv.subtotal,
        discount: inv.discount,
        total: inv.total,
        itemCount: inv._count.items,
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages,
    }
  })

export const getInvoiceFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const inv = await prisma.invoice.findUnique({
      where: { id: data.id },
      include: {
        items: {
          include: {
            equipment: {
              select: {
                id: true,
                imagePath: true,
                totalStock: true,
              },
            },
          },
          orderBy: { equipmentName: 'asc' },
        },
      },
    })

    if (!inv) {
      throw new Error('Invoice tidak ditemukan')
    }

    return {
      id: inv.id,
      number: inv.number,
      publicToken: inv.publicToken,
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      rentStart: inv.rentStart.toISOString().split('T')[0],
      rentEnd: inv.rentEnd.toISOString().split('T')[0],
      days: inv.days,
      status: inv.status,
      paymentStatus: inv.paymentStatus,
      amountPaid: inv.amountPaid,
      subtotal: inv.subtotal,
      discount: inv.discount,
      total: inv.total,
      notes: inv.notes,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
      items: inv.items.map((it) => ({
        id: it.id,
        equipmentId: it.equipmentId,
        equipmentName: it.equipmentName,
        source: it.source,
        supplierName: it.supplierName,
        costPrice: it.costPrice,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
        imagePath: it.equipment?.imagePath,
      })),
    }
  })

export const createInvoiceFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => invoiceCreateSchema.parse(data))
  .handler(async ({ data }) => {
    const startDate = new Date(data.rentStart)
    const endDate = new Date(data.rentEnd)
    const days = data.days || calculateRentalDays(data.rentStart, data.rentEnd)

    return await prisma.$transaction(async (tx) => {
      // 1. Stock availability validation for all STOCK items
      const stockDemandMap = new Map<string, number>()
      for (const item of data.items) {
        if (item.source === 'STOCK') {
          const current = stockDemandMap.get(item.equipmentId) || 0
          stockDemandMap.set(item.equipmentId, current + item.quantity)
        }
      }

      if (['BOOKED', 'ACTIVE'].includes(data.status)) {
        for (const [equipmentId, requestedQty] of stockDemandMap.entries()) {
          const eq = await tx.equipment.findUnique({
            where: { id: equipmentId },
            select: { name: true, totalStock: true },
          })

          if (!eq) {
            throw new Error(`Equipment ${equipmentId} tidak ditemukan`)
          }

          const bookedAgg = await tx.invoiceItem.aggregate({
            where: {
              equipmentId,
              source: ItemSource.STOCK,
              invoice: {
                status: { in: [InvoiceStatus.BOOKED, InvoiceStatus.ACTIVE] },
                rentStart: { lte: endDate },
                rentEnd: { gte: startDate },
              },
            },
            _sum: { quantity: true },
          })

          const bookedQty = bookedAgg._sum.quantity || 0
          const available = calculateAvailableStock(eq.totalStock, bookedQty)

          if (requestedQty > available) {
            throw new Error(
              `Stok tidak mencukupi untuk "${eq.name}". Tersedia: ${available} unit, Diminta: ${requestedQty} unit pada periode tersebut. Ubah ke sumber Outsource jika ingin tetap menyewakan.`,
            )
          }
        }
      }

      // 2. Compute financial totals
      let subtotal = 0
      const itemsToCreate = data.items.map((item) => {
        const lineTotal = item.quantity * item.unitPrice * days
        subtotal += lineTotal
        return {
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          source: item.source as ItemSource,
          supplierName: item.source === 'OUTSOURCE' ? item.supplierName || null : null,
          costPrice: item.source === 'OUTSOURCE' ? item.costPrice || null : null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal,
        }
      })

      const total = Math.max(0, subtotal - data.discount)
      const paymentStatus = derivePaymentStatus(data.amountPaid, total)

      // 3. Atomically generate sequence invoice number
      const year = startDate.getFullYear() || new Date().getFullYear()
      const invoiceNumber = await getNextInvoiceNumber(year, tx)

      // 4. Create invoice
      const created = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          customerName: data.customerName.trim(),
          customerPhone: data.customerPhone.trim(),
          rentStart: startDate,
          rentEnd: endDate,
          days,
          status: data.status as InvoiceStatus,
          paymentStatus,
          amountPaid: data.amountPaid,
          subtotal,
          discount: data.discount,
          total,
          notes: data.notes?.trim() || null,
          items: {
            create: itemsToCreate,
          },
        },
      })

      return {
        id: created.id,
        number: created.number,
        publicToken: created.publicToken,
      }
    })
  })

export const updateInvoiceFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => invoiceUpdateSchema.parse(data))
  .handler(async ({ data }) => {
    const startDate = new Date(data.rentStart)
    const endDate = new Date(data.rentEnd)
    const days = data.days || calculateRentalDays(data.rentStart, data.rentEnd)

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findUnique({
        where: { id: data.id },
      })

      if (!existing) {
        throw new Error('Invoice tidak ditemukan')
      }

      // 1. Stock availability validation excluding this invoice
      if (['BOOKED', 'ACTIVE'].includes(data.status)) {
        const stockDemandMap = new Map<string, number>()
        for (const item of data.items) {
          if (item.source === 'STOCK') {
            const current = stockDemandMap.get(item.equipmentId) || 0
            stockDemandMap.set(item.equipmentId, current + item.quantity)
          }
        }

        for (const [equipmentId, requestedQty] of stockDemandMap.entries()) {
          const eq = await tx.equipment.findUnique({
            where: { id: equipmentId },
            select: { name: true, totalStock: true },
          })

          if (!eq) {
            throw new Error(`Equipment ${equipmentId} tidak ditemukan`)
          }

          const bookedAgg = await tx.invoiceItem.aggregate({
            where: {
              equipmentId,
              source: ItemSource.STOCK,
              invoice: {
                id: { not: data.id },
                status: { in: [InvoiceStatus.BOOKED, InvoiceStatus.ACTIVE] },
                rentStart: { lte: endDate },
                rentEnd: { gte: startDate },
              },
            },
            _sum: { quantity: true },
          })

          const bookedQty = bookedAgg._sum.quantity || 0
          const available = calculateAvailableStock(eq.totalStock, bookedQty)

          if (requestedQty > available) {
            throw new Error(
              `Stok tidak mencukupi untuk "${eq.name}". Tersedia: ${available} unit, Diminta: ${requestedQty} unit pada periode tersebut.`,
            )
          }
        }
      }

      // 2. Compute financial totals
      let subtotal = 0
      const itemsToCreate = data.items.map((item) => {
        const lineTotal = item.quantity * item.unitPrice * days
        subtotal += lineTotal
        return {
          invoiceId: data.id,
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          source: item.source as ItemSource,
          supplierName: item.source === 'OUTSOURCE' ? item.supplierName || null : null,
          costPrice: item.source === 'OUTSOURCE' ? item.costPrice || null : null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal,
        }
      })

      const total = Math.max(0, subtotal - data.discount)
      const paymentStatus = derivePaymentStatus(data.amountPaid, total)

      // 3. Delete old items and insert fresh snapshots
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: data.id },
      })

      await tx.invoiceItem.createMany({
        data: itemsToCreate,
      })

      // 4. Update invoice header
      const updated = await tx.invoice.update({
        where: { id: data.id },
        data: {
          customerName: data.customerName.trim(),
          customerPhone: data.customerPhone.trim(),
          rentStart: startDate,
          rentEnd: endDate,
          days,
          status: data.status as InvoiceStatus,
          paymentStatus,
          amountPaid: data.amountPaid,
          subtotal,
          discount: data.discount,
          total,
          notes: data.notes?.trim() || null,
        },
      })

      return {
        id: updated.id,
        number: updated.number,
      }
    })
  })

export const updateInvoiceStatusFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => invoiceUpdateStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const updated = await prisma.invoice.update({
      where: { id: data.id },
      data: { status: data.status as InvoiceStatus },
    })

    return { id: updated.id, status: updated.status }
  })

export const recordInvoicePaymentFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => invoiceRecordPaymentSchema.parse(data))
  .handler(async ({ data }) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.id },
      select: { total: true },
    })

    if (!invoice) {
      throw new Error('Invoice tidak ditemukan')
    }

    const paymentStatus = derivePaymentStatus(data.amountPaid, invoice.total)

    const updated = await prisma.invoice.update({
      where: { id: data.id },
      data: {
        amountPaid: data.amountPaid,
        paymentStatus,
      },
    })

    return {
      id: updated.id,
      amountPaid: updated.amountPaid,
      paymentStatus: updated.paymentStatus,
    }
  })
