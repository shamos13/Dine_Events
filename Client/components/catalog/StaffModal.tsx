'use client'

import { Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import ImageUpload from '@/components/ui/ImageUpload'
import { ApiError } from '@/lib/api/client'
import {
  createStaff,
  type StaffPricingMethod,
  type StaffRequest,
  type StaffResponse,
  updateStaff,
} from '@/lib/api/staff'

type StaffModalProps = {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  staff?: StaffResponse | null
}

type FormState = {
  staffName: string
  staffEmail: string
  staffPhone: string
  staffRole: string
  staffSalary: string
  pricingMethod: StaffPricingMethod
  profileImageUrl: string | null
  responsibilities: string
}

const initialForm: FormState = {
  staffName: '',
  staffEmail: '',
  staffPhone: '',
  staffRole: '',
  staffSalary: '',
  pricingMethod: 'FLAT_RATE',
  profileImageUrl: null,
  responsibilities: '',
}

export default function StaffModal({ isOpen, onClose, onSaved, staff }: StaffModalProps) {
  const isEdit = Boolean(staff)
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setFieldErrors({})
    if (staff) {
      setForm({
        staffName: staff.staffName,
        staffEmail: staff.staffEmail ?? '',
        staffPhone: staff.staffPhone,
        staffRole: staff.staffRole,
        staffSalary: String(staff.staffSalary ?? ''),
        pricingMethod: staff.pricingMethod ?? 'FLAT_RATE',
        profileImageUrl: staff.profileImageUrl,
        responsibilities: staff.responsibilities?.join(', ') ?? '',
      })
    } else {
      setForm(initialForm)
    }
  }, [isOpen, staff])

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {}
    if (!form.staffName.trim()) nextErrors.staffName = 'Staff name is required.'
    if (!form.staffRole.trim()) nextErrors.staffRole = 'Role is required.'
    if (!form.staffPhone.trim()) nextErrors.staffPhone = 'Phone is required.'
    if (!form.staffSalary || Number(form.staffSalary) <= 0) nextErrors.staffSalary = 'Enter a valid price.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setError(null)

    const payload: StaffRequest = {
      staffName: form.staffName.trim(),
      staffPhone: form.staffPhone.trim(),
      staffRole: form.staffRole.trim(),
      staffSalary: Number(form.staffSalary),
      pricingMethod: form.pricingMethod,
      responsibilities: form.responsibilities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    }
    if (form.staffEmail.trim()) payload.staffEmail = form.staffEmail.trim()
    if (form.profileImageUrl) payload.profileImageUrl = form.profileImageUrl

    try {
      if (isEdit && staff) {
        await updateStaff(staff.staffId, payload)
      } else {
        await createStaff(payload)
      }
      onSaved()
      onClose()
    } catch (reason: unknown) {
      if (reason instanceof ApiError) {
        setError(reason.message)
        if (reason.fieldErrors) setFieldErrors(reason.fieldErrors)
      } else {
        setError('Unable to save staff member.')
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
        aria-labelledby="staff-modal-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#CC2622]">Catalog Management</p>
            <h2 id="staff-modal-title" className="mt-1 text-2xl font-bold text-slate-900">
              {isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
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
            <ImageUpload
              value={form.profileImageUrl}
              onChange={(url) => setForm((current) => ({ ...current, profileImageUrl: url }))}
              folder="staff"
              label="Profile photo"
              shape="circle"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                  Name <span className="text-[#CC2622]">*</span>
                </label>
                <input
                  value={form.staffName}
                  onChange={(event) => setForm((current) => ({ ...current, staffName: event.target.value }))}
                  className="form-input"
                  placeholder="e.g., Maria Santos"
                />
                {fieldErrors.staffName && <p className="mt-1 text-xs text-red-600">{fieldErrors.staffName}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                  Role <span className="text-[#CC2622]">*</span>
                </label>
                <input
                  value={form.staffRole}
                  onChange={(event) => setForm((current) => ({ ...current, staffRole: event.target.value }))}
                  className="form-input"
                  placeholder="e.g., Server"
                />
                {fieldErrors.staffRole && <p className="mt-1 text-xs text-red-600">{fieldErrors.staffRole}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                  Phone <span className="text-[#CC2622]">*</span>
                </label>
                <input
                  value={form.staffPhone}
                  onChange={(event) => setForm((current) => ({ ...current, staffPhone: event.target.value }))}
                  className="form-input"
                  placeholder="07..."
                />
                {fieldErrors.staffPhone && <p className="mt-1 text-xs text-red-600">{fieldErrors.staffPhone}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                  Email
                </label>
                <input
                  type="email"
                  value={form.staffEmail}
                  onChange={(event) => setForm((current) => ({ ...current, staffEmail: event.target.value }))}
                  className="form-input"
                  placeholder="optional@email.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                  Pricing Method
                </label>
                <select
                  value={form.pricingMethod}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      pricingMethod: event.target.value as StaffPricingMethod,
                    }))
                  }
                  className="form-input"
                >
                  <option value="FLAT_RATE">Flat rate</option>
                  <option value="HOURLY">Hourly</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                  Default Price <span className="text-[#CC2622]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.staffSalary}
                  onChange={(event) => setForm((current) => ({ ...current, staffSalary: event.target.value }))}
                  className="form-input"
                  placeholder={form.pricingMethod === 'HOURLY' ? 'e.g., 3000' : 'e.g., 15000'}
                />
                {fieldErrors.staffSalary && <p className="mt-1 text-xs text-red-600">{fieldErrors.staffSalary}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8B4513]">
                Responsibilities
              </label>
              <textarea
                value={form.responsibilities}
                onChange={(event) => setForm((current) => ({ ...current, responsibilities: event.target.value }))}
                rows={3}
                className="form-input"
                placeholder="Comma-separated duties, e.g. Greeting guests, plating, cleanup"
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
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A01F1A] disabled:opacity-50"
          >
            {isEdit ? 'Save Changes' : 'Save Staff Member'}
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
