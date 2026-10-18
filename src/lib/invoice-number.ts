import { PrismaClient } from '@prisma/client'

/**
 * Format invoice sequence number into MM-YYYY-NNNN
 * e.g. year: 2026, sequence: 1 -> MM-2026-0001
 */
export function formatInvoiceNumber(year: number, sequence: number): string {
  const padded = String(sequence).padStart(4, '0')
  return `MM-${year}-${padded}`
}

/**
 * Atomically generates the next invoice number for the given year within a transaction.
 */
export async function getNextInvoiceNumber(
  year: number,
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
): Promise<string> {
  const sequence = await tx.invoiceSequence.upsert({
    where: { year },
    update: { last: { increment: 1 } },
    create: { year, last: 1 },
  })

  return formatInvoiceNumber(year, sequence.last)
}
