'use client'

import { Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import ImageUpload from '@/components/ui/ImageUpload'
import { ApiError } from '@/lib/api/client'
import {
  createMenuCategory,
  createMenuItem,
  updateMenuItem,
  type MenuItemRequest,
  type MenuItemResponse,
} from '@/lib/api/menu'

type MenuItemModalProps = {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  item?: MenuItemResponse | null
  categoryRegistry: Map<string, number>
  categorySuggestions: string[]
  onCategoryRegistered: (name: string, id: number) => void
}

type FormState = {
  menuItemName: string
  menuImageUrl: string
  categoryName: string
}

const initialForm: FormState = {
  menuItemName: '',
  menuImageUrl: '',
  categoryName: '',
}

export default function MenuItemModal({
  isOpen,
  onClose,
  onSaved,
  item,
  categoryRegistry,
  categorySuggestions,
  onCategoryRegistered,
}: MenuItemModalProps) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setFieldErrors({})
    if (item) {
      setForm({
        menuItemName: item.menuItemName,
        menuImageUrl: item.menuImageUrl ?? '',
        categoryName: item.menuCategoryName ?? '',
      })
    } else {
      setForm(initialForm)
    }
  }, [isOpen, item])

  const resolveCategoryId = async (categoryName: string): Promise<number | undefined> => {
    const trimmed = categoryName.trim()
    if (!trimmed) return undefined

    const existingId = categoryRegistry.get(trimmed.toLowerCase())
    if (existingId) return existingId

    const created = await createMenuCategory({
      menuCategoryName: trimmed,
      displayOrder: categoryRegistry.size,
    })
    onCategoryRegistered(trimmed, created.menuCategoryId)
    return created.menuCategoryId
  }

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {}
    const menuItemName = form.menuItemName.trim()

    if (!menuItemName) nextErrors.menuItemName = 'Menu item name is required.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setError(null)

    try {
      const menuCategoryId = await resolveCategoryId(form.categoryName)
      const payload: MenuItemRequest = {
        menuItemName,
        menuImageUrl: form.menuImageUrl.trim() || undefined,
      }
      if (menuCategoryId) payload.menuCategoryId = menuCategoryId

      if (isEdit && item) {
        await updateMenuItem(item.menuItemId, payload)
      } else {
        await createMenuItem(payload)
      }

      onSaved()
      onClose()
    } catch (reason: unknown) {
      if (reason instanceof ApiError) {
        setError(reason.message)
        if (reason.fieldErrors) setFieldErrors(reason.fieldErrors)
      } else {
        setError('Unable to save menu item.')
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
        aria-labelledby="menu-item-title"
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#CC2622]">Catalog Management</p>
            <h2 id="menu-item-title" className="mt-1 text-2xl font-bold text-slate-900">
              {isEdit ? 'Edit Menu Item' : 'Add Menu Item'}
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
          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="menu-item-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                Name <span className="text-[#CC2622]">*</span>
              </label>
              <input
                id="menu-item-name"
                value={form.menuItemName}
                onChange={(event) => {
                  setForm((current) => ({ ...current, menuItemName: event.target.value }))
                  setFieldErrors((current) => {
                    const next = { ...current }
                    delete next.menuItemName
                    return next
                  })
                }}
                placeholder="e.g., Nyama Choma"
                className="form-input"
              />
              {fieldErrors.menuItemName && <p className="mt-1 text-xs text-red-600">{fieldErrors.menuItemName}</p>}
            </div>

            <div>
              <label htmlFor="menu-item-category" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                Category
              </label>
              <input
                id="menu-item-category"
                list="menu-category-options"
                value={form.categoryName}
                onChange={(event) => setForm((current) => ({ ...current, categoryName: event.target.value }))}
                placeholder="e.g., Entrees"
                className="form-input"
              />
              <datalist id="menu-category-options">
                {categorySuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <p className="mt-1.5 text-xs text-gray-500">
                Optional. A new category will be created if the name does not already exist.
              </p>
            </div>

            <ImageUpload
              value={form.menuImageUrl || null}
              onChange={(url) => setForm((current) => ({ ...current, menuImageUrl: url ?? '' }))}
              folder="menu"
              label="Menu image"
              helperText="Upload a dish photo for the catalog and event menu tables."
            />
            <div>
              <label htmlFor="menu-image-url" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                Or paste image URL
              </label>
              <input
                id="menu-image-url"
                type="url"
                value={form.menuImageUrl}
                onChange={(event) => setForm((current) => ({ ...current, menuImageUrl: event.target.value }))}
                placeholder="https://res.cloudinary.com/..."
                className="form-input"
              />
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
            {isEdit ? 'Save Changes' : 'Save Menu Item'}
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
