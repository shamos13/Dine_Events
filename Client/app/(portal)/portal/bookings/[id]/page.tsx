'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ApiError } from '@/lib/api/client'
import { formatKsh, type MenuPackageResponse } from '@/lib/api/menu'
import {
  acceptPortalQuotation,
  cancelPortalEvent,
  declinePortalQuotation,
  getPortalEvent,
  getPortalMenuPackages,
  updatePortalEvent,
  type PortalEventDetail,
} from '@/lib/api/portal'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { StatusPill } from '@/components/ui/status-pill'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'

const STATUS_FLOW = ['INQUIRY', 'TENTATIVE', 'CONFIRMED', 'COMPLETED'] as const

function toDateInput(value: string | null | undefined): { date: string; time: string } {
  if (!value) return { date: '', time: '12:00' }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return { date: '', time: '12:00' }
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return {
    date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  }
}

export default function PortalBookingDetailPage() {
  const params = useParams<{ id: string }>()
  const eventId = Number(params.id)
  const { toast } = useToast()
  const [detail, setDetail] = useState<PortalEventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [packages, setPackages] = useState<MenuPackageResponse[]>([])
  const [editForm, setEditForm] = useState({
    eventName: '',
    guestCount: '',
    eventVenue: '',
    eventLocation: '',
    eventDate: '',
    eventTime: '12:00',
    specialRequests: '',
    menuPackageIds: [] as number[],
  })

  const load = useCallback(() => {
    if (!Number.isFinite(eventId)) return
    setLoading(true)
    getPortalEvent(eventId)
      .then(setDetail)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load booking.')
      )
      .finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => {
    load()
  }, [load])

  const onAccept = async (quotationId: number) => {
    setBusyId(quotationId)
    try {
      await acceptPortalQuotation(quotationId)
      toast('Quotation accepted. Invoice created.', 'success')
      load()
    } catch (reason: unknown) {
      toast(reason instanceof ApiError ? reason.message : 'Unable to accept quotation.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const onDecline = async (quotationId: number) => {
    if (!window.confirm('Decline this quotation?')) return
    setBusyId(quotationId)
    try {
      await declinePortalQuotation(quotationId)
      toast('Quotation declined.', 'info')
      load()
    } catch (reason: unknown) {
      toast(reason instanceof ApiError ? reason.message : 'Unable to decline quotation.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const openEdit = () => {
    if (!detail) return
    const { date, time } = toDateInput(detail.event.eventDateTime)
    setEditForm({
      eventName: detail.event.eventName,
      guestCount: String(detail.event.guestCount),
      eventVenue: detail.event.eventVenue ?? '',
      eventLocation: detail.event.eventLocation ?? '',
      eventDate: date,
      eventTime: time,
      specialRequests: (detail.event as { specialRequests?: string | null }).specialRequests ?? '',
      menuPackageIds: detail.menuSelections.map((selection) => selection.menuPackageId),
    })
    setActionError(null)
    setEditOpen(true)
    getPortalMenuPackages()
      .then(setPackages)
      .catch(() => setPackages([]))
  }

  const toggleEditPackage = (id: number) => {
    setEditForm((current) => ({
      ...current,
      menuPackageIds: current.menuPackageIds.includes(id)
        ? current.menuPackageIds.filter((item) => item !== id)
        : [...current.menuPackageIds, id],
    }))
  }

  const onSaveEdit = async () => {
    setActionError(null)
    if (!editForm.eventName.trim() || !editForm.eventVenue.trim() || !editForm.eventDate) {
      setActionError('Event name, venue and date are required.')
      return
    }
    setSaving(true)
    try {
      const eventDateTime = new Date(`${editForm.eventDate}T${editForm.eventTime}:00`).toISOString()
      const updated = await updatePortalEvent(eventId, {
        eventName: editForm.eventName.trim(),
        guestCount: Number(editForm.guestCount) || undefined,
        eventVenue: editForm.eventVenue.trim(),
        eventLocation: editForm.eventLocation.trim(),
        eventDateTime,
        specialRequests: editForm.specialRequests.trim(),
        menuPackageIds: editForm.menuPackageIds,
      })
      setDetail(updated)
      setEditOpen(false)
      toast('Booking updated.', 'success')
    } catch (reason: unknown) {
      setActionError(reason instanceof ApiError ? reason.message : 'Unable to update booking.')
    } finally {
      setSaving(false)
    }
  }

  const onCancelBooking = async () => {
    setActionError(null)
    setCancelling(true)
    try {
      const result = await cancelPortalEvent(eventId)
      setCancelOpen(false)
      toast(result.message, result.refundAmount > 0 ? 'success' : 'info')
      load()
    } catch (reason: unknown) {
      setActionError(reason instanceof ApiError ? reason.message : 'Unable to cancel booking.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <Skeleton className="h-64 w-full" />
  if (error) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
  if (!detail) return null

  const { event } = detail
  const currentIndex = STATUS_FLOW.indexOf(event.eventStatus as (typeof STATUS_FLOW)[number])
  const editable = event.eventStatus !== 'CANCELLED' && event.eventStatus !== 'COMPLETED'
  const totalPaid = detail.invoices.reduce((sum, invoice) => sum + (invoice.amountPaid ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/bookings" className="text-sm font-semibold text-brand hover:text-brand-dark">
          ← Back to bookings
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.eventName}</h1>
            <p className="mt-1 text-gray-600">
              {event.eventVenue}
              {event.eventLocation ? ` · ${event.eventLocation}` : ''} · {event.guestCount} guests
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={event.eventStatus} />
            {editable && (
              <>
                <button
                  type="button"
                  onClick={openEdit}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Edit booking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null)
                    setCancelOpen(true)
                  }}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Cancel booking
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Status timeline</h2>
        <ol className="flex flex-wrap gap-3">
          {STATUS_FLOW.map((status, index) => {
            const active = currentIndex >= index && event.eventStatus !== 'CANCELLED'
            return (
              <li
                key={status}
                className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                  active ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {status}
              </li>
            )
          })}
          {event.eventStatus === 'CANCELLED' && <StatusPill status="CANCELLED" />}
        </ol>
        <p className="mt-4 text-sm text-gray-600">
          {new Date(event.eventDateTime).toLocaleString()}
          {event.eventEndDateTime ? ` → ${new Date(event.eventEndDateTime).toLocaleString()}` : ''}
        </p>
        {(detail.event as { specialRequests?: string | null }).specialRequests && (
          <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <span className="font-semibold">Special requests:</span>{' '}
            {(detail.event as { specialRequests?: string | null }).specialRequests}
          </p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-bold text-gray-900">Menu packages</h2>
          {detail.menuSelections.length === 0 && <p className="text-sm text-gray-500">No packages selected.</p>}
          <ul className="space-y-3">
            {detail.menuSelections.map((selection) => (
              <li key={selection.selectionId} className="rounded-lg border border-gray-100 p-3">
                <p className="font-semibold text-gray-900">{selection.packageName}</p>
                <p className="text-sm text-gray-600">
                  {selection.serviceType} · {formatKsh(selection.pricePerPax)} / guest · {selection.guestCount} guests
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold text-gray-900">Rentals</h2>
          {detail.rentals.length === 0 && <p className="text-sm text-gray-500">No rentals allocated yet.</p>}
          <ul className="space-y-3">
            {detail.rentals.map((rental) => (
              <li key={rental.allocationId} className="rounded-lg border border-gray-100 p-3">
                <p className="font-semibold text-gray-900">{rental.inventoryName}</p>
                <p className="text-sm text-gray-600">
                  Qty {rental.quantityAllocated} · {formatKsh(rental.totalCost)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Quotations</h2>
        {detail.quotations.length === 0 && (
          <p className="text-sm text-gray-500">
            No quotations yet. When your planner finishes adding menu, rentals, and staffing, they will send a proposal here for you to accept.
          </p>
        )}
        <div className="space-y-4">
          {detail.quotations.map((quotation) => (
            <div key={quotation.quotationId} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900">
                    {quotation.quotationNumber} · {quotation.quotationName}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">Total {formatKsh(quotation.total)}</p>
                  {quotation.quotationStatus === 'SENT' && (
                    <p className="mt-1 text-xs text-amber-700">
                      Awaiting your acceptance — review the proposal, then accept to generate an invoice.
                    </p>
                  )}
                  {quotation.quotationStatus === 'ACCEPTED' && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Accepted — invoice is ready.{' '}
                      <Link href="/portal/invoices" className="font-semibold underline">
                        Go to invoices
                      </Link>
                    </p>
                  )}
                </div>
                <StatusPill status={quotation.quotationStatus} />
              </div>
              {quotation.quotationStatus === 'SENT' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === quotation.quotationId}
                    onClick={() => onAccept(quotation.quotationId)}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
                  >
                    Accept & generate invoice
                  </button>
                  <button
                    type="button"
                    disabled={busyId === quotation.quotationId}
                    onClick={() => onDecline(quotation.quotationId)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Invoices</h2>
        {detail.invoices.length === 0 && <p className="text-sm text-gray-500">No invoices for this event yet.</p>}
        <ul className="space-y-3">
          {detail.invoices.map((invoice) => (
            <li key={invoice.invoiceId}>
              <Link
                href={`/portal/invoices/${invoice.invoiceId}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 hover:border-brand/40"
              >
                <div>
                  <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-gray-600">
                    Due {invoice.dueDate} · Balance {formatKsh(invoice.balance)}
                  </p>
                </div>
                <StatusPill status={invoice.invoiceStatus} />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit booking" size="lg">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Event name</label>
            <input
              className="form-input"
              value={editForm.eventName}
              onChange={(e) => setEditForm((c) => ({ ...c, eventName: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Guest count</label>
              <input
                className="form-input"
                type="number"
                min={1}
                value={editForm.guestCount}
                onChange={(e) => setEditForm((c) => ({ ...c, guestCount: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Venue</label>
              <input
                className="form-input"
                value={editForm.eventVenue}
                onChange={(e) => setEditForm((c) => ({ ...c, eventVenue: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Location</label>
              <input
                className="form-input"
                value={editForm.eventLocation}
                onChange={(e) => setEditForm((c) => ({ ...c, eventLocation: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Date</label>
              <input
                className="form-input"
                type="date"
                value={editForm.eventDate}
                onChange={(e) => setEditForm((c) => ({ ...c, eventDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Start time</label>
              <input
                className="form-input"
                type="time"
                value={editForm.eventTime}
                onChange={(e) => setEditForm((c) => ({ ...c, eventTime: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Menu packages</label>
            {packages.length === 0 ? (
              <p className="text-sm text-gray-500">Loading packages…</p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-2">
                {packages.map((pkg) => {
                  const selected = editForm.menuPackageIds.includes(pkg.menuPackageId)
                  return (
                    <button
                      key={pkg.menuPackageId}
                      type="button"
                      onClick={() => toggleEditPackage(pkg.menuPackageId)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                        selected ? 'border-brand bg-brand-soft' : 'border-gray-200 hover:border-brand/40'
                      }`}
                    >
                      <span className="font-semibold text-gray-900">{pkg.packageName}</span>
                      <span className="text-xs text-gray-600">
                        {formatKsh(pkg.pricePerPax)} / guest {selected ? '· Selected' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Special requests</label>
            <textarea
              className="form-input min-h-24"
              value={editForm.specialRequests}
              onChange={(e) => setEditForm((c) => ({ ...c, specialRequests: e.target.value }))}
            />
          </div>
          {actionError && <p role="alert" className="text-sm font-medium text-red-600">{actionError}</p>}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onSaveEdit}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this booking?">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Cancelling <span className="font-semibold">{event.eventName}</span> will also cancel its invoices and cannot
            be undone.
          </p>
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Refund policy</p>
            <p className="mt-1">
              You get <strong>75%</strong> of everything you have paid back.
              {totalPaid > 0
                ? ` You have paid ${formatKsh(totalPaid)}, so approximately ${formatKsh(totalPaid * 0.75)} will be refunded.`
                : ' No payments have been made yet, so no refund is due.'}
            </p>
          </div>
          {actionError && <p role="alert" className="text-sm font-medium text-red-600">{actionError}</p>}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setCancelOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Keep booking
            </button>
            <button
              type="button"
              disabled={cancelling}
              onClick={onCancelBooking}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {cancelling ? 'Cancelling…' : 'Cancel booking'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
