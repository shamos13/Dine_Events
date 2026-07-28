import { Banknote, ClipboardList, Eye, FileText, Plus, ReceiptText } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { getInvoices, type InvoiceResponse } from '@/lib/api/invoices'
import { getQuotations, type QuotationResponse } from '@/lib/api/quotations'
import type { EventRecord } from './event-data'
import { DataTable, OutlineButton, Panel, SectionHeading } from './components'
import { currency, EventTotals, lineItemLabels } from './EventTotals'

const proposalStatusStyles: Record<QuotationResponse['quotationStatus'], string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
}

const invoiceStatusStyles: Record<InvoiceResponse['invoiceStatus'], string> = {
  PAID: 'bg-green-100 text-green-700',
  UNPAID: 'bg-gray-100 text-gray-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
}

export default function Billing({ event }: { event: EventRecord }) {
  const [quotations, setQuotations] = useState<QuotationResponse[]>([])
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getQuotations(), getInvoices()])
      .then(([quotationData, invoiceData]) => {
        setQuotations(quotationData)
        setInvoices(invoiceData)
      })
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load billing details.'))
      .finally(() => setLoading(false))
  }, [])

  const eventQuotations = useMemo(() => quotations.filter((quotation) => quotation.eventId === event.id), [event.id, quotations])
  const eventInvoices = useMemo(() => invoices.filter((invoice) => invoice.eventId === event.id), [event.id, invoices])
  const currentQuotation = useMemo(() => [...eventQuotations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null, [eventQuotations])
  const totalBilled = useMemo(() => eventInvoices.reduce((sum, invoice) => sum + Number(invoice.amountDue ?? 0), 0), [eventInvoices])
  const totalPaid = useMemo(() => eventInvoices.reduce((sum, invoice) => sum + Number(invoice.amountPaid ?? 0), 0), [eventInvoices])
  const balanceDue = useMemo(() => eventInvoices.reduce((sum, invoice) => sum + Number(invoice.balance ?? 0), 0), [eventInvoices])
  const paidInvoices = eventInvoices.filter((invoice) => Number(invoice.amountPaid ?? 0) > 0)

  if (loading) return <p className="text-slate-600">Loading billing details...</p>
  if (error) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.96fr)]"><div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Total Billed" value={currency(totalBilled)} /><Metric label="Total Paid" value={currency(totalPaid)} emphasis /><Metric label="Balance Due" value={currency(balanceDue)} /></div><Panel><SectionHeading title="Proposals" subtitle="Event proposals and quotes" action={<button className="inline-flex items-center gap-2 rounded-md bg-[#cc2622] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a01f1a]"><Plus className="h-4 w-4" />Create Proposal</button>} />{eventQuotations.length ? <DataTable headers={['Proposal #', 'Created', 'Status', 'Amount', 'Actions']} rows={eventQuotations.map((quotation) => [quotation.quotationNumber, formatDate(quotation.createdAt), <StatusBadge key={`${quotation.quotationId}-status`} className={proposalStatusStyles[quotation.quotationStatus]} label={quotation.quotationStatus} />, currency(quotation.total), <button key={`${quotation.quotationId}-view`} aria-label={`View proposal ${quotation.quotationNumber}`} className="text-slate-600 hover:text-[#cc2622]"><Eye className="ml-auto h-4 w-4" /></button>])} /> : <EmptyBox icon={<FileText className="h-9 w-9" />} message="No Proposals Created Yet" />}</Panel><Panel><SectionHeading title="Billing Details" subtitle="Items included in the current event total" />{currentQuotation?.lineItems.length ? <DataTable headers={['Item', 'Type', 'Quantity', 'Unit Price', 'Total']} rows={currentQuotation.lineItems.map((item) => [item.lineItemDescription, lineItemLabels[item.lineItemType], Number(item.quantity ?? 0).toLocaleString(), currency(item.unitPriceAtQuotation), currency(item.totalPrice)])} /> : <EmptyBox icon={<ReceiptText className="h-9 w-9" />} message="No Billed Items Yet" />}</Panel><Panel><SectionHeading title="Invoices" subtitle="Invoice history for this event" action={<button className="inline-flex items-center gap-2 rounded-md bg-[#cc2622] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a01f1a]"><Plus className="h-4 w-4" />Create Invoice</button>} />{eventInvoices.length ? <DataTable headers={['Invoice #', 'Created', 'Status', 'Amount Due', 'Paid', 'Balance']} rows={eventInvoices.map((invoice) => [invoice.invoiceNumber, formatDate(invoice.createdAt), <StatusBadge key={`${invoice.invoiceId}-status`} className={invoiceStatusStyles[invoice.invoiceStatus]} label={invoice.invoiceStatus} />, currency(invoice.amountDue), currency(invoice.amountPaid), currency(invoice.balance)])} /> : <EmptyBox icon={<ReceiptText className="h-9 w-9" />} message="No Invoices Created Yet" />}</Panel><Panel><SectionHeading title="Payment History" subtitle="Payments received for this event" action={<OutlineButton><Banknote className="h-4 w-4" />Record Payment</OutlineButton>} />{paidInvoices.length ? <DataTable headers={['Invoice #', 'Paid', 'Balance', 'Status']} rows={paidInvoices.map((invoice) => [invoice.invoiceNumber, currency(invoice.amountPaid), currency(invoice.balance), <StatusBadge key={`${invoice.invoiceId}-payment-status`} className={invoiceStatusStyles[invoice.invoiceStatus]} label={invoice.invoiceStatus} />])} /> : <EmptyBox icon={<Banknote className="h-9 w-9" />} message="No Payments Recorded Yet" />}</Panel></div><aside className="space-y-6"><EventTotals eventId={event.id} /><div className="space-y-3"><OutlineButton className="w-full"><FileText className="h-4 w-4" />Create Report</OutlineButton><OutlineButton className="w-full"><ClipboardList className="h-4 w-4" />Create Proposal</OutlineButton><button className="flex w-full items-center justify-center gap-2 rounded-md bg-[#cc2622] px-4 py-3 text-sm font-semibold text-white hover:bg-[#a01f1a]"><ReceiptText className="h-4 w-4" />Create Invoice</button></div></aside></div>
}
function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) { return <Panel className="p-5"><p className="text-xs font-semibold uppercase text-slate-600">{label}</p><p className={`mt-3 text-xl font-bold ${emphasis ? 'text-[#cc2622]' : ''}`}>{value}</p></Panel> }
function EmptyBox({ icon, message }: { icon: React.ReactNode; message: string }) { return <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#efb6b0] text-slate-600">{icon}<p className="mt-4 text-sm font-medium">{message}</p></div> }
function StatusBadge({ className, label }: { className: string; label: string }) { return <span className={`rounded-full border border-[#eeb7b2] px-3 py-1 text-xs font-medium ${className}`}>{label.replaceAll('_', ' ')}</span> }
function formatDate(value: string) { return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }
