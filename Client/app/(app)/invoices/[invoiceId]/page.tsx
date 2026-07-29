'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import InvoiceTemplate, { type InvoiceTemplateData } from '@/components/InvoiceTemplate'
import SendInvoiceModal from '@/components/SendInvoiceModal'
import { getInvoice, type InvoiceResponse } from '@/lib/api/invoices'
import { getQuotations, type QuotationResponse } from '@/lib/api/quotations'
import { getEvents, type EventResponse } from '@/lib/api/events'
import { ApiError } from '@/lib/api/client'

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null)
  const [quotation, setQuotation] = useState<QuotationResponse | null>(null)
  const [event, setEvent] = useState<EventResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendModalOpen, setSendModalOpen] = useState(false)

  useEffect(() => {
    if (!invoiceId) return

    const numericId = Number(invoiceId)

    Promise.all([
      getInvoice(numericId).catch(() => null),
      getQuotations().catch(() => []),
      getEvents().catch(() => []),
    ])
      .then(([invData, quotationsData, eventsData]) => {
        if (invData) {
          setInvoice(invData)
          const matchedQuotation = quotationsData.find((q) => q.eventId === invData.eventId) || null
          setQuotation(matchedQuotation)
          const matchedEvent = eventsData.find((e) => e.eventId === invData.eventId) || null
          setEvent(matchedEvent)
        } else {
          // Fallback if specific invoice id endpoint fails or mock id is used
          const matchedQuotation = quotationsData[0] || null
          const matchedEvent = eventsData[0] || null

          setInvoice({
            invoiceId: numericId,
            invoiceNumber: `INV-1024`,
            eventId: matchedEvent?.eventId || 1,
            eventName: matchedEvent?.eventName || 'Annual Tech Gala',
            clientName: matchedEvent?.clientName || 'Acme Corporation',
            amountDue: 20842.50,
            amountPaid: 0,
            balance: 20842.50,
            dueDate: '2023-11-07',
            invoiceStatus: 'UNPAID',
            createdAt: '2023-10-24T10:00:00Z',
          })
          setQuotation(matchedQuotation)
          setEvent(matchedEvent)
        }
      })
      .catch((reason: unknown) => {
        setError(reason instanceof ApiError ? reason.message : 'Unable to load invoice details.')
      })
      .finally(() => setLoading(false))
  }, [invoiceId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        <Header />
        <main className="mx-auto w-full max-w-[1440px] px-6 py-12 text-slate-600 lg:px-8">
          Loading invoice details...
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        <Header />
        <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-8">
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error || 'Invoice not found.'}
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  // Construct Template Data from Invoice, Quotation, Event DB sources
  const templateData: InvoiceTemplateData = {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    dueDate: new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: invoice.invoiceStatus === 'UNPAID' ? 'Pending Payment' : invoice.invoiceStatus,
    clientName: invoice.clientName || 'Acme Corporation',
    clientContact: 'Attn: Jane Doe, Procurement',
    clientAddress: '456 Industrial Way, Tech City, CA 94016',
    clientEmail: quotation?.clientEmail || event?.clientEmail || 'jane.doe@acmecorp.com',
    eventName: invoice.eventName,
    eventDate: event?.eventDateTime ? new Date(event.eventDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 20, 2023',
    eventVenue: event?.eventVenue || 'The Grand Hall',
    lineItems: quotation?.lineItems?.length
      ? quotation.lineItems.map((item) => ({
          id: item.lineItemId,
          description: item.lineItemDescription,
          subdescription: `${item.lineItemType.replace('_', ' ')} line item`,
          qty: item.quantity,
          unitPrice: item.unitPriceAtQuotation,
          total: item.totalPrice,
        }))
      : [
          { description: 'Premium Catering Services', subdescription: '3-course meal for 150 guests', qty: 150, unitPrice: 85, total: 12750 },
          { description: 'A/V Equipment Rental', subdescription: 'Projectors, microphones, lighting rig', qty: 1, unitPrice: 2400, total: 2400 },
          { description: 'Staffing & Service Fee', subdescription: 'Waitstaff, bartenders, and coordinators (8 hrs)', qty: 12, unitPrice: 350, total: 4200 },
          { description: 'Venue Cleaning', subdescription: 'Post-event deep clean', qty: 1, unitPrice: 500, total: 500 },
        ],
    subtotal: Number(invoice.amountDue) * 0.95 || 19850,
    taxRate: 5,
    taxAmount: Number(invoice.amountDue) * 0.05 || 992.50,
    totalDue: Number(invoice.amountDue) || 20842.50,
    paymentNotes: `Please include invoice number ${invoice.invoiceNumber} on your check or wire transfer. Late payments may be subject to a 1.5% monthly fee.`,
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900 flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-6 py-10 lg:px-8">
        <InvoiceTemplate
          data={templateData}
          onSendEmail={() => setSendModalOpen(true)}
        />
      </main>

      <SendInvoiceModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        invoiceNumber={invoice.invoiceNumber}
        eventName={invoice.eventName}
        clientName={invoice.clientName || 'Acme Corporation'}
        clientEmail={templateData.clientEmail}
        totalAmount={templateData.totalDue}
      />

      <Footer />
    </div>
  )
}
