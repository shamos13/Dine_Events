'use client'

import { Edit, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { ApiError } from '@/lib/api/client'
import { getMenuItems, type MenuItemResponse } from '@/lib/api/menu'

export default function MenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { getMenuItems().then(setMenuItems).catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load menu items.')).finally(() => setLoading(false)) }, [])
  const visibleItems = useMemo(() => menuItems.filter((item) => `${item.menuItemName} ${item.menuCategoryName ?? ''}`.toLowerCase().includes(search.toLowerCase())), [menuItems, search])
  return <div className="min-h-screen flex flex-col bg-gray-50"><Header /><main className="flex-1 p-6"><div className="mb-8 flex items-start justify-between"><div><h1 className="mb-2 text-3xl font-bold text-gray-900">Menu Items</h1><p className="text-gray-600">Manage your menu offerings</p></div></div><div className="mb-6 max-w-md"><div className="relative"><Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menu items by name or category" className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#CC2622]" /></div></div>{loading ? <p className="text-gray-600">Loading menu items...</p> : error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p> : <div className="overflow-hidden rounded-lg border border-gray-200 bg-white"><table className="w-full"><thead className="border-b border-gray-200 bg-blue-50"><tr>{['Name', 'Category', 'Image', 'Actions'].map((item) => <th key={item} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{item}</th>)}</tr></thead><tbody>{visibleItems.map((item, index) => <tr key={item.menuItemId} className={index !== visibleItems.length - 1 ? 'border-b border-gray-200' : ''}><td className="px-6 py-4 font-semibold text-gray-900">{item.menuItemName}</td><td className="px-6 py-4 text-gray-600">{item.menuCategoryName ?? 'Uncategorized'}</td><td className="px-6 py-4 text-gray-600">{item.menuImageUrl ? 'Configured' : '—'}</td><td className="flex items-center gap-2 px-6 py-4"><button aria-label={`Edit ${item.menuItemName}`} className="rounded-lg p-2 hover:bg-gray-100"><Edit className="h-4 w-4 text-gray-600" /></button><button aria-label={`Delete ${item.menuItemName}`} className="rounded-lg p-2 hover:bg-gray-100"><Trash2 className="h-4 w-4 text-gray-600" /></button></td></tr>)}</tbody></table></div>}</main><Footer /></div>
}
