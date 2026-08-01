'use client'

import { useEffect, useState } from 'react'
import { MapPin, Phone } from 'lucide-react'
import type { EventRecord } from './event-data'
import { DataTable, Panel, SectionHeading } from './components'
import EventSidebarActions from './EventSidebarActions'
import { ApiError } from '@/lib/api/client'
import { getEventMenuSelections } from '@/lib/api/menu'
import { getInventoryAllocationsByEvent } from '@/lib/api/inventory'
import { getStaffAssignmentsByEvent } from '@/lib/api/staff'
import { currency, lineItemLabels } from './EventTotals'

export default function Details({
  event,
  onGenerateInvoice,
  onGenerateProposal,
}: {
  event: EventRecord
  onGenerateInvoice?: () => void
  onGenerateProposal?: () => void
}) {
  const [costRows, setCostRows] = useState<[string, number][]>([])
  const [costLoading, setCostLoading] = useState(true)
  const [costError, setCostError] = useState<string | null>(null)

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

  const costTotal = costRows.reduce((sum, [, value]) => sum + value, 0)
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
                <span className={`mt-2 inline-block rounded-full border border-[#eeb7b2] px-3 py-1 text-sm font-semibold ${event.statusStyle}`}>
                  {event.status}
                </span>
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
                <span className="font-bold text-slate-900">Total</span>
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
