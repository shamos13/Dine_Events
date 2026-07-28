'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Calendar, Clock, Plus, TrendingUp, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getEvents, type EventResponse } from '@/lib/api/events'
import { getInvoices, type InvoiceResponse } from '@/lib/api/invoices'
import { getQuotations, type QuotationResponse } from '@/lib/api/quotations'
import { ApiError } from '@/lib/api/client'

const eventStatusLabels: Record<EventResponse['eventStatus'], string> = {
  CONFIRMED: 'Confirmed', INQUIRY: 'Inquiry', TENTATIVE: 'Tentative', CANCELLED: 'Cancelled', COMPLETED: 'Completed',
}
const eventStatusStyles: Record<EventResponse['eventStatus'], string> = {
  CONFIRMED: 'bg-blue-100 text-blue-700', INQUIRY: 'bg-purple-100 text-purple-700', TENTATIVE: 'bg-orange-100 text-orange-700', CANCELLED: 'bg-red-100 text-red-700', COMPLETED: 'bg-green-100 text-green-700',
}

export default function Dashboard() {
  const [events, setEvents] = useState<EventResponse[]>([])
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([])
  const [quotations, setQuotations] = useState<QuotationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getEvents(), getInvoices(), getQuotations()])
      .then(([ev, inv, qt]) => { setEvents(ev); setInvoices(inv); setQuotations(qt) })
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  const now = useMemo(() => new Date(), [])
  const weekLater = useMemo(() => new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), [now])
  const thirtyDaysLater = useMemo(() => new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), [now])

  const thisWeekEvents = useMemo(() => events.filter(e => { const d = new Date(e.eventDateTime); return d >= now && d <= weekLater }), [events, now, weekLater])
  const confirmedNext30 = useMemo(() => events.filter(e => { const d = new Date(e.eventDateTime); return e.eventStatus === 'CONFIRMED' && d >= now && d <= thirtyDaysLater }), [events, now, thirtyDaysLater])
  const openLeads = useMemo(() => quotations.filter(q => q.quotationStatus === 'DRAFT' || q.quotationStatus === 'SENT'), [quotations])
  const overdueInvoices = useMemo(() => invoices.filter(i => i.invoiceStatus === 'OVERDUE'), [invoices])

  const thisWeekGuests = useMemo(() => thisWeekEvents.reduce((sum, e) => sum + e.guestCount, 0), [thisWeekEvents])
  const confirmedGuests = useMemo(() => confirmedNext30.reduce((sum, e) => sum + e.guestCount, 0), [confirmedNext30])
  const overdueAmount = useMemo(() => overdueInvoices.reduce((sum, i) => sum + Number(i.balance), 0), [overdueInvoices])

  const upcomingEvents = useMemo(() =>
    events.filter(e => new Date(e.eventDateTime) >= now).sort((a, b) => new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()).slice(0, 4),
    [events, now]
  )
  const recentPayments = useMemo(() =>
    invoices.filter(i => i.invoiceStatus === 'PAID' || i.invoiceStatus === 'PARTIALLY_PAID').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3),
    [invoices]
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6">
        <div className="mb-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-l-4 border-[#CC2622] px-6 py-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="max-w-2xl text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your catering business.</p>
            </div>
            <Link href="/events?new=1" className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-[#CC2622] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#A01F1A]">
              <Plus className="h-5 w-5" />
              New event
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading dashboard...</p>
        ) : error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Events this week</p>
                    <p className="text-3xl font-bold text-gray-900">{thisWeekEvents.length}</p>
                    <p className="text-xs text-gray-500 mt-2">{thisWeekGuests.toLocaleString()} guests scheduled</p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#CC2622]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Confirmed next 30d</p>
                    <p className="text-3xl font-bold text-gray-900">{confirmedNext30.length}</p>
                    <p className="text-xs text-gray-500 mt-2">{confirmedGuests.toLocaleString()} guests total</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Open leads</p>
                    <p className="text-3xl font-bold text-gray-900">{openLeads.length}</p>
                    <p className="text-xs text-gray-500 mt-2">Drafts and sent quotations</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Overdue invoices</p>
                    <p className="text-3xl font-bold text-[#CC2622]">{overdueInvoices.length}</p>
                    {overdueAmount > 0 && <p className="text-xs text-[#CC2622] font-semibold mt-2">KSh {overdueAmount.toLocaleString()} due</p>}
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#CC2622]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Events</h2>
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-gray-600">No upcoming events.</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event, index) => (
                      <div key={event.eventId} className={index !== upcomingEvents.length - 1 ? 'pb-4 border-b border-gray-200' : ''}>
                        <div className="flex justify-between items-start mb-1">
                          <Link href={`/events/${event.eventId}`} className="font-semibold text-gray-900 hover:text-[#CC2622] hover:underline">{event.eventName}</Link>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${eventStatusStyles[event.eventStatus]}`}>{eventStatusLabels[event.eventStatus]}</span>
                        </div>
                        <p className="text-sm text-gray-600">{event.clientName ?? 'Unassigned'} — {event.eventVenue} — {event.guestCount} guests</p>
                        <p className="text-sm font-semibold text-gray-900 mt-2">{new Date(event.eventDateTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/events" className="text-[#CC2622] font-medium text-sm mt-4 inline-block hover:underline">View all →</Link>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Payments</h2>
                {recentPayments.length === 0 ? (
                  <p className="text-sm text-gray-600">No payments recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {recentPayments.map((invoice, index) => (
                      <div key={invoice.invoiceId} className={`flex items-start gap-3 ${index !== recentPayments.length - 1 ? 'pb-4 border-b border-gray-200' : ''}`}>
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">📋</div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">KSh {Number(invoice.amountPaid).toLocaleString()} for {invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">{invoice.clientName ?? 'Unknown client'} — {invoice.invoiceStatus === 'PAID' ? 'Paid' : 'Partial'}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
