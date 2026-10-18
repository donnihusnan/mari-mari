import { describe, expect, it, beforeEach } from 'bun:test'
import { useInvoiceDraftStore } from './invoice-draft.store'

describe('useInvoiceDraftStore - addItem merging logic', () => {
  beforeEach(() => {
    useInvoiceDraftStore.getState().resetDraft()
  })

  it('merges identical products with same STOCK source', () => {
    const store = useInvoiceDraftStore.getState()
    store.setDays(2)

    store.addItem({
      equipmentId: 'eq-1',
      equipmentName: 'Tenda Basic',
      source: 'STOCK',
      quantity: 1,
      unitPrice: 100000,
      availableStock: 5,
    })

    expect(useInvoiceDraftStore.getState().items.length).toBe(1)
    expect(useInvoiceDraftStore.getState().items[0].quantity).toBe(1)
    expect(useInvoiceDraftStore.getState().items[0].lineTotal).toBe(200000) // 1 * 100000 * 2 days

    // Add again with qty 2
    useInvoiceDraftStore.getState().addItem({
      equipmentId: 'eq-1',
      equipmentName: 'Tenda Basic',
      source: 'STOCK',
      quantity: 2,
      unitPrice: 100000,
      availableStock: 5,
    })

    const items = useInvoiceDraftStore.getState().items
    expect(items.length).toBe(1)
    expect(items[0].quantity).toBe(3) // 1 + 2 = 3
    expect(items[0].lineTotal).toBe(600000) // 3 * 100000 * 2 days
  })

  it('does NOT merge items when source is different (STOCK vs OUTSOURCE)', () => {
    const store = useInvoiceDraftStore.getState()
    store.setDays(1)

    // Add STOCK
    store.addItem({
      equipmentId: 'eq-1',
      equipmentName: 'Tenda Basic',
      source: 'STOCK',
      quantity: 1,
      unitPrice: 100000,
      availableStock: 5,
    })

    // Add OUTSOURCE
    useInvoiceDraftStore.getState().addItem({
      equipmentId: 'eq-1',
      equipmentName: 'Tenda Basic',
      source: 'OUTSOURCE',
      supplierName: 'Vendor A',
      quantity: 1,
      unitPrice: 100000,
      availableStock: 0,
    })

    const items = useInvoiceDraftStore.getState().items
    expect(items.length).toBe(2)
    expect(items[0].source).toBe('STOCK')
    expect(items[0].quantity).toBe(1)
    expect(items[1].source).toBe('OUTSOURCE')
    expect(items[1].quantity).toBe(1)
    expect(items[1].supplierName).toBe('Vendor A')
  })

  it('merges OUTSOURCE items when supplierName is the same', () => {
    const store = useInvoiceDraftStore.getState()
    store.setDays(1)

    store.addItem({
      equipmentId: 'eq-1',
      equipmentName: 'Tenda Basic',
      source: 'OUTSOURCE',
      supplierName: 'Vendor A',
      quantity: 1,
      unitPrice: 100000,
      availableStock: 0,
    })

    useInvoiceDraftStore.getState().addItem({
      equipmentId: 'eq-1',
      equipmentName: 'Tenda Basic',
      source: 'OUTSOURCE',
      supplierName: 'Vendor A',
      quantity: 3,
      unitPrice: 100000,
      availableStock: 0,
    })

    const items = useInvoiceDraftStore.getState().items
    expect(items.length).toBe(1)
    expect(items[0].quantity).toBe(4)
  })

  it('does NOT merge OUTSOURCE items when supplierName is different', () => {
    const store = useInvoiceDraftStore.getState()
    store.setDays(1)

    store.addItem({
      equipmentId: 'eq-1',
      equipmentName: 'Tenda Basic',
      source: 'OUTSOURCE',
      supplierName: 'Vendor A',
      quantity: 1,
      unitPrice: 100000,
      availableStock: 0,
    })

    useInvoiceDraftStore.getState().addItem({
      equipmentId: 'eq-1',
      equipmentName: 'Tenda Basic',
      source: 'OUTSOURCE',
      supplierName: 'Vendor B',
      quantity: 1,
      unitPrice: 100000,
      availableStock: 0,
    })

    const items = useInvoiceDraftStore.getState().items
    expect(items.length).toBe(2)
  })

  it('keeps different products separate', () => {
    const store = useInvoiceDraftStore.getState()
    store.setDays(1)

    store.addItem({
      equipmentId: 'eq-1',
      equipmentName: 'Tenda Basic',
      source: 'STOCK',
      quantity: 1,
      unitPrice: 100000,
      availableStock: 5,
    })

    useInvoiceDraftStore.getState().addItem({
      equipmentId: 'eq-2',
      equipmentName: 'Sleeping Bag',
      source: 'STOCK',
      quantity: 1,
      unitPrice: 30000,
      availableStock: 10,
    })

    const items = useInvoiceDraftStore.getState().items
    expect(items.length).toBe(2)
    expect(items[0].equipmentName).toBe('Tenda Basic')
    expect(items[1].equipmentName).toBe('Sleeping Bag')
  })
})
