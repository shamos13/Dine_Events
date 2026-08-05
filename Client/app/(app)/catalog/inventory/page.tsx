'use client'

import { Archive, Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import InventoryModal from '@/components/catalog/InventoryModal'
import { ApiError } from '@/lib/api/client'
import { getInventory, type InventoryResponse } from '@/lib/api/inventory'

function formatCurrency(value: number) {
  return `KSh ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
}

export default function CatalogInventoryPage() {
  const [items, setItems] = useState<InventoryResponse[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadInventory = useCallback(() => {
    setLoading(true)
    setError(null)
    getInventory()
      .then(setItems)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load inventory.')
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  const visibleItems = useMemo(
    () => items.filter((item) => item.inventoryName.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  )

  const totalUnits = items.reduce((sum, item) => sum + Number(item.inventoryQuantity ?? 0), 0)
  const stockValue = items.reduce(
    (sum, item) => sum + Number(item.unitPrice ?? 0) * Number(item.inventoryQuantity ?? 0),
    0
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-600">Add and view equipment available for event rentals</p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#A01F1A]"
          >
            <Plus className="h-5 w-5" />
            Add Inventory
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Items" value={String(items.length)} />
          <SummaryCard label="Total Units" value={String(totalUnits)} />
          <SummaryCard label="Stock Value" value={formatCurrency(stockValue)} />
        </div>

        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search inventory by name"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder:text-gray-500 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading inventory...</p>
        ) : error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </p>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#CC2622]">
              <Archive className="h-7 w-7" />
            </div>
            {items.length === 0
              ? 'No inventory yet. Add your first item to start managing stock.'
              : 'No inventory items match your search.'}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-gray-200 bg-blue-50">
                <tr>
                  {['Item Name', 'In Catalog', 'Qty Available', 'Unit Price', 'Stock Value'].map((column) => (
                    <th
                      key={column}
                      className={`px-6 py-4 text-sm font-semibold text-gray-700 ${
                        column === 'Item Name' ? 'text-left' : 'text-right'
                      }`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, index) => {
                  const quantity = Number(item.inventoryQuantity ?? 0)
                  const available = Number(item.availableQuantity ?? quantity)
                  const unitPrice = Number(item.unitPrice ?? 0)
                  return (
                    <tr
                      key={item.inventoryId}
                      className={index !== visibleItems.length - 1 ? 'border-b border-gray-200' : ''}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf4ff] text-[#CC2622]">
                            <Archive className="h-5 w-5" />
                          </div>
                          <p className="font-semibold text-gray-900">{item.inventoryName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right text-gray-700">{quantity}</td>
                      <td className="px-6 py-5 text-right font-semibold text-gray-900">{available}</td>
                      <td className="px-6 py-5 text-right text-gray-700">{formatCurrency(unitPrice)}</td>
                      <td className="px-6 py-5 text-right font-semibold text-gray-900">
                        {formatCurrency(unitPrice * quantity)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />

      <InventoryModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={loadInventory} />
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
