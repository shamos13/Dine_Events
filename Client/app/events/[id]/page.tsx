'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Archive, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Billing from '../event-management/Billing'
import Communication from '../event-management/Communication'
import Details from '../event-management/Details'
import Files from '../event-management/Files'
import Menu from '../event-management/Menu'
import Notes from '../event-management/Notes'
import Rentals from '../event-management/Rentals'
import Staff from '../event-management/Staff'
import { toEventRecord, type EventRecord } from '../event-management/event-data'
import { ApiError } from '@/lib/api/client'
import { getEvents } from '@/lib/api/events'

const tabs = ['Details', 'Billing', 'Menu', 'Staff', 'Rentals', 'Notes', 'Files', 'Communication'] as const
type Tab = (typeof tabs)[number]

const tabContent: Record<Tab, (event: EventRecord) => React.ReactNode> = {
  Details: (event) => <Details event={event} />,
  Billing: (event) => <Billing event={event} />,
  Menu: (event) => <Menu event={event} />,
  Staff: (event) => <Staff event={event} />,
  Rentals: (event) => <Rentals event={event} />,
  Notes: (event) => <Notes event={event} />,
  Files: (event) => <Files event={event} />,
  Communication: (event) => <Communication event={event} />,
}

export default function EventDetails() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('Details')
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getEvents()
      .then((events) => {
        const found = events.find((item) => item.eventId === Number(id))
        if (!found) throw new ApiError({ status: 404, error: 'Not Found', message: 'Event not found.' })
        setEvent(toEventRecord(found))
      })
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load event.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-screen bg-[#f7f8fc]"><Header /><main className="mx-auto w-full max-w-[1440px] px-6 py-12 text-slate-600 lg:px-8">Loading event...</main><Footer /></div>
  if (error || !event) return <div className="min-h-screen bg-[#f7f8fc]"><Header /><main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-8"><p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error ?? 'Event not found.'}</p></main><Footer /></div>

  return <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
    <Header />
    <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-8">
      <div className="flex items-center gap-1 text-sm text-slate-600"><Link href="/events" className="hover:text-[#cc2622]">Events</Link><ChevronRight className="h-4 w-4" /><span>{event.name}</span></div>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-4xl font-bold text-slate-900">{event.name}</h1><p className="mt-2 text-base text-slate-600">{event.client} <span aria-hidden="true">•</span> {event.guests} guests <span aria-hidden="true">•</span> {event.date} <span aria-hidden="true">•</span> {event.dateTime.split(', ')[1]}</p></div><div className="flex items-center gap-3"><span className={`rounded-full border border-[#eeb7b2] px-3 py-1.5 text-sm font-semibold ${event.statusStyle}`}>{event.status}</span><button className="inline-flex items-center gap-2 rounded-md border border-[#eeb7b2] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-red-50"><Archive className="h-4 w-4" />Archive</button></div></div>
      <div className="mt-8 flex overflow-x-auto border-b border-[#efb6b0]">{tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium ${activeTab === tab ? 'border-[#cc2622] text-[#cc2622]' : 'border-transparent text-slate-600 hover:text-[#cc2622]'}`}>{tab}</button>)}</div>
      <div className="mt-8">{tabContent[activeTab](event)}</div>
    </main>
    <Footer />
  </div>
}
