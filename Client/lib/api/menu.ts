import { apiClient } from './client'

export type MenuItemResponse = { menuItemId: number; menuItemName: string; menuImageUrl: string | null; menuCategoryName: string | null }
export type MenuItemRequest = { menuItemName: string; menuImageUrl?: string; menuCategoryId?: number }
export type MenuCategoryResponse = { menuCategoryId: number; menuCategoryName: string; menuCategoryDescription: string | null; displayOrder: number }
export type MenuCategoryRequest = { menuCategoryName: string; menuCategoryDescription?: string; displayOrder: number }

export const getMenuItems = () => apiClient<MenuItemResponse[]>('/menu-item/menu-items')
export const createMenuItem = (payload: MenuItemRequest) => apiClient<MenuItemResponse>('/menu-item/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
export const updateMenuItem = (menuItemId: number, payload: MenuItemRequest) => apiClient<MenuItemResponse>(`/menu-item/update/${menuItemId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
export const createMenuCategory = (payload: MenuCategoryRequest) => apiClient<MenuCategoryResponse>('/menu-category/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
