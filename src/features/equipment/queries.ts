import { queryOptions } from '@tanstack/react-query'
import { listEquipmentFn, getEquipmentFn } from './server/equipment.fn'
import type { EquipmentFilterInput } from './schemas'

export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (filters?: EquipmentFilterInput) => [...equipmentKeys.lists(), filters ?? {}] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
}

export const equipmentListQueryOptions = (filters?: EquipmentFilterInput) =>
  queryOptions({
    queryKey: equipmentKeys.list(filters),
    queryFn: () => listEquipmentFn({ data: filters }),
  })

export const equipmentDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: equipmentKeys.detail(id),
    queryFn: () => getEquipmentFn({ data: { id } }),
  })
