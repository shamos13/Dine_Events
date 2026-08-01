'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import { formatKsh, type MenuPackageResponse } from '@/lib/api/menu'
import { createPortalEvent, getPortalMenuPackages } from '@/lib/api/portal'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'

const steps = ['Basics', 'Venue', 'Menu', 'Requests', 'Review']

export default function BuildEventPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [packages, setPackages] = useState<MenuPackageResponse[]>([])
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [packagesError, setPackagesError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    eventName: '',
    guestCount: '50',
    eventVenue: '',
    eventLocation: '',
    eventDate: '',
    eventTime: '12:00',
    specialRequests: '',
    menuPackageIds: [] as number[],
  })

  const loadPackages = useCallback(() => {
    setPackagesLoading(true)
    setPackagesError(null)
    getPortalMenuPackages()
      .then(setPackages)
      .catch((reason: unknown) => {
        setPackagesError(reason instanceof ApiError ? reason.message : 'Unable to load menu packages.')
      })
      .finally(() => setPackagesLoading(false))
  }, [])

  useEffect(() => {
    loadPackages()
  }, [loadPackages])

  // Refresh the catalog whenever the Menu step opens so newly created packages appear immediately.
  useEffect(() => {
    if (step === 2) {
      loadPackages()
    }
  }, [step, loadPackages])

  const estimate = useMemo(() => {
    const guests = Number(form.guestCount) || 0
    return form.menuPackageIds.reduce((sum, id) => {
      const pkg = packages.find((item) => item.menuPackageId === id)
      return sum + (pkg ? Number(pkg.pricePerPax) * guests : 0)
    }, 0)
  }, [form.guestCount, form.menuPackageIds, packages])

  const update = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const togglePackage = (id: number) => {
    setForm((current) => ({
      ...current,
      menuPackageIds: current.menuPackageIds.includes(id)
        ? current.menuPackageIds.filter((item) => item !== id)
        : [...current.menuPackageIds, id],
    }))
  }

  const canContinue = () => {
    if (step === 0) return form.eventName.trim() && Number(form.guestCount) >= 1 && form.eventDate
    if (step === 1) return form.eventVenue.trim()
    // Require a package only when packages are actually available to choose from.
    if (step === 2) return packages.length === 0 || form.menuPackageIds.length > 0
    return true
  }

  const submit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const eventDateTime = new Date(`${form.eventDate}T${form.eventTime}:00`).toISOString()
      const detail = await createPortalEvent({
        eventName: form.eventName.trim(),
        guestCount: Number(form.guestCount),
        eventVenue: form.eventVenue.trim(),
        eventLocation: form.eventLocation.trim() || undefined,
        eventDateTime,
        specialRequests: form.specialRequests.trim() || undefined,
        menuPackageIds: form.menuPackageIds,
      })
      toast('Inquiry submitted. Our team will review your event.', 'success')
      router.push(`/portal/bookings/${detail.event.eventId}`)
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to submit your event inquiry.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Build Your Event</h1>
        <p className="mt-1 text-gray-600">A guided inquiry — we&apos;ll turn this into a formal quotation.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <div
            key={label}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              index === step
                ? 'bg-brand text-white'
                : index < step
                  ? 'bg-brand-soft text-brand'
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            {index < step ? <Check className="h-3.5 w-3.5" /> : <span>{index + 1}</span>}
            {label}
          </div>
        ))}
      </div>

      <Card className="space-y-5">
        {step === 0 && (
          <>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Event name</label>
              <input className="form-input" value={form.eventName} onChange={(e) => update('eventName', e.target.value)} placeholder="Jenkins Wedding Reception" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Guest count</label>
                <input className="form-input" type="number" min={1} value={form.guestCount} onChange={(e) => update('guestCount', e.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Date</label>
                <input className="form-input" type="date" value={form.eventDate} onChange={(e) => update('eventDate', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Start time</label>
              <input className="form-input" type="time" value={form.eventTime} onChange={(e) => update('eventTime', e.target.value)} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Venue</label>
              <input className="form-input" value={form.eventVenue} onChange={(e) => update('eventVenue', e.target.value)} placeholder="Grand Plaza Hotel" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Location / area</label>
              <input className="form-input" value={form.eventLocation} onChange={(e) => update('eventLocation', e.target.value)} placeholder="Westlands, Nairobi" />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600">Select one or more packages. Estimate updates live.</p>
              <button
                type="button"
                onClick={loadPackages}
                disabled={packagesLoading}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${packagesLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
            {packagesLoading && <p className="text-sm text-gray-500">Loading available packages…</p>}
            {packagesError && !packagesLoading && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {packagesError}{' '}
                <button type="button" onClick={loadPackages} className="font-semibold underline">
                  Try again
                </button>
              </div>
            )}
            {!packagesLoading && !packagesError && packages.length === 0 && (
              <p className="text-sm text-gray-500">No packages available yet. You can still submit and we&apos;ll curate options.</p>
            )}
            {packages.map((pkg) => {
              const selected = form.menuPackageIds.includes(pkg.menuPackageId)
              return (
                <button
                  key={pkg.menuPackageId}
                  type="button"
                  onClick={() => togglePackage(pkg.menuPackageId)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selected ? 'border-brand bg-brand-soft' : 'border-gray-200 hover:border-brand/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">{pkg.packageName}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {pkg.serviceType ?? 'Service'} · {formatKsh(pkg.pricePerPax)} / guest
                        {pkg.minGuests ? ` · min ${pkg.minGuests}` : ''}
                      </p>
                      {pkg.menuItemNames && pkg.menuItemNames.length > 0 && (
                        <p className="mt-2 text-xs text-gray-500">{pkg.menuItemNames.slice(0, 6).join(', ')}</p>
                      )}
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${selected ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {selected ? 'Selected' : 'Select'}
                    </span>
                  </div>
                </button>
              )
            })}
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
              Live estimate: {formatKsh(estimate)}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Special requests</label>
            <textarea
              className="form-input min-h-32"
              value={form.specialRequests}
              onChange={(e) => update('specialRequests', e.target.value)}
              placeholder="Dietary needs, décor notes, timeline preferences…"
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm text-gray-700">
            <p><span className="font-semibold text-gray-900">Event:</span> {form.eventName}</p>
            <p><span className="font-semibold text-gray-900">Guests:</span> {form.guestCount}</p>
            <p><span className="font-semibold text-gray-900">When:</span> {form.eventDate} at {form.eventTime}</p>
            <p><span className="font-semibold text-gray-900">Venue:</span> {form.eventVenue}{form.eventLocation ? ` · ${form.eventLocation}` : ''}</p>
            <p>
              <span className="font-semibold text-gray-900">Packages:</span>{' '}
              {form.menuPackageIds
                .map((id) => packages.find((pkg) => pkg.menuPackageId === id)?.packageName)
                .filter(Boolean)
                .join(', ') || 'None selected'}
            </p>
            <p><span className="font-semibold text-gray-900">Estimate:</span> {formatKsh(estimate)}</p>
            {form.specialRequests && (
              <p><span className="font-semibold text-gray-900">Requests:</span> {form.specialRequests}</p>
            )}
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
              Submitting creates an <strong>INQUIRY</strong>. Our planners will review and send a quotation.
            </p>
          </div>
        )}

        {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((current) => current - 1)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              disabled={!canContinue()}
              onClick={() => setStep((current) => current + 1)}
              className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit inquiry'}
            </button>
          )}
        </div>
      </Card>
    </div>
  )
}
