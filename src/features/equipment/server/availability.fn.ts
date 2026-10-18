import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/features/auth/server/auth.middleware'
import { getBatchEquipmentAvailability } from '@/lib/availability'
import { z } from 'zod'

const availabilityInputSchema = z.object({
  equipmentIds: z.array(z.string()),
  rentStart: z.string().min(1),
  rentEnd: z.string().min(1),
  excludeInvoiceId: z.string().optional(),
})

export const checkEquipmentAvailabilityFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => availabilityInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { equipmentIds, rentStart, rentEnd, excludeInvoiceId } = data
    const startDate = new Date(rentStart)
    const endDate = new Date(rentEnd)

    const results = await getBatchEquipmentAvailability({
      equipmentIds,
      rentStart: startDate,
      rentEnd: endDate,
      excludeInvoiceId,
    })

    const serializable: Record<
      string,
      {
        equipmentId: string
        totalStock: number
        bookedQuantity: number
        availableStock: number
      }
    > = {}

    for (const [id, res] of Object.entries(results)) {
      serializable[id] = {
        equipmentId: res.equipmentId,
        totalStock: res.totalStock,
        bookedQuantity: res.bookedQuantity,
        availableStock: res.availableStock,
      }
    }

    return serializable
  })
