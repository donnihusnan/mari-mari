import { create } from 'zustand'
import { calculateRentalDays } from '@/lib/dates'

export interface DraftItem {
  tempId: string
  equipmentId: string
  equipmentName: string
  source: 'STOCK' | 'OUTSOURCE'
  supplierName?: string
  costPrice?: number
  quantity: number
  unitPrice: number
  lineTotal: number
  availableStock: number
}

export interface InvoiceDraftState {
  customerName: string
  customerPhone: string
  rentStart: string
  rentEnd: string
  days: number
  isDaysOverridden: boolean
  status: 'DRAFT' | 'BOOKED' | 'ACTIVE' | 'RETURNED' | 'CANCELLED'
  discount: number
  amountPaid: number
  notes: string
  items: DraftItem[]

  // Actions
  setCustomerInfo: (name: string, phone: string) => void
  setDates: (start: string, end: string) => void
  setDays: (days: number) => void
  addItem: (item: Omit<DraftItem, 'tempId' | 'lineTotal'>) => void
  updateItem: (tempId: string, updates: Partial<Omit<DraftItem, 'tempId'>>) => void
  removeItem: (tempId: string) => void
  setDiscount: (discount: number) => void
  setAmountPaid: (amount: number) => void
  setStatus: (status: 'DRAFT' | 'BOOKED' | 'ACTIVE' | 'RETURNED' | 'CANCELLED') => void
  setNotes: (notes: string) => void
  resetDraft: () => void
  loadFromInvoice: (invoice: {
    customerName: string
    customerPhone: string
    rentStart: string
    rentEnd: string
    days: number
    status: 'DRAFT' | 'BOOKED' | 'ACTIVE' | 'RETURNED' | 'CANCELLED'
    discount: number
    amountPaid: number
    notes?: string | null
    items: Array<{
      equipmentId: string
      equipmentName: string
      source: 'STOCK' | 'OUTSOURCE'
      supplierName?: string | null
      costPrice?: number | null
      quantity: number
      unitPrice: number
    }>
  }) => void
}

function computeLineTotal(quantity: number, unitPrice: number, days: number): number {
  return Math.max(0, quantity) * Math.max(0, unitPrice) * Math.max(1, days)
}

function getInitialDates() {
  const now = new Date()
  const startStr = now.toISOString().split('T')[0]
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const endStr = tomorrow.toISOString().split('T')[0]
  const days = calculateRentalDays(startStr, endStr)
  return { startStr, endStr, days }
}

const initialDates = getInitialDates()

export const useInvoiceDraftStore = create<InvoiceDraftState>((set, get) => ({
  customerName: '',
  customerPhone: '',
  rentStart: initialDates.startStr,
  rentEnd: initialDates.endStr,
  days: initialDates.days,
  isDaysOverridden: false,
  status: 'BOOKED',
  discount: 0,
  amountPaid: 0,
  notes: '',
  items: [],

  setCustomerInfo: (customerName, customerPhone) =>
    set({ customerName, customerPhone }),

  setDates: (rentStart, rentEnd) => {
    const { isDaysOverridden, days, items } = get()
    let newDays = days
    if (!isDaysOverridden && rentStart && rentEnd) {
      newDays = calculateRentalDays(rentStart, rentEnd)
    }

    const updatedItems = items.map((item) => ({
      ...item,
      lineTotal: computeLineTotal(item.quantity, item.unitPrice, newDays),
    }))

    set({ rentStart, rentEnd, days: newDays, items: updatedItems })
  },

  setDays: (days) => {
    const { items } = get()
    const validDays = Math.max(1, days)
    const updatedItems = items.map((item) => ({
      ...item,
      lineTotal: computeLineTotal(item.quantity, item.unitPrice, validDays),
    }))

    set({ days: validDays, isDaysOverridden: true, items: updatedItems })
  },

  addItem: (newItem) => {
    const { days, items } = get()
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const lineTotal = computeLineTotal(newItem.quantity, newItem.unitPrice, days)

    set({
      items: [
        ...items,
        {
          ...newItem,
          tempId,
          lineTotal,
        },
      ],
    })
  },

  updateItem: (tempId, updates) => {
    const { days, items } = get()
    const updatedItems = items.map((item) => {
      if (item.tempId !== tempId) return item
      const merged = { ...item, ...updates }
      return {
        ...merged,
        lineTotal: computeLineTotal(merged.quantity, merged.unitPrice, days),
      }
    })
    set({ items: updatedItems })
  },

  removeItem: (tempId) => {
    set((state) => ({
      items: state.items.filter((item) => item.tempId !== tempId),
    }))
  },

  setDiscount: (discount) => set({ discount: Math.max(0, discount) }),

  setAmountPaid: (amountPaid) => set({ amountPaid: Math.max(0, amountPaid) }),

  setStatus: (status) => set({ status }),

  setNotes: (notes) => set({ notes }),

  resetDraft: () => {
    const fresh = getInitialDates()
    set({
      customerName: '',
      customerPhone: '',
      rentStart: fresh.startStr,
      rentEnd: fresh.endStr,
      days: fresh.days,
      isDaysOverridden: false,
      status: 'BOOKED',
      discount: 0,
      amountPaid: 0,
      notes: '',
      items: [],
    })
  },

  loadFromInvoice: (invoice) => {
    const days = invoice.days
    const mappedItems: DraftItem[] = invoice.items.map((item, idx) => ({
      tempId: `existing-${idx}-${Date.now()}`,
      equipmentId: item.equipmentId,
      equipmentName: item.equipmentName,
      source: item.source,
      supplierName: item.supplierName ?? undefined,
      costPrice: item.costPrice ?? undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: computeLineTotal(item.quantity, item.unitPrice, days),
      availableStock: 999, // verified on server save
    }))

    set({
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      rentStart: invoice.rentStart.split('T')[0],
      rentEnd: invoice.rentEnd.split('T')[0],
      days,
      isDaysOverridden: true,
      status: invoice.status,
      discount: invoice.discount,
      amountPaid: invoice.amountPaid,
      notes: invoice.notes || '',
      items: mappedItems,
    })
  },
}))
