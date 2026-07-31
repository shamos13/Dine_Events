'use client'

import { Loader2, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { formatKsh, getMenuPackages, selectPackageForEvent, type MenuPackageResponse } from '@/lib/api/menu'

type AddPackageModalProps = {
  isOpen: boolean
  eventId: number
  onClose: () => void
  onAdded: () => void
}

function packageDescription(pkg: MenuPackageResponse): string {
  if (pkg.menuItemNames?.length) {
    return pkg.menuItemNames.join(', ')
  }
  if (pkg.serviceType) {
    return `${pkg.serviceType.charAt(0).toUpperCase()}${pkg.serviceType.slice(1).replace('-', ' ')} catering package.`
  }
  return 'Curated catering package for your event.'
}

function packageTags(pkg: MenuPackageResponse): string[] {
  const tags: string[] = []
  if (pkg.serviceType) {
    tags.push(pkg.serviceType.charAt(0).toUpperCase() + pkg.serviceType.slice(1).replace('-', ' '))
  }
  if (pkg.minGuests != null) {
    tags.push(`Min. ${pkg.minGuests} Pax`)
  }
  if (pkg.menuItemNames?.length) {
    tags.push(`${pkg.menuItemNames.length} Item${pkg.menuItemNames.length === 1 ? '' : 's'}`)
  }
  return tags
}

export default function AddPackageModal({ isOpen, eventId, onClose, onAdded }: AddPackageModalProps) {
  const [packages, setPackages] = useState<MenuPackageResponse[]>([])
  const [search, setSearch] = useState('')
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setSearch('')
    setSelectedPackageId(null)
    setError(null)
    setLoading(true)
    getMenuPackages()
      .then(setPackages)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load packages.')
      )
      .finally(() => setLoading(false))
  }, [isOpen])

  const visiblePackages = useMemo(
    () =>
      packages.filter((pkg) =>
        `${pkg.packageName} ${pkg.serviceType ?? ''} ${pkg.menuItemNames?.join(' ') ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [packages, search]
  )

  const handleSubmit = async () => {
    if (selectedPackageId == null) {
      setError('Select a package to add.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await selectPackageForEvent({ eventId, menuPackageId: selectedPackageId })
      onAdded()
      onClose()
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to add package.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-package-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-[#efb6b0] px-6 py-5">
          <div>
            <h2 id="add-package-title" className="text-2xl font-bold text-slate-900">
              Add Package
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Choose a package to add to this event&apos;s menu catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-[#efb6b0] px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search catering packages..."
              className="w-full rounded-lg border border-[#efb6b0] bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#cc2622] focus:outline-none focus:ring-1 focus:ring-[#cc2622]"
            />
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading packages...
            </div>
          ) : visiblePackages.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              {packages.length === 0
                ? 'No packages available. Create packages in the catalog first.'
                : 'No packages match your search.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {visiblePackages.map((pkg) => {
                const selected = selectedPackageId === pkg.menuPackageId
                const tags = packageTags(pkg)
                return (
                  <li key={pkg.menuPackageId}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPackageId(pkg.menuPackageId)
                        setError(null)
                      }}
                      className={`w-full rounded-lg border p-4 text-left transition ${
                        selected
                          ? 'border-[#cc2622] bg-red-50/40 ring-1 ring-[#cc2622]'
                          : 'border-[#efb6b0] bg-white hover:border-[#cc2622]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="font-semibold text-slate-900">{pkg.packageName}</span>
                            <span className="font-semibold text-[#cc2622]">{formatKsh(pkg.pricePerPax)}</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{packageDescription(pkg)}</p>
                          {tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-[#edf4ff] px-2.5 py-0.5 text-xs font-medium text-slate-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span
                          aria-hidden="true"
                          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            selected ? 'border-[#cc2622]' : 'border-slate-300'
                          }`}
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#cc2622]" />}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#efb6b0] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-600 transition hover:text-slate-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedPackageId == null}
            className="inline-flex items-center gap-2 rounded-md bg-[#cc2622] px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#a01f1a] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Package'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
