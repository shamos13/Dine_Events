'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Banknote, Smartphone, Wallet } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import InvoiceTemplate, { type InvoiceTemplateData } from '@/components/InvoiceTemplate'
import { InvoicePaymentHistory } from '@/components/payments/InvoicePaymentHistory'
import { InvoicePaymentPlan } from '@/components/payments/InvoicePaymentPlan'
import { PaymentAmountPresets } from '@/components/payments/PaymentAmountPresets'
import SendInvoiceModal from '@/components/SendInvoiceModal'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { getInvoice, type InvoiceResponse } from '@/lib/api/invoices'
import { getQuotations, type QuotationResponse } from '@/lib/api/quotations'
import { getEvents, type EventResponse } from '@/lib/api/events'
import { ApiError } from '@/lib/api/client'
import { formatKsh } from '@/lib/api/menu'
import {
  recordManualPayment,
  requestInvoicePayment,
  waitForAdminPaymentResult,
} from '@/lib/api/admin-payments'
import { suggestedDeposit } from '@/lib/payments/partial'

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null)
  const [quotation, setQuotation] = useState<QuotationResponse | null>(null)
  const [event, setEvent] = useState<EventResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [payMode, setPayMode] = useState<'mpesa' | 'manual'>('mpesa')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [manualMethod, setManualMethod] = useState<'CASH' | 'BANK'>('CASH')
  const [requesting, setRequesting] = useState(false)
  const [pollOpen, setPollOpen] = useState(false)
  const [pollMessage, setPollMessage] = useState('')

  const load = useCallback(async () => {
    if (!invoiceId) return
    const numericId = Number(invoiceId)
    setLoading(true)
    try {
      const [invData, quotationsData, eventsData] = await Promise.all([
        getInvoice(numericId),
        getQuotations().catch(() => []),
        getEvents().catch(() => []),
      ])
      setInvoice(invData)
      const balance = Number(invData.balance ?? 0)
      const paid = Number(invData.amountPaid ?? 0)
      const deposit = suggestedDeposit(Number(invData.amountDue ?? 0), balance)
      const defaultAmount = paid <= 0 && deposit > 0 && deposit < balance ? deposit : balance
      setAmount(String(defaultAmount || balance || invData.amountDue || ''))
      setPhone(invData.clientPhone ?? '')
      const matchedQuotation = quotationsData
        .filter((q) => q.eventId === invData.eventId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
      setQuotation(matchedQuotation)
      const matchedEvent = eventsData.find((e) => e.eventId === invData.eventId) || null
      setEvent(matchedEvent)
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load invoice details.')
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    load()
  }, [load])

  const canRequestPayment =
    invoice &&
    (invoice.invoiceStatus === 'UNPAID' ||
      invoice.invoiceStatus === 'PARTIALLY_PAID' ||
      invoice.invoiceStatus === 'OVERDUE') &&
    Number(invoice.balance) > 0

  const onRequestPayment = async () => {
    if (!invoice) return
    setRequesting(true)
    setPollMessage('Sending STK push to the client\u2019s phone\u2026')
    setPollOpen(true)
    try {
      const payment = await requestInvoicePayment(invoice.invoiceId, {
        phoneNumber: phone || undefined,
        amount: amount ? Number(amount) : undefined,
      })
      const result = await waitForAdminPaymentResult(payment.paymentId)
      if (result.paymentStatus === 'COMPLETED') {
        setPollMessage(`Payment received${result.mpesaReceiptNumber ? ` \u00b7 Receipt ${result.mpesaReceiptNumber}` : ''}`)
        toast('Payment received from client.', 'success')
        await load()
      } else if (result.paymentStatus === 'FAILED') {
        setPollMessage('Payment failed or was cancelled by the client.')
        toast('Payment failed.', 'error')
      } else {
        setPollMessage('Still pending. The client may still be entering their PIN — refresh shortly.')
        toast('Payment request sent. Awaiting client confirmation.', 'info')
      }
    } catch (reason: unknown) {
      const message = reason instanceof ApiError ? reason.message : 'Unable to send payment request.'
      setPollMessage(message)
      toast(message, 'error')
    } finally {
      setRequesting(false)
    }
  }

  const onRecordManual = async () => {
    if (!invoice) return
    setRequesting(true)
    try {
      await recordManualPayment({
        invoiceId: invoice.invoiceId,
        amount: Number(amount),
        paymentMethod: manualMethod,
      })
      toast(
        `${manualMethod === 'CASH' ? 'Cash' : 'Bank'} payment of ${formatKsh(Number(amount))} recorded.`,
        'success'
      )
      await load()
    } catch (reason: unknown) {
      toast(reason instanceof ApiError ? reason.message : 'Unable to record payment.', 'error')
    } finally {
      setRequesting(false)
    }
  }

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
    paymentNotes: `Paid ${formatKsh(invoice.amountPaid)} · Balance ${formatKsh(invoice.balance)}. Deposits and partial payments are accepted.`,
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900 flex flex-col">
      <div className="print:hidden"><Header /></div>
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-6 py-10 lg:px-8 space-y-6">
        <div className="print:hidden">
          <InvoicePaymentPlan
            amountDue={Number(invoice.amountDue)}
            amountPaid={Number(invoice.amountPaid)}
            balance={Number(invoice.balance)}
            dueDate={invoice.dueDate}
          />
        </div>

        {canRequestPayment && (
          <section className="print:hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-emerald-950">Collect payment</h2>
            </div>
            <p className="mt-1 text-sm text-emerald-800">
              Request M-Pesa or record cash/bank. Outstanding balance{' '}
              <span className="font-semibold">{formatKsh(invoice.balance)}</span>. Deposit and installment amounts are
              supported.
            </p>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPayMode('mpesa')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  payMode === 'mpesa' ? 'bg-emerald-600 text-white' : 'border border-emerald-300 bg-white text-emerald-900'
                }`}
              >
                M-Pesa STK
              </button>
              <button
                type="button"
                onClick={() => setPayMode('manual')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  payMode === 'manual' ? 'bg-slate-800 text-white' : 'border border-emerald-300 bg-white text-emerald-900'
                }`}
              >
                <Banknote className="h-3.5 w-3.5" />
                Cash / Bank
              </button>
            </div>

            <PaymentAmountPresets
              className="mt-4 text-emerald-900"
              amountDue={Number(invoice.amountDue)}
              balance={Number(invoice.balance)}
              amountPaid={Number(invoice.amountPaid)}
              selectedAmount={Number(amount) || 0}
              onSelect={(value) => setAmount(String(value))}
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {payMode === 'mpesa' ? (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Client Phone
                  </label>
                  <div className="relative">
                    <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
                    <input
                      className="w-full rounded-lg border border-emerald-200 bg-white py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07XXXXXXXX"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Method
                  </label>
                  <select
                    className="w-full rounded-lg border border-emerald-200 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value as 'CASH' | 'BANK')}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank transfer</option>
                  </select>
                </div>
              )}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Amount (KSh)
                </label>
                <input
                  className="w-full rounded-lg border border-emerald-200 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  type="number"
                  min={1}
                  max={Number(invoice.balance)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={
                requesting ||
                !amount ||
                Number(amount) <= 0 ||
                (payMode === 'mpesa' && !phone)
              }
              onClick={payMode === 'mpesa' ? onRequestPayment : onRecordManual}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Wallet className="h-4 w-4" />
              {requesting
                ? payMode === 'mpesa'
                  ? 'Sending request\u2026'
                  : 'Recording\u2026'
                : payMode === 'mpesa'
                  ? `Send request · ${formatKsh(Number(amount) || 0)}`
                  : `Record ${manualMethod === 'CASH' ? 'cash' : 'bank'} · ${formatKsh(Number(amount) || 0)}`}
            </button>
          </section>
        )}

        <InvoiceTemplate
          data={templateData}
          onSendEmail={() => setSendModalOpen(true)}
        />

        <div className="print:hidden">
          <InvoicePaymentHistory
            payments={invoice.payments}
            amountDue={Number(invoice.amountDue)}
          />
        </div>
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

      <Modal isOpen={pollOpen} onClose={() => !requesting && setPollOpen(false)} title="M-Pesa payment request">
        <p className="text-sm text-gray-700">{pollMessage}</p>
        {requesting && (
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
          </div>
        )}
        {!requesting && (
          <button
            type="button"
            onClick={() => setPollOpen(false)}
            className="mt-5 rounded-lg bg-[#CC2622] px-4 py-2 text-sm font-bold text-white"
          >
            Close
          </button>
        )}
      </Modal>

      <div className="print:hidden"><Footer /></div>
    </div>
  )
}
