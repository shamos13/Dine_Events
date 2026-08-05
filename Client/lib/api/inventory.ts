import { apiClient } from './client'

export type PricingType = 'FLAT_RATE' | 'PER_UNIT'
export type InventoryResponse = {
  inventoryId: number
  inventoryName: string
  inventoryQuantity: number
  availableQuantity?: number
  unitPrice: number
}
export type InventoryRequest = { inventoryName: string; inventoryQuantity: number; unitPrice: number }
export type InventoryAllocationResponse = {
  allocationId: number
  eventId: number
  inventoryId?: number
  inventoryName: string
  eventName: string
  clientName: string | null
  pricingType: PricingType
  quantityAllocated: number
  unitPriceAtAllocation: number | null
  flatRate: number | null
  totalCost: number
  availableQuantity?: number
}
export type InventoryAllocationRequest = {
  inventoryId: number
  eventId: number
  pricingType: PricingType
  quantityAllocated?: number
  flatRate?: number
  totalCost?: number
}
export type InventoryAllocationUpdateRequest = {
  pricingType: PricingType
  quantityAllocated?: number
  flatRate?: number
}

export const getInventory = () => apiClient<InventoryResponse[]>('/inventory/all-inventories')
export const createInventory = (payload: InventoryRequest) =>
  apiClient<InventoryResponse>('/inventory/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
export const getInventoryAllocations = () => apiClient<InventoryAllocationResponse[]>('/inventory-allocation/all-allocations')
export const getInventoryAllocationsByEvent = (eventId: number) =>
  apiClient<InventoryAllocationResponse[]>(`/inventory-allocation/event/${eventId}`)
export const createInventoryAllocation = (payload: InventoryAllocationRequest) =>
  apiClient<InventoryAllocationResponse>('/inventory-allocation/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
export const updateInventoryAllocation = (allocationId: number, payload: InventoryAllocationUpdateRequest) =>
  apiClient<InventoryAllocationResponse>(`/inventory-allocation/${allocationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
export const deleteInventoryAllocation = (allocationId: number) =>
  apiClient<void>(`/inventory-allocation/${allocationId}`, { method: 'DELETE' })
