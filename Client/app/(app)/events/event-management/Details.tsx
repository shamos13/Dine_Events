import { MapPin, Pencil, Plus } from 'lucide-react'
import type { EventRecord } from './event-data'
import { DataTable, OutlineButton, Panel, SectionHeading } from './components'
import EventSidebarActions from './EventSidebarActions'

export default function Details({
  event,
  onGenerateInvoice,
  onGenerateProposal,
}: {
  event: EventRecord
  onGenerateInvoice?: () => void
  onGenerateProposal?: () => void
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.96fr)]">
      <div className="space-y-6">
        <Panel>
          <SectionHeading title="Event Details" subtitle="Basic information about the event" action={<OutlineButton><Pencil className="h-4 w-4" />Edit</OutlineButton>} />
          <div className="grid gap-7 sm:grid-cols-2">
            <div className="space-y-6">
              <Detail label="Name" value={event.name} />
              <Detail label="Date & Time" value={event.dateTime} />
              <Detail label="Guest Count" value={`${event.guests} guests`} />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-600">Status</p>
                <span className={`mt-2 inline-block rounded-full border border-[#eeb7b2] px-3 py-1 text-sm font-semibold ${event.statusStyle}`}>{event.status}</span>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-600">Client</p>
                <button className="mt-2 font-semibold text-[#cc2622] hover:underline">{event.client}</button>
                <p className="mt-1 text-sm text-slate-600">{event.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-600">Venue</p>
                <p className="mt-2 font-medium text-slate-800">{event.venue}</p>
                {event.location && <p className="mt-2 flex items-start gap-2 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#cc2622]" />{event.location}</p>}
              </div>
            </div>
          </div>
        </Panel>
        <Panel>
          <SectionHeading title="Service Charges & Gratuity" subtitle="Primary charges applied to this event" />
          <DataTable headers={['Name', 'Tax Status', 'Amount', 'Actions']} rows={[[<div key="charge"><p className="font-medium">Service Charge</p><p className="text-xs text-slate-600">From template: Service Charge</p></div>, 'Taxable', '20%', <div key="actions" className="flex justify-end gap-4"><button>Edit</button><button className="text-[#cc2622]">Remove</button></div>]]} />
          <OutlineButton className="mt-4">Add Gratuity</OutlineButton>
        </Panel>
        <Panel>
          <SectionHeading title="Taxes" subtitle="Tax rates applied to eligible items" action={<OutlineButton><Pencil className="h-4 w-4" />Edit</OutlineButton>} />
          <DataTable headers={['Name', 'Applies To', 'Amount']} rows={[[<div key="tax"><p className="font-medium">Sales Tax</p><p className="text-xs text-slate-600">From template: Sales Tax</p></div>, '0 items', '5%']]} />
        </Panel>
        <Panel>
          <h2 className="text-xl font-bold">Additional Fees & Discounts</h2>
          <div className="flex flex-col items-center py-9">
            <p className="text-sm text-slate-600">No Additional Fees or Discounts</p>
            <div className="mt-4 flex gap-3">
              <OutlineButton>Add Fee</OutlineButton>
              <OutlineButton>Add Discount</OutlineButton>
            </div>
          </div>
        </Panel>
        <Panel>
          <SectionHeading title="Event Timeline" subtitle="Schedule of activities and key moments for this event" action={<OutlineButton><Plus className="h-4 w-4" />Add Timeline Item</OutlineButton>} />
          <DataTable headers={['Time', 'Item', 'Internal Notes', 'Actions']} rows={[[event.dateTime.split(', ')[1], 'Event Start', '—', <div key="timeline" className="flex justify-end gap-4"><button>Edit</button><button className="text-[#cc2622]">Remove</button></div>]]} />
        </Panel>
      </div>

      <EventSidebarActions
        eventId={event.id}
        onGenerateInvoice={onGenerateInvoice}
        onGenerateProposal={onGenerateProposal}
      />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-semibold uppercase text-slate-600">{label}</p><p className="mt-2 font-medium text-slate-800">{value}</p></div>
}
