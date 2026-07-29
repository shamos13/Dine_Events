'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Archive, ArrowLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import InvoiceTemplate, { type InvoiceTemplateData } from '@/components/InvoiceTemplate'
import DraftInvoiceModal from '@/components/DraftInvoiceModal'
import SendInvoiceModal from '@/components/SendInvoiceModal'

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

export default function EventDetails() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('Details')
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Invoice Workflow Modals & Preview state
  const [draftModalOpen, setDraftModalOpen] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [previewInvoiceData, setPreviewInvoiceData] = useState<InvoiceTemplateData | null>(null)
  const [currentInvoiceData, setCurrentInvoiceData] = useState<InvoiceTemplateData | null>(null)

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

  const handleGenerateInvoice = () => {
    setDraftModalOpen(true)
  }

  const handleGenerateProposal = () => {
    // Generate proposal action trigger
    alert('Proposal generation workflow started.')
  }

  const handleDraftPreview = (data: InvoiceTemplateData) => {
    setPreviewInvoiceData(data)
    setDraftModalOpen(false)
  }

  const handleDraftSendInvoice = (data: InvoiceTemplateData) => {
    setCurrentInvoiceData(data)
    setDraftModalOpen(false)
    setSendModalOpen(true)
  }

  if (loading) return <div className="min-h-screen bg-[#f7f8fc]"><Header /><main className="mx-auto w-full max-w-[1440px] px-6 py-12 text-slate-600 lg:px-8">Loading event...</main><Footer /></div>
  if (error || !event) return <div className="min-h-screen bg-[#f7f8fc]"><Header /><main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-8"><p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error ?? 'Event not found.'}</p></main><Footer /></div>

  // If in Preview Mode, render full Invoice Document view with exit button
  if (previewInvoiceData) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] text-slate-900 flex flex-col">
        <Header />
        <main className="flex-1 mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-8">
          <button
            onClick={() => {
              setPreviewInvoiceData(null)
              setDraftModalOpen(true)
            }}
            className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Draft Invoice Options
          </button>
          <InvoiceTemplate
            data={previewInvoiceData}
            previewMode={true}
            onSendEmail={() => {
              setCurrentInvoiceData(previewInvoiceData)
              setPreviewInvoiceData(null)
              setSendModalOpen(true)
            }}
          />
        </main>
        <Footer />
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Details':
        return <Details event={event} onGenerateInvoice={handleGenerateInvoice} onGenerateProposal={handleGenerateProposal} />
      case 'Billing':
        return <Billing event={event} onGenerateInvoice={handleGenerateInvoice} onGenerateProposal={handleGenerateProposal} />
      case 'Menu':
        return <Menu event={event} onGenerateInvoice={handleGenerateInvoice} onGenerateProposal={handleGenerateProposal} />
      case 'Staff':
        return <Staff event={event} onGenerateInvoice={handleGenerateInvoice} onGenerateProposal={handleGenerateProposal} />
      case 'Rentals':
        return <Rentals event={event} onGenerateInvoice={handleGenerateInvoice} onGenerateProposal={handleGenerateProposal} />
      case 'Notes':
        return <Notes event={event} />
      case 'Files':
        return <Files event={event} />
      case 'Communication':
        return <Communication event={event} />
      default:
        return <Details event={event} onGenerateInvoice={handleGenerateInvoice} onGenerateProposal={handleGenerateProposal} />
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-8">
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <Link href="/events" className="hover:text-[#cc2622]">Events</Link>
          <ChevronRight className="h-4 w-4" />
          <span>{event.name}</span>
        </div>

        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">{event.name}</h1>
            <p className="mt-2 text-base text-slate-600">
              {event.client} <span aria-hidden="true">•</span> {event.guests} guests <span aria-hidden="true">•</span> {event.date} <span aria-hidden="true">•</span> {event.dateTime.split(', ')[1]}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full border border-[#eeb7b2] px-3 py-1.5 text-sm font-semibold ${event.statusStyle}`}>
              {event.status}
            </span>
            <button className="inline-flex items-center gap-2 rounded-md border border-[#eeb7b2] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-red-50">
              <Archive className="h-4 w-4" />
              Archive
            </button>
          </div>
        </div>

        <div className="mt-8 flex overflow-x-auto border-b border-[#efb6b0]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium ${
                activeTab === tab
                  ? 'border-[#cc2622] text-[#cc2622]'
                  : 'border-transparent text-slate-600 hover:text-[#cc2622]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-8">{renderTabContent()}</div>
      </main>

      {/* Modals */}
      <DraftInvoiceModal
        isOpen={draftModalOpen}
        onClose={() => setDraftModalOpen(false)}
        onPreview={handleDraftPreview}
        onSendInvoice={handleDraftSendInvoice}
        invoiceNumber="#INV-2026-005"
        totalEventAmount={1250000}
        eventData={{
          eventName: event.name,
          clientName: event.client,
          clientEmail: event.email,
          eventDate: event.date,
          eventVenue: event.venue,
        }}
      />

      <SendInvoiceModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        invoiceNumber={currentInvoiceData?.invoiceNumber ? `INV-${currentInvoiceData.invoiceNumber}` : 'INV-2026-005'}
        eventName={event.name}
        clientName={event.client}
        clientEmail={event.email}
        totalAmount={currentInvoiceData?.totalDue || 1250000}
      />

      <Footer />
    </div>
  )
}
