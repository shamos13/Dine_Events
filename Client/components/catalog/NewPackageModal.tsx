'use client'

import { Check, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import {
  createMenuPackage,
  getMenuItems,
  SERVICE_TYPES,
  type MenuItemResponse,
  type MenuPackageRequest,
} from '@/lib/api/menu'

type NewPackageModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

type FormState = {
  packageName: string
  serviceType: string
  pricePerPax: string
  minGuests: string
  menuItemIds: number[]
}

const initialForm: FormState = {
  packageName: '',
  serviceType: '',
  pricePerPax: '',
  minGuests: '',
  menuItemIds: [],
}

export default function NewPackageModal({ isOpen, onClose, onCreated }: NewPackageModalProps) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([])
  const [menuItemSearch, setMenuItemSearch] = useState('')
  const [loadingItems, setLoadingItems] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return
    setForm(initialForm)
    setMenuItemSearch('')
    setError(null)
    setFieldErrors({})
    setLoadingItems(true)
    getMenuItems()
      .then(setMenuItems)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load menu items.')
      )
      .finally(() => setLoadingItems(false))
  }, [isOpen])

  const filteredMenuItems = useMemo(
    () =>
      menuItems.filter((item) =>
        `${item.menuItemName} ${item.menuCategoryName ?? ''}`.toLowerCase().includes(menuItemSearch.toLowerCase())
      ),
    [menuItems, menuItemSearch]
  )

  const toggleMenuItem = (menuItemId: number) => {
    setForm((current) => ({
      ...current,
      menuItemIds: current.menuItemIds.includes(menuItemId)
        ? current.menuItemIds.filter((id) => id !== menuItemId)
        : [...current.menuItemIds, menuItemId],
    }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next.menuItemIds
      return next
    })
  }

  const validate = (): MenuPackageRequest | null => {
    const nextErrors: Record<string, string> = {}
    const packageName = form.packageName.trim()
    const pricePerPax = Number(form.pricePerPax)

    if (!packageName) nextErrors.packageName = 'Package name is required.'
    if (!form.pricePerPax.trim() || Number.isNaN(pricePerPax) || pricePerPax <= 0) {
      nextErrors.pricePerPax = 'Price per guest must be a positive number.'
    }
    if (form.menuItemIds.length === 0) {
      nextErrors.menuItemIds = 'Select at least one menu item for this package.'
    }

    if (form.minGuests.trim()) {
      const minGuests = Number(form.minGuests)
      if (Number.isNaN(minGuests) || minGuests < 1 || !Number.isInteger(minGuests)) {
        nextErrors.minGuests = 'Minimum guests must be a whole number of at least 1.'
      }
    }

    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return null

    const payload: MenuPackageRequest = {
      packageName,
      pricePerPax,
      menuItemIds: form.menuItemIds,
    }

    if (form.serviceType) payload.serviceType = form.serviceType
    if (form.minGuests.trim()) payload.minGuests = Number(form.minGuests)

    return payload
  }

  const handleSubmit = async () => {
    const payload = validate()
    if (!payload) return

    setSubmitting(true)
    setError(null)
    try {
      await createMenuPackage(payload)
      onCreated()
      onClose()
    } catch (reason: unknown) {
      if (reason instanceof ApiError) {
        setError(reason.message)
        if (reason.fieldErrors) setFieldErrors(reason.fieldErrors)
      } else {
        setError('Unable to save package.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-package-title"
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#CC2622]">Catalog Management</p>
            <h2 id="new-package-title" className="mt-1 text-2xl font-bold text-slate-900">
              New Package
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="mb-6 rounded-lg bg-slate-900 px-4 py-3 text-sm text-slate-200">
            Standardizing your event offerings ensures operational excellence and pricing consistency.
          </div>

          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="package-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                Name <span className="text-[#CC2622]">*</span>
              </label>
              <input
                id="package-name"
                value={form.packageName}
                onChange={(event) => {
                  setForm((current) => ({ ...current, packageName: event.target.value }))
                  setFieldErrors((current) => {
                    const next = { ...current }
                    delete next.packageName
                    return next
                  })
                }}
                placeholder="e.g., Corporate Gala Gold"
                className="form-input"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Enter a descriptive name for this package. This will be visible on client proposals.
              </p>
              {fieldErrors.packageName && <p className="mt-1 text-xs text-red-600">{fieldErrors.packageName}</p>}
            </div>

            <div>
              <label htmlFor="service-type" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                Service Type
              </label>
              <select
                id="service-type"
                value={form.serviceType}
                onChange={(event) => setForm((current) => ({ ...current, serviceType: event.target.value }))}
                className="form-input"
              >
                <option value="">Select service type (optional)</option>
                {SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="price-per-pax" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                Default Price (KSh) <span className="text-[#CC2622]">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">KSh</span>
                <input
                  id="price-per-pax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.pricePerPax}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, pricePerPax: event.target.value }))
                    setFieldErrors((current) => {
                      const next = { ...current }
                      delete next.pricePerPax
                      return next
                    })
                  }}
                  placeholder="0.00"
                  className="form-input py-3 pl-12 pr-4"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">The standard selling price per guest for this package.</p>
              {fieldErrors.pricePerPax && <p className="mt-1 text-xs text-red-600">{fieldErrors.pricePerPax}</p>}
            </div>

            <div>
              <label htmlFor="min-guests" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                Minimum Guests
              </label>
              <input
                id="min-guests"
                type="number"
                min="1"
                step="1"
                value={form.minGuests}
                onChange={(event) => {
                  setForm((current) => ({ ...current, minGuests: event.target.value }))
                  setFieldErrors((current) => {
                    const next = { ...current }
                    delete next.minGuests
                    return next
                  })
                }}
                placeholder="Optional minimum guest count"
                className="form-input"
              />
              {fieldErrors.minGuests && <p className="mt-1 text-xs text-red-600">{fieldErrors.minGuests}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                  Menu Items <span className="text-[#CC2622]">*</span>
                </label>
                <span className="text-xs text-gray-500">{form.menuItemIds.length} selected</span>
              </div>
              <input
                value={menuItemSearch}
                onChange={(event) => setMenuItemSearch(event.target.value)}
                placeholder="Search menu items to include"
                className="form-input py-2.5"
              />
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                {loadingItems ? (
                  <p className="p-4 text-sm text-gray-600">Loading menu items...</p>
                ) : filteredMenuItems.length === 0 ? (
                  <p className="p-4 text-sm text-gray-600">
                    {menuItems.length === 0
                      ? 'Create menu items first before building a package.'
                      : 'No menu items match your search.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {filteredMenuItems.map((item) => {
                      const selected = form.menuItemIds.includes(item.menuItemId)
                      return (
                        <li key={item.menuItemId}>
                          <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleMenuItem(item.menuItemId)}
                              className="h-4 w-4 rounded border-gray-300 text-[#CC2622] focus:ring-[#CC2622]"
                            />
                            <span className="flex-1">
                              <span className="block text-sm font-medium text-gray-900">{item.menuItemName}</span>
                              {item.menuCategoryName && (
                                <span className="block text-xs text-gray-500">{item.menuCategoryName}</span>
                              )}
                            </span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              {fieldErrors.menuItemIds && <p className="mt-1 text-xs text-red-600">{fieldErrors.menuItemIds}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A01F1A] disabled:opacity-50"
          >
            Save Package
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
