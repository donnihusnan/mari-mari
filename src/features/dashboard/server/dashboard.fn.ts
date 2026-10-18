import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/features/auth/server/auth.middleware'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus, PaymentStatus } from '@prisma/client'

export const getDashboardDataFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    // Current date in Asia/Jakarta (start of today)
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const today = new Date(todayStr)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // First day of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

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
          status: InvoiceStatus.ACTIVE,
          rentEnd: { lte: today },
        },
        orderBy: { rentEnd: 'asc' },
        take: 5,
        select: {
          id: true,
          number: true,
          customerName: true,
          customerPhone: true,
          rentEnd: true,
          total: true,
          paymentStatus: true,
        },
      }),

      // 5. Pickups scheduled for today
      prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.BOOKED,
          rentStart: { lte: today },
        },
        orderBy: { rentStart: 'asc' },
        take: 5,
        select: {
          id: true,
          number: true,
          customerName: true,
          customerPhone: true,
          rentStart: true,
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
        total: inv.total,
        paymentStatus: inv.paymentStatus,
      })),
      todayPickups: todayPickups.map((inv) => ({
        id: inv.id,
        number: inv.number,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        rentStart: inv.rentStart.toISOString().split('T')[0],
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
