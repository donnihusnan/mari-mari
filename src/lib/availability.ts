import { prisma } from './prisma'
import { PrismaClient, InvoiceStatus, ItemSource } from '@prisma/client'

export interface AvailabilityCheckInput {
  equipmentId: string
  rentStart: Date
  rentEnd: Date
  excludeInvoiceId?: string
}

export interface BatchAvailabilityCheckInput {
  equipmentIds: string[]
  rentStart: Date
  rentEnd: Date
  excludeInvoiceId?: string
}

export interface EquipmentAvailabilityResult {
  equipmentId: string
  totalStock: number
  bookedQuantity: number
  availableStock: number
  isAvailable: (requestedQuantity: number) => boolean
}

/**
 * Pure function to calculate remaining available stock given total stock and booked quantity.
 */
export function calculateAvailableStock(totalStock: number, bookedQuantity: number): number {
  return Math.max(0, totalStock - bookedQuantity)
}

/**
 * Pure function to check if two inclusive date ranges overlap:
 * rentalStart <= targetEnd AND rentalEnd >= targetStart
 */
export function isDateRangeOverlapping(
  rentalStart: Date | string,
  rentalEnd: Date | string,
  targetStart: Date | string,
  targetEnd: Date | string,
): boolean {
  const rStart = new Date(rentalStart).getTime()
  const rEnd = new Date(rentalEnd).getTime()
  const tStart = new Date(targetStart).getTime()
  const tEnd = new Date(targetEnd).getTime()

  return rStart <= tEnd && rEnd >= tStart
}

/**
 * Pure filter function to determine if an invoice item should deduct from stock.
 */
export function shouldDeductStock(
  item: {
    source: ItemSource | 'STOCK' | 'OUTSOURCE'
    invoice: {
      id: string
      status: InvoiceStatus | 'DRAFT' | 'BOOKED' | 'ACTIVE' | 'RETURNED' | 'CANCELLED'
      rentStart: Date | string
      rentEnd: Date | string
    }
  },
  targetStart: Date | string,
  targetEnd: Date | string,
  excludeInvoiceId?: string,
): boolean {
  if (item.source !== 'STOCK') {
    return false
  }

  if (excludeInvoiceId && item.invoice.id === excludeInvoiceId) {
    return false
  }

  const activeStatuses = ['BOOKED', 'ACTIVE']
  if (!activeStatuses.includes(item.invoice.status)) {
    return false
  }

  return isDateRangeOverlapping(
    item.invoice.rentStart,
    item.invoice.rentEnd,
    targetStart,
    targetEnd,
  )
}

/**
 * Query database for single equipment availability in a date range.
 */
export async function getEquipmentAvailability(
  params: AvailabilityCheckInput,
  client: PrismaClient = prisma,
): Promise<EquipmentAvailabilityResult> {
  const { equipmentId, rentStart, rentEnd, excludeInvoiceId } = params

  const equipment = await client.equipment.findUnique({
    where: { id: equipmentId },
    select: { id: true, totalStock: true, name: true },
  })

  if (!equipment) {
    throw new Error(`Equipment ${equipmentId} tidak ditemukan`)
  }

  const bookedItems = await client.invoiceItem.aggregate({
    where: {
      equipmentId,
      source: ItemSource.STOCK,
      invoice: {
        id: excludeInvoiceId ? { not: excludeInvoiceId } : undefined,
        status: { in: [InvoiceStatus.BOOKED, InvoiceStatus.ACTIVE] },
        rentStart: { lte: rentEnd },
        rentEnd: { gte: rentStart },
      },
    },
    _sum: {
      quantity: true,
    },
  })

  const bookedQuantity = bookedItems._sum.quantity || 0
  const availableStock = calculateAvailableStock(equipment.totalStock, bookedQuantity)

  return {
    equipmentId,
    totalStock: equipment.totalStock,
    bookedQuantity,
    availableStock,
    isAvailable: (requested: number) => availableStock >= requested,
  }
}

/**
 * Query database for multiple equipment availabilities in batch.
 */
export async function getBatchEquipmentAvailability(
  params: BatchAvailabilityCheckInput,
  client: PrismaClient = prisma,
): Promise<Record<string, EquipmentAvailabilityResult>> {
  const { equipmentIds, rentStart, rentEnd, excludeInvoiceId } = params

  if (equipmentIds.length === 0) {
    return {}
  }

  const equipments = await client.equipment.findMany({
    where: { id: { in: equipmentIds } },
    select: { id: true, totalStock: true },
  })

  const bookedItems = await client.invoiceItem.groupBy({
    by: ['equipmentId'],
    where: {
      equipmentId: { in: equipmentIds },
      source: ItemSource.STOCK,
      invoice: {
        id: excludeInvoiceId ? { not: excludeInvoiceId } : undefined,
        status: { in: [InvoiceStatus.BOOKED, InvoiceStatus.ACTIVE] },
        rentStart: { lte: rentEnd },
        rentEnd: { gte: rentStart },
      },
    },
    _sum: {
      quantity: true,
    },
  })

  const bookedMap = new Map<string, number>()
  for (const item of bookedItems) {
    bookedMap.set(item.equipmentId, item._sum.quantity || 0)
  }

  const results: Record<string, EquipmentAvailabilityResult> = {}

  for (const eq of equipments) {
    const bookedQuantity = bookedMap.get(eq.id) || 0
    const availableStock = calculateAvailableStock(eq.totalStock, bookedQuantity)
    results[eq.id] = {
      equipmentId: eq.id,
      totalStock: eq.totalStock,
      bookedQuantity,
      availableStock,
      isAvailable: (requested: number) => availableStock >= requested,
    }
  }

  return results
}
