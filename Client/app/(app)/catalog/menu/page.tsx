'use client'

import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import MenuItemModal from '@/components/catalog/MenuItemModal'
import { ApiError } from '@/lib/api/client'
import { getMenuItems, type MenuItemResponse } from '@/lib/api/menu'

export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItemResponse | null>(null)
  const [categoryRegistry, setCategoryRegistry] = useState<Map<string, number>>(new Map())
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([])

  const loadMenuItems = useCallback(() => {
    setLoading(true)
    setError(null)
    getMenuItems()
      .then((items) => {
        setMenuItems(items)
        setCategorySuggestions((current) => {
          const names = new Set(current)
          items.forEach((item) => {
            if (item.menuCategoryName) names.add(item.menuCategoryName)
          })
          return Array.from(names).sort((a, b) => a.localeCompare(b))
        })
      })
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load menu items.')
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadMenuItems()
  }, [loadMenuItems])

  const visibleItems = useMemo(
    () =>
      menuItems.filter((item) =>
        `${item.menuItemName} ${item.menuCategoryName ?? ''}`.toLowerCase().includes(search.toLowerCase())
      ),
    [menuItems, search]
  )

  const openCreateModal = () => {
    setEditingItem(null)
    setModalOpen(true)
  }

  const openEditModal = (item: MenuItemResponse) => {
    setEditingItem(item)
    setModalOpen(true)
  }

  const handleCategoryRegistered = (name: string, id: number) => {
    setCategoryRegistry((current) => {
      const next = new Map(current)
      next.set(name.toLowerCase(), id)
      return next
    })
    setCategorySuggestions((current) =>
      current.includes(name) ? current : [...current, name].sort((a, b) => a.localeCompare(b))
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Menu Items</h1>
            <p className="text-gray-600">Manage your menu offerings and categories</p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#A01F1A]"
          >
            <Plus className="h-5 w-5" />
            Add Menu Item
          </button>
        </div>

        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search menu items by name or category"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder:text-gray-500 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading menu items...</p>
        ) : error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </p>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
            {menuItems.length === 0
              ? 'No menu items yet. Add your first menu item to get started.'
              : 'No menu items match your search.'}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-blue-50">
                <tr>
                  {['Name', 'Category', 'Image', 'Actions'].map((column) => (
                    <th key={column} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, index) => (
                  <tr
                    key={item.menuItemId}
                    className={index !== visibleItems.length - 1 ? 'border-b border-gray-200' : ''}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">{item.menuItemName}</td>
                    <td className="px-6 py-4 text-gray-600">{item.menuCategoryName ?? 'Uncategorized'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.menuImageUrl ? (
                        <a
                          href={item.menuImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-[#CC2622] hover:underline"
                        >
                          View image
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Edit ${item.menuItemName}`}
                          onClick={() => openEditModal(item)}
                          className="rounded-lg p-2 transition hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${item.menuItemName}`}
                          disabled
                          title="Menu item deletion is not available in the current API"
                          className="cursor-not-allowed rounded-lg p-2 opacity-40"
                        >
                          <Trash2 className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500">
          The menu item API supports name, optional category, and optional image URL. Description and per-item pricing
          are not part of the current backend contract.
        </p>
      </main>
      <Footer />

      <MenuItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadMenuItems}
        item={editingItem}
        categoryRegistry={categoryRegistry}
        categorySuggestions={categorySuggestions}
        onCategoryRegistered={handleCategoryRegistered}
      />
    </div>
  )
}
