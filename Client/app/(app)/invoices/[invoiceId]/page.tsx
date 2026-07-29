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
      getInvoice(numericId),
      getQuotations().catch(() => []),
      getEvents().catch(() => []),
    ])
      .then(([invData, quotationsData, eventsData]) => {
        setInvoice(invData)
        const matchedQuotation = quotationsData
          .filter((q) => q.eventId === invData.eventId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
        setQuotation(matchedQuotation)
        const matchedEvent = eventsData.find((e) => e.eventId === invData.eventId) || null
        setEvent(matchedEvent)
      })
      .catch((reason: unknown) => {
        setError(reason instanceof ApiError ? reason.message : 'Unable to load invoice details.')
      })
      .finally(() => setLoading(false))
  }, [invoiceId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        <div className="print:hidden"><Header /></div>
        <main className="mx-auto w-full max-w-[1440px] px-6 py-12 text-slate-600 lg:px-8">
          Loading invoice details...
        </main>
        <div className="print:hidden"><Footer /></div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        <div className="print:hidden"><Header /></div>
        <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-8">
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error || 'Invoice not found.'}
          </p>
        </main>
        <div className="print:hidden"><Footer /></div>
      </div>
    )
  }

  const invoiceTotal = Number(invoice.amountDue ?? 0)
  const subtotal = Number(quotation?.subTotal ?? invoice.amountDue ?? 0)
  const taxAmount = Math.max(invoiceTotal - subtotal, 0)

  const templateData: InvoiceTemplateData = {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    dueDate: new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: invoice.invoiceStatus.replaceAll('_', ' '),
    clientName: invoice.clientName || event?.clientName || quotation?.clientName || undefined,
    clientEmail: quotation?.clientEmail || event?.clientEmail || undefined,
    eventName: invoice.eventName,
    eventDate: event?.eventDateTime ? new Date(event.eventDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
    eventVenue: event?.eventVenue || undefined,
    lineItems: quotation?.lineItems?.length
      ? quotation.lineItems.map((item) => ({
          id: item.lineItemId,
          description: item.lineItemDescription,
          subdescription: item.lineItemType.replaceAll('_', ' '),
          qty: item.quantity,
          unitPrice: item.unitPriceAtQuotation,
          total: item.totalPrice,
        }))
      : [],
    subtotal,
    taxRate: subtotal > 0 && taxAmount > 0 ? Number(((taxAmount / subtotal) * 100).toFixed(2)) : 0,
    taxAmount,
    totalDue: invoiceTotal,
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900 flex flex-col">
      <div className="print:hidden"><Header /></div>
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
        clientName={templateData.clientName || ''}
        clientEmail={templateData.clientEmail}
        totalAmount={templateData.totalDue}
      />

      <div className="print:hidden"><Footer /></div>
    </div>
  )
}
