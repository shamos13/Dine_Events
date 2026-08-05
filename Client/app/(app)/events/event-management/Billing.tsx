'use client'

import { Banknote, Eye, FileText, Plus, ReceiptText, Smartphone, Wallet, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import QuotationTemplate from '@/components/QuotationTemplate'
import { PaymentAmountPresets } from '@/components/payments/PaymentAmountPresets'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api/client'
import { getInvoices, type InvoiceResponse } from '@/lib/api/invoices'
import { getQuotations, type QuotationResponse } from '@/lib/api/quotations'
import {
  recordManualPayment,
  requestInvoicePayment,
  waitForAdminPaymentResult,
} from '@/lib/api/admin-payments'
import { formatKsh } from '@/lib/api/menu'
import { formatPaymentWhen, suggestedDeposit } from '@/lib/payments/partial'
import { quotationToTemplateData } from '@/lib/quotations/template'
import type { EventRecord } from './event-data'
import { DataTable, OutlineButton, Panel, SectionHeading } from './components'
import EventSidebarActions from './EventSidebarActions'
import { currency, lineItemLabels } from './EventTotals'

const proposalStatusStyles: Record<QuotationResponse['quotationStatus'], string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
  SUPERSEDED: 'bg-slate-200 text-slate-700',
}

const invoiceStatusStyles: Record<InvoiceResponse['invoiceStatus'], string> = {
  PAID: 'bg-green-100 text-green-700',
  UNPAID: 'bg-gray-100 text-gray-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
}

const paymentStatusStyles: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-indigo-100 text-indigo-700',
}

type PayMode = 'mpesa' | 'manual'

