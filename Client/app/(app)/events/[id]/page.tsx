'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Archive, ArrowLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import InvoiceTemplate, { type InvoiceTemplateData } from '@/components/InvoiceTemplate'
import QuotationTemplate, { type QuotationTemplateData } from '@/components/QuotationTemplate'
import DraftInvoiceModal from '@/components/DraftInvoiceModal'
import DraftQuotationModal from '@/components/DraftQuotationModal'
import SendInvoiceModal from '@/components/SendInvoiceModal'
import SendQuotationModal from '@/components/SendQuotationModal'

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
import { createQuotation, getQuotations, sendQuotation, type QuotationResponse } from '@/lib/api/quotations'

const tabs = ['Details', 'Billing', 'Menu', 'Staff', 'Rentals', 'Notes', 'Files', 'Communication'] as const
type Tab = (typeof tabs)[number]

export default function EventDetails() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('Details')
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [currentQuotation, setCurrentQuotation] = useState<QuotationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [billingActionError, setBillingActionError] = useState<string | null>(null)
  const [billingActionMessage, setBillingActionMessage] = useState<string | null>(null)
  const [billingRefreshKey, setBillingRefreshKey] = useState(0)

  // Invoice Workflow Modals & Preview state
  const [draftModalOpen, setDraftModalOpen] = useState(false)
  const [draftQuotationModalOpen, setDraftQuotationModalOpen] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendQuotationModalOpen, setSendQuotationModalOpen] = useState(false)
  const [previewInvoiceData, setPreviewInvoiceData] = useState<InvoiceTemplateData | null>(null)
  const [previewQuotationData, setPreviewQuotationData] = useState<QuotationTemplateData | null>(null)
  const [currentInvoiceData, setCurrentInvoiceData] = useState<InvoiceTemplateData | null>(null)
  const [currentQuotationData, setCurrentQuotationData] = useState<QuotationTemplateData | null>(null)

  useEffect(() => {
    Promise.all([getEvents(), getQuotations().catch(() => [])])
      .then(([events, quotations]) => {
        const found = events.find((item) => item.eventId === Number(id))
        if (!found) throw new ApiError({ status: 404, error: 'Not Found', message: 'Event not found.' })
        setEvent(toEventRecord(found))
        const latestQuotation = quotations
          .filter((quotation) => quotation.eventId === found.eventId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null
        setCurrentQuotation(latestQuotation)
      })
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load event.'))
      .finally(() => setLoading(false))
  }, [id])

  const createFreshQuotation = async (overrides?: { quotationName?: string; validUntil?: string }) => {
    if (!event) return null
    if (event.status === 'CANCELLED') {
      setBillingActionError('Cannot create proposals for a cancelled event.')
      return null
    }
    setBillingActionError(null)
    setBillingActionMessage(null)
    try {
      const quotation = await createQuotation({
        eventId: event.id,
        quotationName: overrides?.quotationName || `${event.name} Quotation`,
        validUntil: overrides?.validUntil,
      })
      setCurrentQuotation(quotation)
      setBillingRefreshKey((key) => key + 1)
      setBillingActionMessage(
        `Proposal ${quotation.quotationNumber} saved as a draft. Send it to the client when ready.`
      )
      return quotation
    } catch (reason) {
      setBillingActionError(reason instanceof ApiError ? reason.message : 'Unable to refresh event billing totals.')
      return null
    }
  }

  const handleGenerateInvoice = async () => {
    setBillingActionError(
      'Invoices are created when the client accepts a sent proposal. Generate and send a proposal first.'
    )
  }

  const handleGenerateProposal = async () => {
    if (event?.status === 'CANCELLED') {
      setBillingActionError('Cannot create proposals for a cancelled event.')
      return
    }
    setBillingActionError(null)
    setBillingActionMessage(null)
    setDraftQuotationModalOpen(true)
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

  const handleQuotationPreview = async (data: QuotationTemplateData) => {
    const quotation = await ensureQuotationCreated(data)
    if (!quotation) return
    setPreviewQuotationData({
      ...data,
      quotationNumber: quotation.quotationNumber,
      status: quotation.quotationStatus.replaceAll('_', ' '),
      lineItems: quotation.lineItems.map((item) => ({
        id: item.lineItemId,
        description: item.lineItemDescription,
        subdescription: item.lineItemType.replaceAll('_', ' '),
        qty: item.quantity,
        unitPrice: item.unitPriceAtQuotation,
        total: item.totalPrice,
      })),
      subtotal: Number(quotation.subTotal ?? data.subtotal),
      total: Number(quotation.total ?? data.total),
    })
    setDraftQuotationModalOpen(false)
  }

  const handleQuotationSend = async (data: QuotationTemplateData) => {
    const quotation = await ensureQuotationCreated(data)
    if (!quotation) return
    setCurrentQuotationData({
      ...data,
      quotationNumber: quotation.quotationNumber,
      total: Number(quotation.total ?? data.total),
    })
    setDraftQuotationModalOpen(false)
    setSendQuotationModalOpen(true)
  }

  const handleQuotationSaveDraft = async (data: QuotationTemplateData) => {
    const quotation = await ensureQuotationCreated(data)
    if (!quotation) return
    setCurrentQuotationData({
      ...data,
      quotationNumber: quotation.quotationNumber,
      total: Number(quotation.total ?? data.total),
    })
    setDraftQuotationModalOpen(false)
    setActiveTab('Billing')
    setBillingActionMessage(`Proposal ${quotation.quotationNumber} created and saved as a draft.`)
  }

  const ensureQuotationCreated = async (data: QuotationTemplateData) => {
    const validUntil = data.validUntil ? new Date(data.validUntil).toISOString().split('T')[0] : undefined
    return createFreshQuotation({
      quotationName: data.quotationName || `${event?.name ?? 'Event'} Quotation`,
      validUntil,
    })
  }

  if (loading) return <div className="min-h-screen bg-[#f7f8fc]"><Header /><main className="mx-auto w-full max-w-[1440px] px-6 py-12 text-slate-600 lg:px-8">Loading event...</main><Footer /></div>
  if (error || !event) return <div className="min-h-screen bg-[#f7f8fc]"><Header /><main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-8"><p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error ?? 'Event not found.'}</p></main><Footer /></div>

  // If in Preview Mode, render full Invoice Document view with exit button
  if (previewInvoiceData) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] text-slate-900 flex flex-col">
        <div className="print:hidden"><Header /></div>
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
        <div className="print:hidden"><Footer /></div>
      </div>
    )
  }

  if (previewQuotationData) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] text-slate-900 flex flex-col">
        <div className="print:hidden"><Header /></div>
        <main className="flex-1 mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-8">
          <button
            onClick={() => {
              setPreviewQuotationData(null)
              setDraftQuotationModalOpen(true)
            }}
            className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Draft Quotation Options
          </button>
          <QuotationTemplate
            data={previewQuotationData}
            previewMode={true}
            onSendEmail={() => {
              setCurrentQuotationData(previewQuotationData)
              setPreviewQuotationData(null)
              setSendQuotationModalOpen(true)
            }}
          />
        </main>
        <div className="print:hidden"><Footer /></div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Details':
        return <Details event={event} onGenerateInvoice={handleGenerateInvoice} onGenerateProposal={handleGenerateProposal} />
      case 'Billing':
        return <Billing key={`${event.id}-${billingRefreshKey}`} event={event} onGenerateInvoice={handleGenerateInvoice} onGenerateProposal={handleGenerateProposal} />
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

        {billingActionError && (
          <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {billingActionError}
          </p>
        )}

        {billingActionMessage && (
          <p role="status" className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {billingActionMessage}
          </p>
        )}

        <div className="mt-8">{renderTabContent()}</div>
      </main>

      {/* Modals */}
      <DraftInvoiceModal
        isOpen={draftModalOpen}
        onClose={() => setDraftModalOpen(false)}
        onPreview={handleDraftPreview}
        onSendInvoice={handleDraftSendInvoice}
        invoiceNumber={currentQuotation?.quotationNumber ?? 'Draft'}
        totalEventAmount={Number(currentQuotation?.total ?? 0)}
        eventData={{
          eventName: event.name,
          clientName: currentQuotation?.clientName ?? event.client,
          clientEmail: currentQuotation?.clientEmail ?? event.email,
          eventDate: event.date,
          eventVenue: event.venue,
          lineItems: currentQuotation?.lineItems.map((item) => ({
            description: item.lineItemDescription,
            subdescription: item.lineItemType.replaceAll('_', ' '),
            qty: item.quantity,
            unitPrice: item.unitPriceAtQuotation,
            total: item.totalPrice,
          })),
        }}
      />

      <DraftQuotationModal
        isOpen={draftQuotationModalOpen}
        onClose={() => setDraftQuotationModalOpen(false)}
        onPreview={handleQuotationPreview}
        onSendQuotation={handleQuotationSend}
        onSaveDraft={handleQuotationSaveDraft}
        quotationNumber={currentQuotation?.quotationNumber ?? 'Draft'}
        quotationName={currentQuotation?.quotationName ?? `${event.name} Quotation`}
        validUntil={currentQuotation?.validUntil}
        totalEventAmount={Number(currentQuotation?.total ?? 0)}
        eventData={{
          eventName: event.name,
          clientName: currentQuotation?.clientName ?? event.client,
          clientEmail: currentQuotation?.clientEmail ?? event.email,
          eventDate: event.date,
          eventVenue: event.venue,
          lineItems: currentQuotation?.lineItems.map((item) => ({
            id: item.lineItemId,
            description: item.lineItemDescription,
            subdescription: item.lineItemType.replaceAll('_', ' '),
            qty: item.quantity,
            unitPrice: item.unitPriceAtQuotation,
            total: item.totalPrice,
          })),
        }}
      />

      <SendInvoiceModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        invoiceNumber={currentInvoiceData?.invoiceNumber ?? 'Draft'}
        eventName={event.name}
        clientName={event.client}
        clientEmail={event.email}
        totalAmount={currentInvoiceData?.totalDue ?? Number(currentQuotation?.total ?? 0)}
      />

      <SendQuotationModal
        isOpen={sendQuotationModalOpen}
        onClose={() => setSendQuotationModalOpen(false)}
        onSend={async () => {
          const quotationId = currentQuotation?.quotationId
          if (!quotationId) throw new Error('No quotation to send. Save a draft first.')
          const sent = await sendQuotation(quotationId)
          setCurrentQuotation(sent)
          setBillingRefreshKey((key) => key + 1)
          setBillingActionMessage(
            `Proposal ${sent.quotationNumber} sent — the client can now accept it in their portal.`
          )
        }}
        quotationNumber={currentQuotationData?.quotationNumber ?? currentQuotation?.quotationNumber ?? 'Draft'}
        eventName={event.name}
        clientName={currentQuotationData?.clientName ?? currentQuotation?.clientName ?? event.client}
        clientEmail={currentQuotationData?.clientEmail ?? currentQuotation?.clientEmail ?? event.email}
        totalAmount={currentQuotationData?.total ?? Number(currentQuotation?.total ?? 0)}
      />

      <Footer />
    </div>
  )
}
