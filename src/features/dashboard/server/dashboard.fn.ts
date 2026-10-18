import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/features/auth/server/auth.middleware'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus, PaymentStatus } from '@prisma/client'
import { z } from 'zod'

export const getDashboardDataFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    // Current date in Asia/Jakarta
    const jakartaDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())

    const endOfToday = new Date(`${jakartaDateStr}T23:59:59.999Z`)

    // First day of current month in Jakarta
    const [yearNum, monthNum] = jakartaDateStr.split('-').map(Number)
    const startOfMonth = new Date(Date.UTC(yearNum, monthNum - 1, 1))

    const [
      activeCount,
      bookedCount,
      unpaidCount,
      todayReturns,
      todayPickups,
      recentInvoices,
      monthRevenueAgg,
      totalEquipmentCount,
    ] = await Promise.all([
      // 1. Active rentals
      prisma.invoice.count({
        where: { status: InvoiceStatus.ACTIVE },
      }),

      // 2. Booked waiting for pickup
      prisma.invoice.count({
        where: { status: InvoiceStatus.BOOKED },
      }),

      // 3. Unpaid or DP
      prisma.invoice.count({
        where: {
          paymentStatus: { in: [PaymentStatus.UNPAID, PaymentStatus.DP] },
          status: { not: InvoiceStatus.CANCELLED },
        },
      }),

      // 4. Returns scheduled for today or overdue
      prisma.invoice.findMany({
        where: {
          status: { in: [InvoiceStatus.ACTIVE, InvoiceStatus.BOOKED] },
          rentEnd: { lte: endOfToday },
        },
        orderBy: { rentEnd: 'asc' },
        take: 10,
        select: {
          id: true,
          number: true,
          customerName: true,
          customerPhone: true,
          rentEnd: true,
          status: true,
          total: true,
          paymentStatus: true,
        },
      }),

      // 5. Pickups scheduled for today or overdue
      prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.BOOKED,
          rentStart: { lte: endOfToday },
        },
        orderBy: { rentStart: 'asc' },
        take: 10,
        select: {
          id: true,
          number: true,
          customerName: true,
          customerPhone: true,
          rentStart: true,
          status: true,
          total: true,
          paymentStatus: true,
        },
      }),

      // 6. Recent invoices
      prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          number: true,
          customerName: true,
          rentStart: true,
          rentEnd: true,
          status: true,
          paymentStatus: true,
          total: true,
          amountPaid: true,
          createdAt: true,
        },
      }),

      // 7. Month revenue sum
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          status: { not: InvoiceStatus.CANCELLED },
        },
        _sum: { amountPaid: true },
      }),

      // 8. Total catalog count
      prisma.equipment.count({
        where: { deletedAt: null },
      }),
    ])

    return {
      activeCount,
      bookedCount,
      unpaidCount,
      monthRevenue: monthRevenueAgg._sum.amountPaid || 0,
      totalEquipmentCount,
      todayReturns: todayReturns.map((inv) => ({
        id: inv.id,
        number: inv.number,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        rentEnd: inv.rentEnd.toISOString().split('T')[0],
        status: inv.status,
        total: inv.total,
        paymentStatus: inv.paymentStatus,
      })),
      todayPickups: todayPickups.map((inv) => ({
        id: inv.id,
        number: inv.number,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        rentStart: inv.rentStart.toISOString().split('T')[0],
        status: inv.status,
        total: inv.total,
        paymentStatus: inv.paymentStatus,
      })),
      recentInvoices: recentInvoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        customerName: inv.customerName,
        rentStart: inv.rentStart.toISOString().split('T')[0],
        rentEnd: inv.rentEnd.toISOString().split('T')[0],
        status: inv.status,
        paymentStatus: inv.paymentStatus,
        total: inv.total,
        amountPaid: inv.amountPaid,
        createdAt: inv.createdAt.toISOString(),
      })),
    }
  })

const calendarFilterSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
})

export const getCalendarInvoicesFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: unknown) => calendarFilterSchema.parse(data))
  .handler(async ({ data }) => {
    const { year, month } = data
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          {
            rentStart: { lte: endOfMonth },
            rentEnd: { gte: startOfMonth },
          },
          {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        ],
        status: { not: InvoiceStatus.CANCELLED },
      },
      orderBy: { rentStart: 'asc' },
      select: {
        id: true,
        number: true,
        customerName: true,
        customerPhone: true,
        rentStart: true,
        rentEnd: true,
        days: true,
        status: true,
        paymentStatus: true,
        total: true,
        amountPaid: true,
        createdAt: true,
        items: {
          select: {
            equipmentName: true,
            quantity: true,
          },
        },
      },
    })

    return invoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      rentStart: inv.rentStart.toISOString().split('T')[0],
      rentEnd: inv.rentEnd.toISOString().split('T')[0],
      days: inv.days,
      status: inv.status,
      paymentStatus: inv.paymentStatus,
      total: inv.total,
      amountPaid: inv.amountPaid,
      createdAt: inv.createdAt.toISOString(),
      items: inv.items.map((it) => ({
        name: it.equipmentName,
        quantity: it.quantity,
      })),
    }))
  })