export default function Billing({
  event,
  onGenerateInvoice,
  onGenerateProposal,
}: {
  event: EventRecord
  onGenerateInvoice?: () => void
  onGenerateProposal?: () => void
}) {
  const { toast } = useToast()
  const [quotations, setQuotations] = useState<QuotationResponse[]>([])
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null)
  const [previewQuotation, setPreviewQuotation] = useState<QuotationResponse | null>(null)

  const [payTarget, setPayTarget] = useState<InvoiceResponse | null>(null)
  const [payMode, setPayMode] = useState<PayMode>('mpesa')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [manualMethod, setManualMethod] = useState<'CASH' | 'BANK'>('CASH')
  const [requesting, setRequesting] = useState(false)
  const [pollOpen, setPollOpen] = useState(false)
  const [pollMessage, setPollMessage] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    return Promise.all([getQuotations(), getInvoices()])
      .then(([quotationData, invoiceData]) => {
        setQuotations(quotationData)
        setInvoices(invoiceData)
      })
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load billing details.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const eventQuotations = useMemo(
    () =>
      quotations
        .filter((quotation) => quotation.eventId === event.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [event.id, quotations]
  )

  useEffect(() => {
    if (eventQuotations.length === 0) {
      setSelectedQuotationId(null)
      return
    }
    const preferred =
      eventQuotations.find((quotation) => quotation.quotationStatus === 'SENT') ??
      eventQuotations.find((quotation) => quotation.quotationStatus === 'DRAFT') ??
      eventQuotations.find((quotation) => quotation.quotationStatus === 'ACCEPTED') ??
      eventQuotations[0]
    setSelectedQuotationId((current) =>
      current && eventQuotations.some((quotation) => quotation.quotationId === current)
        ? current
        : preferred.quotationId
    )
  }, [eventQuotations])

  const selectedQuotation = useMemo(
    () => eventQuotations.find((quotation) => quotation.quotationId === selectedQuotationId) ?? null,
    [eventQuotations, selectedQuotationId]
  )
  const eventInvoices = useMemo(() => invoices.filter((invoice) => invoice.eventId === event.id), [event.id, invoices])
  const activeInvoices = useMemo(
    () => eventInvoices.filter((invoice) => invoice.invoiceStatus !== 'CANCELLED'),
    [eventInvoices]
  )
  const totalBilled = useMemo(
    () => activeInvoices.reduce((sum, invoice) => sum + Number(invoice.amountDue ?? 0), 0),
    [activeInvoices]
  )
  const totalPaid = useMemo(
    () => activeInvoices.reduce((sum, invoice) => sum + Number(invoice.amountPaid ?? 0), 0),
    [activeInvoices]
  )
  const balanceDue = useMemo(
    () => activeInvoices.reduce((sum, invoice) => sum + Number(invoice.balance ?? 0), 0),
    [activeInvoices]
  )
  const allPayments = useMemo(
    () =>
      activeInvoices
        .flatMap((invoice) => (invoice.payments ?? []).map((payment) => ({ ...payment, invoiceNumber: invoice.invoiceNumber })))
        .sort(
          (a, b) =>
            new Date(b.completedAt ?? b.initiatedAt ?? 0).getTime() -
            new Date(a.completedAt ?? a.initiatedAt ?? 0).getTime()
        ),
    [activeInvoices]
  )
  const payableInvoices = useMemo(
    () =>
      activeInvoices.filter(
        (invoice) =>
          (invoice.invoiceStatus === 'UNPAID' ||
            invoice.invoiceStatus === 'PARTIALLY_PAID' ||
            invoice.invoiceStatus === 'OVERDUE') &&
          Number(invoice.balance ?? 0) > 0
      ),
    [activeInvoices]
  )

  const openPayModal = (invoice: InvoiceResponse, mode: PayMode = 'mpesa') => {
    setPayTarget(invoice)
    setPayMode(mode)
    setPhone(invoice.clientPhone ?? '')
    setManualMethod('CASH')
    const balance = Number(invoice.balance ?? 0)
    const paid = Number(invoice.amountPaid ?? 0)
    const deposit = suggestedDeposit(Number(invoice.amountDue ?? 0), balance)
    const defaultAmount = paid <= 0 && deposit > 0 && deposit < balance ? deposit : balance
    setAmount(String(defaultAmount || balance || invoice.amountDue || ''))
  }

  const onRequestPayment = async () => {
    if (!payTarget) return
    setRequesting(true)
    setPollMessage('Sending STK push to the client\u2019s phone\u2026')
    setPollOpen(true)
    try {
      const payment = await requestInvoicePayment(payTarget.invoiceId, {
        phoneNumber: phone || undefined,
        amount: amount ? Number(amount) : undefined,
      })
      const result = await waitForAdminPaymentResult(payment.paymentId)
      if (result.paymentStatus === 'COMPLETED') {
        setPollMessage(
          `Payment received${result.mpesaReceiptNumber ? ` \u00b7 Receipt ${result.mpesaReceiptNumber}` : ''}`
        )
        toast('Payment received from client.', 'success')
        setPayTarget(null)
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
    if (!payTarget) return
    setRequesting(true)
    try {
      await recordManualPayment({
        invoiceId: payTarget.invoiceId,
        amount: Number(amount),
        paymentMethod: manualMethod,
      })
      toast(
        `${manualMethod === 'CASH' ? 'Cash' : 'Bank'} payment of ${formatKsh(Number(amount))} recorded.`,
        'success'
      )
      setPayTarget(null)
      await load()
    } catch (reason: unknown) {
      toast(reason instanceof ApiError ? reason.message : 'Unable to record payment.', 'error')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) return <p className="text-slate-600">Loading billing details...</p>
  if (error) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.96fr)]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Total Billed" value={currency(totalBilled)} />
          <Metric label="Total Paid" value={currency(totalPaid)} emphasis />
          <Metric label="Balance Due" value={currency(balanceDue)} />
        </div>

        <Panel>
          <SectionHeading
            title="Proposals"
            subtitle="Select a quotation for billing details. Click the eye icon to preview the template."
            action={
              event.status !== 'CANCELLED' ? (
                <button
                  onClick={onGenerateProposal}
                  className="inline-flex items-center gap-2 rounded-md bg-[#cc2622] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a01f1a]"
                >
                  <Plus className="h-4 w-4" />
                  Generate Proposal
                </button>
              ) : undefined
            }
          />
          {eventQuotations.length ? (
            <>
              <label className="mb-4 block text-sm font-semibold text-slate-700">
                Selected quotation
                <select
                  value={selectedQuotationId ?? ''}
                  onChange={(e) => setSelectedQuotationId(Number(e.target.value))}
                  className="mt-2 h-11 w-full rounded-md border border-[#efb6b0] bg-white px-3 text-sm outline-none focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20"
                >
                  {eventQuotations.map((quotation) => (
                    <option key={quotation.quotationId} value={quotation.quotationId}>
                      {quotation.quotationNumber}
                      {quotation.quotationStatus === 'SUPERSEDED' ? ' (replaced)' : ''}
                      {quotation.quotationStatus === 'SENT' ? ' (current)' : ''}
                      {' · '}
                      {quotation.quotationStatus.replaceAll('_', ' ')} · {currency(quotation.total)}
                    </option>
                  ))}
                </select>
              </label>
              <DataTable
                headers={['Proposal #', 'Created', 'Status', 'Amount', 'Actions']}
                rows={eventQuotations.map((quotation) => [
                  <button
                    key={`${quotation.quotationId}-select`}
                    type="button"
                    onClick={() => setSelectedQuotationId(quotation.quotationId)}
                    className={`font-semibold ${selectedQuotationId === quotation.quotationId ? 'text-[#cc2622]' : 'text-slate-900 hover:text-[#cc2622]'}`}
                  >
                    {quotation.quotationNumber}
                    {quotation.quotationStatus === 'SENT' ? ' · Current' : ''}
                    {quotation.quotationStatus === 'SUPERSEDED' ? ' · Replaced' : ''}
                  </button>,
                  formatDate(quotation.createdAt),
                  <StatusBadge
                    key={`${quotation.quotationId}-status`}
                    className={proposalStatusStyles[quotation.quotationStatus]}
                    label={quotation.quotationStatus}
                  />,
                  currency(quotation.total),
                  <button
                    key={`${quotation.quotationId}-view`}
                    type="button"
                    aria-label={`Preview proposal ${quotation.quotationNumber}`}
                    title="Preview quotation"
                    onClick={() => setPreviewQuotation(quotation)}
                    className="rounded-md border border-[#efb6b0] p-1.5 text-slate-600 transition hover:border-[#cc2622] hover:text-[#cc2622]"
                  >
                    <Eye className="ml-auto h-4 w-4" />
                  </button>,
                ])}
              />
            </>
          ) : (
            <EmptyBox icon={<FileText className="h-9 w-9" />} message="No Proposals Created Yet" />
          )}
        </Panel>

        <Panel>
          <SectionHeading
            title="Billing Details"
            subtitle={
              selectedQuotation
                ? `Line items from ${selectedQuotation.quotationNumber}`
                : 'Items included in the selected quotation'
            }
          />
          {selectedQuotation?.lineItems.length ? (
            <DataTable
              headers={['Item', 'Type', 'Quantity', 'Unit Price', 'Total']}
              rows={selectedQuotation.lineItems.map((item) => [
                item.lineItemDescription,
                lineItemLabels[item.lineItemType] ?? item.lineItemType,
                Number(item.quantity ?? 0).toLocaleString(),
                currency(item.unitPriceAtQuotation),
                currency(item.totalPrice),
              ])}
            />
          ) : (
            <EmptyBox icon={<ReceiptText className="h-9 w-9" />} message="No Billed Items Yet" />
          )}
        </Panel>

        <Panel>
          <SectionHeading
            title="Invoices"
            subtitle="Collect deposits or installments — full payment is not required at once"
            action={
              <button
                onClick={onGenerateInvoice}
                className="inline-flex items-center gap-2 rounded-md bg-[#cc2622] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a01f1a]"
              >
                <Plus className="h-4 w-4" />
                Generate Invoice
              </button>
            }
          />
          {eventInvoices.length ? (
            <DataTable
              headers={['Invoice #', 'Created', 'Status', 'Amount Due', 'Paid', 'Balance', 'Actions']}
              rows={eventInvoices.map((invoice) => [
                invoice.invoiceNumber,
                formatDate(invoice.createdAt),
                <StatusBadge
                  key={`${invoice.invoiceId}-status`}
                  className={invoiceStatusStyles[invoice.invoiceStatus]}
                  label={invoice.invoiceStatus}
                />,
                currency(invoice.amountDue),
                currency(invoice.amountPaid),
                currency(invoice.balance),
                Number(invoice.balance ?? 0) > 0 && invoice.invoiceStatus !== 'CANCELLED' ? (
                  <div key={`${invoice.invoiceId}-pay`} className="flex flex-wrap justify-end gap-1">
                    <button
                      onClick={() => openPayModal(invoice, 'mpesa')}
                      className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      M-Pesa
                    </button>
                    <button
                      onClick={() => openPayModal(invoice, 'manual')}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Banknote className="h-3.5 w-3.5" />
                      Cash/Bank
                    </button>
                  </div>
                ) : (
                  <span key={`${invoice.invoiceId}-paid`} className="text-xs text-slate-500">
                    —
                  </span>
                ),
              ])}
            />
          ) : (
            <EmptyBox icon={<ReceiptText className="h-9 w-9" />} message="No Invoices Created Yet" />
          )}
        </Panel>

        <Panel>
          <SectionHeading
            title="Payment History"
            subtitle="Deposits, installments, and refunds for this event"
            action={
              <OutlineButton
                disabled={payableInvoices.length === 0}
                onClick={() => payableInvoices[0] && openPayModal(payableInvoices[0], 'mpesa')}
              >
                <Banknote className="h-4 w-4" />
                Request Payment
              </OutlineButton>
            }
          />
          {allPayments.length ? (
            <DataTable
              headers={['Date', 'Invoice #', 'Amount', 'Method', 'Reference', 'Status']}
              rows={allPayments.map((payment) => [
                formatPaymentWhen(payment.completedAt ?? payment.initiatedAt),
                payment.invoiceNumber,
                currency(payment.amount),
                payment.paymentMethod,
                payment.mpesaReceiptNumber ?? '—',
                <StatusBadge
                  key={`${payment.paymentId}-status`}
                  className={paymentStatusStyles[payment.paymentStatus] ?? 'bg-gray-100 text-gray-700'}
                  label={payment.paymentStatus}
                />,
              ])}
            />
          ) : (
            <EmptyBox icon={<Banknote className="h-9 w-9" />} message="No Payments Recorded Yet" />
          )}
        </Panel>
      </div>

      <EventSidebarActions
        eventId={event.id}
        eventStatus={event.status}
        discountPercent={event.discountPercent}
        onGenerateInvoice={onGenerateInvoice}
        onGenerateProposal={onGenerateProposal}
      />

      <Modal
        isOpen={!!payTarget}
        onClose={() => !requesting && setPayTarget(null)}
        title={payMode === 'mpesa' ? 'Request M-Pesa Payment' : 'Record Cash / Bank Payment'}
      >
        {payTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {payMode === 'mpesa' ? 'Sending a payment request for' : 'Recording a payment against'}{' '}
              <span className="font-semibold">{payTarget.invoiceNumber}</span>. Outstanding balance{' '}
              <span className="font-semibold">{currency(payTarget.balance)}</span>. Clients may pay a deposit or any
              smaller installment.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPayMode('mpesa')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  payMode === 'mpesa' ? 'bg-emerald-600 text-white' : 'border border-slate-300 text-slate-700'
                }`}
              >
                M-Pesa STK
              </button>
              <button
                type="button"
                onClick={() => setPayMode('manual')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  payMode === 'manual' ? 'bg-slate-800 text-white' : 'border border-slate-300 text-slate-700'
                }`}
              >
                Cash / Bank
              </button>
            </div>

            <PaymentAmountPresets
              className="text-slate-700"
              amountDue={Number(payTarget.amountDue)}
              balance={Number(payTarget.balance)}
              amountPaid={Number(payTarget.amountPaid)}
              selectedAmount={Number(amount) || 0}
              onSelect={(value) => setAmount(String(value))}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {payMode === 'mpesa' ? (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Client Phone
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#cc2622]"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Method
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#cc2622]"
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value as 'CASH' | 'BANK')}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank transfer</option>
                  </select>
                </div>
              )}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Amount (KSh)
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#cc2622]"
                  type="number"
                  min={1}
                  max={Number(payTarget.balance)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={requesting || !amount || Number(amount) <= 0 || (payMode === 'mpesa' && !phone)}
              onClick={payMode === 'mpesa' ? onRequestPayment : onRecordManual}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
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
          </div>
        )}
      </Modal>

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

      {previewQuotation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 sm:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewQuotation(null)}
                className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow"
              >
                <X className="h-4 w-4" />
                Close preview
              </button>
            </div>
            <QuotationTemplate data={quotationToTemplateData(previewQuotation)} showActions={false} />
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <Panel className="p-5">
      <p className="text-xs font-semibold uppercase text-slate-600">{label}</p>
      <p className={`mt-3 text-xl font-bold ${emphasis ? 'text-[#cc2622]' : ''}`}>{value}</p>
    </Panel>
  )
}

function EmptyBox({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#efb6b0] text-slate-600">
      {icon}
      <p className="mt-4 text-sm font-medium">{message}</p>
    </div>
  )
}

function StatusBadge({ className, label }: { className: string; label: string }) {
  return (
    <span className={`rounded-full border border-[#eeb7b2] px-3 py-1 text-xs font-medium ${className}`}>
      {label.replaceAll('_', ' ')}
    </span>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
