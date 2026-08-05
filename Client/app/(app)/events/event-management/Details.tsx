'use client'

import { useEffect, useState } from 'react'
import { Loader2, MapPin, Phone } from 'lucide-react'
import type { EventRecord } from './event-data'
import { DataTable, Panel, SectionHeading } from './components'
import EventSidebarActions from './EventSidebarActions'
import { ApiError } from '@/lib/api/client'
import { EVENT_STATUSES, updateEventDiscount, type EventStatus } from '@/lib/api/events'
import { getEventMenuSelections } from '@/lib/api/menu'
import { getInventoryAllocationsByEvent } from '@/lib/api/inventory'
import { getStaffAssignmentsByEvent } from '@/lib/api/staff'
import { currency, lineItemLabels } from './EventTotals'

export default function Details({
  event,
  statusUpdating = false,
  onStatusChange,
  onDiscountSaved,
  onGenerateInvoice,
  onGenerateProposal,
}: {
  event: EventRecord
  statusUpdating?: boolean
  onStatusChange?: (status: EventStatus) => void | Promise<void>
  onDiscountSaved?: (updated: EventRecord) => void
  onGenerateInvoice?: () => void
  onGenerateProposal?: () => void
}) {
  const [costRows, setCostRows] = useState<[string, number][]>([])
  const [costLoading, setCostLoading] = useState(true)
  const [costError, setCostError] = useState<string | null>(null)
  const [discountPercent, setDiscountPercent] = useState(String(event.discountPercent ?? 0))
  const [discountReason, setDiscountReason] = useState(event.discountReason ?? '')
  const [discountSaving, setDiscountSaving] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [discountMessage, setDiscountMessage] = useState<string | null>(null)

  useEffect(() => {
    setDiscountPercent(String(event.discountPercent ?? 0))
    setDiscountReason(event.discountReason ?? '')
  }, [event.discountPercent, event.discountReason, event.id])

  useEffect(() => {
    let active = true
    setCostLoading(true)
    setCostError(null)
    Promise.all([
      getEventMenuSelections(event.id),
      getInventoryAllocationsByEvent(event.id),
      getStaffAssignmentsByEvent(event.id),
    ])
      .then(([menuSelections, rentalAllocations, staffAssignments]) => {
        if (!active) return
        const rows: [string, number][] = []
        const menuTotal = menuSelections.reduce(
          (sum, selection) => sum + Number(selection.pricePerPax ?? 0) * Number(selection.guestCount ?? 0),
          0
        )
        const rentalTotal = rentalAllocations.reduce((sum, allocation) => sum + Number(allocation.totalCost ?? 0), 0)
        const staffTotal = staffAssignments.reduce((sum, assignment) => sum + Number(assignment.salaryAtAssignment ?? 0), 0)
        if (menuTotal > 0) rows.push([lineItemLabels.MENU_PACKAGE, menuTotal])
        if (rentalTotal > 0) rows.push([lineItemLabels.RENTAL, rentalTotal])
        if (staffTotal > 0) rows.push([lineItemLabels.STAFF, staffTotal])
        setCostRows(rows)
      })
      .catch((reason: unknown) => {
        if (active) {
          setCostError(reason instanceof ApiError ? reason.message : 'Unable to load cost breakdown.')
          setCostRows([])
        }
      })
      .finally(() => {
        if (active) setCostLoading(false)
      })

    return () => {
      active = false
    }
  }, [event.id])

  const costSubtotal = costRows.reduce((sum, [, value]) => sum + value, 0)
  const liveDiscountPct = Math.min(100, Math.max(0, Number(discountPercent) || 0))
  const liveDiscountAmount = costSubtotal * (liveDiscountPct / 100)
  const costTotal = Math.max(0, costSubtotal - liveDiscountAmount)
  const cancelled = event.status === 'CANCELLED'
  const startTime = event.dateTime.includes(', ') ? event.dateTime.split(', ').slice(1).join(', ') : event.dateTime
  const endTime = event.endDateTime
    ? event.endDateTime.includes(', ')
      ? event.endDateTime.split(', ').slice(1).join(', ')
      : event.endDateTime
    : null

  const timelineRows = [
    [startTime, 'Event Start', event.venue, '—'],
    ...(endTime ? [[endTime, 'Event End', event.venue, '—']] : []),
  ]

  const saveDiscount = async () => {
    const percent = Number(discountPercent)
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      setDiscountError('Enter a discount between 0 and 100%.')
      return
    }
    setDiscountSaving(true)
    setDiscountError(null)
    setDiscountMessage(null)
    try {
      const updated = await updateEventDiscount(event.id, {
        discountPercent: percent,
        discountReason: discountReason.trim() || null,
      })
      onDiscountSaved?.({
        ...event,
        discountPercent: Number(updated.discountPercent ?? 0),
        discountReason: updated.discountReason ?? null,
      })
      setDiscountMessage(
        percent > 0
          ? `${percent}% discount saved. Generate a new proposal to apply it to the quotation total.`
          : 'Discount cleared. New proposals will use the full subtotal.'
      )
    } catch (reason) {
      setDiscountError(reason instanceof ApiError ? reason.message : 'Unable to save discount.')
    } finally {
      setDiscountSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.96fr)]">
      <div className="space-y-6">
        <Panel>
          <SectionHeading title="Event Details" subtitle="Basic information about the event" />
          <div className="grid gap-7 sm:grid-cols-2">
            <div className="space-y-6">
              <Detail label="Name" value={event.name} />
              <Detail label="Date & Time" value={event.dateTime} />
              {event.endDateTime && <Detail label="End Time" value={event.endDateTime} />}
              <Detail label="Guest Count" value={`${event.guests} guests`} />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-600">Status</p>
                {onStatusChange ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={event.status}
                      disabled={statusUpdating}
                      onChange={(e) => void onStatusChange(e.target.value as EventStatus)}
                      className={`rounded-full border border-[#eeb7b2] px-3 py-1 text-sm font-semibold outline-none transition focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20 disabled:cursor-not-allowed disabled:opacity-60 ${event.statusStyle}`}
                    >
                      {EVENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {statusUpdating && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                  </div>
                ) : (
                  <span className={`mt-2 inline-block rounded-full border border-[#eeb7b2] px-3 py-1 text-sm font-semibold ${event.statusStyle}`}>
                    {event.status}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-600">Client</p>
                <p className="mt-2 font-semibold text-[#cc2622]">{event.client}</p>
                {event.email && <p className="mt-1 text-sm text-slate-600">{event.email}</p>}
                {event.phone && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-[#cc2622]" />
                    {event.phone}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-600">Venue</p>
                <p className="mt-2 font-medium text-slate-800">{event.venue}</p>
                {event.location && (
                  <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#cc2622]" />
                    {event.location}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeading
            title="Price Adjustment"
            subtitle="Use a percent discount and/or reduce rental quantities when a client asks for a price change"
          />
          {cancelled ? (
            <p className="text-sm text-slate-600">Discounts cannot be changed for cancelled events.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Discount (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="mt-2 h-11 w-full rounded-md border border-[#efb6b0] bg-white px-3 text-sm font-normal outline-none focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Reason (optional)
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="e.g. Loyal client 10% courtesy discount"
                    className="mt-2 h-11 w-full rounded-md border border-[#efb6b0] bg-white px-3 text-sm font-normal outline-none focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20"
                  />
                </label>
              </div>
              <p className="rounded-md border border-[#efb6b0] bg-[#edf4ff] p-3 text-sm text-[#3b1d1a]">
                To reduce assigned inventory (chairs, tents, etc.), open the{' '}
                <span className="font-semibold">Rentals</span> tab and use − / + or Edit on each item. Then generate a
                new proposal so the quotation total updates.
              </p>
              {discountError && (
                <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {discountError}
                </p>
              )}
              {discountMessage && (
                <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {discountMessage}
                </p>
              )}
              <button
                type="button"
                disabled={discountSaving}
                onClick={() => void saveDiscount()}
                className="inline-flex items-center gap-2 rounded-md bg-[#cc2622] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#a01f1a] disabled:opacity-60"
              >
                {discountSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save discount
              </button>
            </div>
          )}
        </Panel>

        <Panel>
          <SectionHeading title="Cost Breakdown" subtitle="Live totals from menu, rentals, and staffing" />
          {costLoading ? (
            <p className="text-sm text-slate-600">Loading costs...</p>
          ) : costError ? (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {costError}
            </p>
          ) : costRows.length === 0 ? (
            <p className="text-sm text-slate-600">No menu packages, rentals, or staff assigned yet.</p>
          ) : (
            <div className="space-y-3 text-sm">
              {costRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <span className="text-slate-700">{label}</span>
                  <span className="font-medium text-slate-900">{currency(value)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 border-t border-[#efb6b0] pt-3">
                <span className="font-semibold text-slate-900">Subtotal</span>
                <span className="font-medium text-slate-900">{currency(costSubtotal)}</span>
              </div>
              {liveDiscountPct > 0 && (
                <div className="flex items-center justify-between gap-4 text-emerald-800">
                  <span>Discount ({liveDiscountPct}%)</span>
                  <span className="font-medium">− {currency(liveDiscountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 border-t border-[#efb6b0] pt-3">
                <span className="font-bold text-slate-900">Total after discount</span>
                <span className="text-lg font-bold text-[#cc2622]">{currency(costTotal)}</span>
              </div>
            </div>
          )}
        </Panel>

        <Panel>
          <SectionHeading title="Special Requests" subtitle="Notes from the client for this event" />
          {event.specialRequests?.trim() ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{event.specialRequests}</p>
          ) : (
            <p className="text-sm text-slate-600">No special requests recorded.</p>
          )}
        </Panel>

        <Panel>
          <SectionHeading title="Event Timeline" subtitle="Schedule for this event" />
          <DataTable headers={['Time', 'Item', 'Venue', 'Notes']} rows={timelineRows} />
        </Panel>
      </div>

      <EventSidebarActions
        eventId={event.id}
        eventStatus={event.status}
        discountPercent={liveDiscountPct}
        onGenerateInvoice={onGenerateInvoice}
        onGenerateProposal={onGenerateProposal}
      />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-600">{label}</p>
      <p className="mt-2 font-medium text-slate-800">{value}</p>
    </div>
  )
}
