import { createServerFn } from '@tanstack/react-start'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const getPublicInvoiceFn = createServerFn({ method: 'GET' })
  .validator((data: unknown) => z.object({ token: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const inv = await prisma.invoice.findUnique({
      where: { publicToken: data.token },
      select: {
        number: true,
        customerName: true,
        customerPhone: true,
        rentStart: true,
        rentEnd: true,
        days: true,
        status: true,
        paymentStatus: true,
        amountPaid: true,
        subtotal: true,
        discount: true,
        total: true,
        notes: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            equipmentName: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
          },
          orderBy: { equipmentName: 'asc' },
        },
      },
    })

    if (!inv) {
      throw new Error('Invoice tidak ditemukan atau link sudah tidak berlaku')
    }

    return {
      number: inv.number,
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
      items: inv.items,
    }
  })
