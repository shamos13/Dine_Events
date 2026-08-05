'use client'

import { Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { createInventory, type InventoryRequest } from '@/lib/api/inventory'

type InventoryModalProps = {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

type FormState = {
  inventoryName: string
  inventoryQuantity: string
  unitPrice: string
}

const initialForm: FormState = {
  inventoryName: '',
  inventoryQuantity: '',
  unitPrice: '',
}

export default function InventoryModal({ isOpen, onClose, onSaved }: InventoryModalProps) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setFieldErrors({})
    setForm(initialForm)
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {}
    const inventoryName = form.inventoryName.trim()
    const inventoryQuantity = Number(form.inventoryQuantity)
    const unitPrice = Number(form.unitPrice)

    if (!inventoryName) nextErrors.inventoryName = 'Item name is required.'
    if (!form.inventoryQuantity || !Number.isFinite(inventoryQuantity) || inventoryQuantity < 1) {
      nextErrors.inventoryQuantity = 'Enter a quantity of at least 1.'
    }
    if (!form.unitPrice || !Number.isFinite(unitPrice) || unitPrice < 0) {
      nextErrors.unitPrice = 'Enter a valid unit price.'
    }
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setError(null)

    const payload: InventoryRequest = {
      inventoryName,
      inventoryQuantity,
      unitPrice,
    }

    try {
      await createInventory(payload)
      onSaved()
      onClose()
    } catch (reason: unknown) {
      if (reason instanceof ApiError) {
        setError(reason.message)
        if (reason.fieldErrors) setFieldErrors(reason.fieldErrors)
      } else {
        setError('Unable to add inventory item.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Inventory Item</h2>
            <p className="mt-1 text-sm text-gray-600">Add equipment or rental stock available in your system</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#CC2622]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <label className="block text-sm font-semibold text-gray-700">
            Item Name
            <input
              value={form.inventoryName}
              onChange={(event) => setForm((current) => ({ ...current, inventoryName: event.target.value }))}
              placeholder="e.g. Banquet Chairs"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 placeholder:text-gray-400 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
            />
            {fieldErrors.inventoryName && (
              <span className="mt-1 block text-xs font-normal text-red-600">{fieldErrors.inventoryName}</span>
            )}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-gray-700">
              Available Quantity
              <input
                type="number"
                min="1"
                value={form.inventoryQuantity}
                onChange={(event) => setForm((current) => ({ ...current, inventoryQuantity: event.target.value }))}
                placeholder="0"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 placeholder:text-gray-400 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
              />
              {fieldErrors.inventoryQuantity && (
                <span className="mt-1 block text-xs font-normal text-red-600">{fieldErrors.inventoryQuantity}</span>
              )}
            </label>

            <label className="block text-sm font-semibold text-gray-700">
              Unit Price (KSh)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(event) => setForm((current) => ({ ...current, unitPrice: event.target.value }))}
                placeholder="0.00"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 placeholder:text-gray-400 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
              />
              {fieldErrors.unitPrice && (
                <span className="mt-1 block text-xs font-normal text-red-600">{fieldErrors.unitPrice}</span>
              )}
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A01F1A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {submitting ? 'Saving...' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
