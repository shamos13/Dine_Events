import { apiClient } from './client'

export type MenuItemResponse = {
  menuItemId: number
  menuItemName: string
  menuImageUrl: string | null
  menuCategoryName: string | null
}

export type MenuItemRequest = {
  menuItemName: string
  menuImageUrl?: string
  menuCategoryId?: number
}

export type MenuCategoryResponse = {
  menuCategoryId: number
  menuCategoryName: string
  menuCategoryDescription: string | null
  displayOrder: number
}

export type MenuCategoryRequest = {
  menuCategoryName: string
  menuCategoryDescription?: string
  displayOrder: number
}

export type MenuPackageResponse = {
  menuPackageId: number
  packageName: string
  serviceType: string | null
  pricePerPax: number
  minGuests: number | null
  menuItemNames: string[] | null
}

export type MenuPackageRequest = {
  packageName: string
  serviceType?: string
  pricePerPax: number
  minGuests?: number
  menuItemIds: number[]
}

export const getMenuItems = () => apiClient<MenuItemResponse[]>('/menu-item/menu-items')

export const createMenuItem = (payload: MenuItemRequest) =>
  apiClient<MenuItemResponse>('/menu-item/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export const updateMenuItem = (menuItemId: number, payload: MenuItemRequest) =>
  apiClient<MenuItemResponse>(`/menu-item/update/${menuItemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export const createMenuCategory = (payload: MenuCategoryRequest) =>
  apiClient<MenuCategoryResponse>('/menu-category/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export type MenuItemSummary = {
  menuItemId: number
  menuItemName: string
  menuImageUrl: string | null
  menuCategoryName: string | null
}

export type EventMenuPackageSelectionResponse = {
  selectionId: number
  menuPackageId: number
  eventId: number
  eventName: string
  packageName: string
  serviceType: string | null
  minGuests: number | null
  guestCount: number
  pricePerPax: number
  menuItemNames: string[] | null
  menuItems: MenuItemSummary[] | null
}

export type EventMenuPackageSelectionRequest = {
  eventId: number
  menuPackageId: number
  guestCountOverride?: number
}

export const getMenuPackages = () => apiClient<MenuPackageResponse[]>('/menu-package/all-packages')

export const getEventMenuSelections = (eventId: number) =>
  apiClient<EventMenuPackageSelectionResponse[]>(`/event-menu-selection/event/${eventId}`)

export const selectPackageForEvent = (payload: EventMenuPackageSelectionRequest) =>
  apiClient<EventMenuPackageSelectionResponse>('/event-menu-selection/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export const removePackageFromEvent = (selectionId: number) =>
  apiClient<void>(`/event-menu-selection/${selectionId}`, {
    method: 'DELETE',
  })

export const createMenuPackage = (payload: MenuPackageRequest) =>
  apiClient<MenuPackageResponse>('/menu-package/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export function formatKsh(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0)
  if (Number.isNaN(value)) return 'KSh 0'
  return `KSh ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export const SERVICE_TYPES = ['buffet', 'plated', 'self-service'] as const
