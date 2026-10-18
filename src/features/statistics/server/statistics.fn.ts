import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/features/auth/server/auth.middleware'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus, ItemSource } from '@prisma/client'
import { z } from 'zod'

const statsFilterSchema = z.object({
  year: z.number().int().optional(),
})

export const getStatisticsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((data: unknown) => statsFilterSchema.optional().parse(data))
  .handler(async ({ data }) => {
    const currentYear = data?.year || new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1)
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59)

    // 1. All invoices in year
    const yearInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
        status: { not: InvoiceStatus.CANCELLED },
      },
      include: {
        items: true,
      },
    })

    // 2. Monthly aggregates
    const monthsData = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      monthName: new Date(currentYear, i, 1).toLocaleDateString('id-ID', { month: 'short' }),
      revenue: 0,
      invoiceCount: 0,
      itemCount: 0,
    }))

    let totalYearRevenue = 0
    let totalYearInvoices = yearInvoices.length
    let totalItemsRented = 0

    // Outsource metrics
    let totalOutsourceRevenue = 0
    let totalOutsourceCost = 0
    let totalOutsourceUnits = 0

    // Equipment rental map
    const equipmentMap = new Map<
      string,
      {
        equipmentId: string
        name: string
        rentedUnits: number
        totalRevenue: number
        invoiceCount: number
      }
    >()

    for (const inv of yearInvoices) {
      const mIdx = inv.createdAt.getMonth()
      monthsData[mIdx].revenue += inv.amountPaid
      monthsData[mIdx].invoiceCount += 1
      totalYearRevenue += inv.amountPaid

      for (const item of inv.items) {
        monthsData[mIdx].itemCount += item.quantity
        totalItemsRented += item.quantity

        // Track Outsource
        if (item.source === ItemSource.OUTSOURCE) {
          totalOutsourceUnits += item.quantity
          totalOutsourceRevenue += item.lineTotal
          if (item.costPrice) {
            totalOutsourceCost += item.costPrice * item.quantity * inv.days
          }
        }

        // Track Equipment Leaderboard
        const curr = equipmentMap.get(item.equipmentId) || {
          equipmentId: item.equipmentId,
          name: item.equipmentName,
          rentedUnits: 0,
          totalRevenue: 0,
          invoiceCount: 0,
        }
        curr.rentedUnits += item.quantity
        curr.totalRevenue += item.lineTotal
        curr.invoiceCount += 1
        equipmentMap.set(item.equipmentId, curr)
      }
    }

    const topEquipment = Array.from(equipmentMap.values())
      .sort((a, b) => b.rentedUnits - a.rentedUnits)
      .slice(0, 5)

    const totalOutsourceProfit = Math.max(0, totalOutsourceRevenue - totalOutsourceCost)

    return {
      year: currentYear,
      totalYearRevenue,
      totalYearInvoices,
      totalItemsRented,
      outsource: {
        totalUnits: totalOutsourceUnits,
        totalRevenue: totalOutsourceRevenue,
        totalCost: totalOutsourceCost,
        profit: totalOutsourceProfit,
        marginPercent:
          totalOutsourceRevenue > 0
            ? Math.round((totalOutsourceProfit / totalOutsourceRevenue) * 100)
            : 0,
      },
      monthly: monthsData,
      topEquipment,
    }
  })
