'use client'

import { MoreVertical, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { ApiError } from '@/lib/api/client'
import { getInvoices, type InvoiceResponse } from '@/lib/api/invoices'

const statusStyles: Record<InvoiceResponse['invoiceStatus'], string> = { PAID: 'bg-green-100 text-green-700', UNPAID: 'bg-gray-100 text-gray-700', PARTIALLY_PAID: 'bg-blue-100 text-blue-700', OVERDUE: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-100 text-gray-700' }

export default function Invoices() {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([])
  const [filter, setFilter] = useState('All Invoices')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { getInvoices().then(setInvoices).catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load invoices.')).finally(() => setLoading(false)) }, [])
  const visibleInvoices = useMemo(() => invoices.filter((invoice) => (filter === 'All Invoices' || invoice.invoiceStatus === filter.toUpperCase().replace(' ', '_')) && `${invoice.invoiceNumber} ${invoice.clientName ?? ''} ${invoice.eventName}`.toLowerCase().includes(search.toLowerCase())), [filter, invoices, search])
  const filters = ['All Invoices', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue']

  return <div className="min-h-screen flex flex-col bg-gray-50"><Header /><main className="flex-1 p-6"><div className="mb-8 flex items-start justify-between"><div><h1 className="mb-2 text-3xl font-bold text-gray-900">Invoices</h1><p className="text-gray-600">Manage and track your billing operations.</p></div></div><div className="mb-6 rounded-lg border border-gray-200 bg-white p-4"><div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center"><div className="flex flex-wrap items-center gap-2">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-4 py-2 font-medium transition ${filter === item ? 'bg-[#CC2622] text-white' : 'border border-gray-200 bg-white text-gray-700 hover:border-[#CC2622]'}`}>{item}</button>)}</div><div className="relative w-full lg:w-64"><Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoices..." className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#CC2622]" /></div></div></div>{loading ? <p className="text-gray-600">Loading invoices...</p> : error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p> : <div className="overflow-hidden rounded-lg border border-gray-200 bg-white"><table className="w-full"><thead className="border-b border-gray-200 bg-blue-50"><tr>{['Invoice', 'Client', 'Event', 'Created', 'Amount Due', 'Status', 'Actions'].map((item) => <th key={item} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{item}</th>)}</tr></thead><tbody>{visibleInvoices.map((invoice, index) => <tr key={invoice.invoiceId} className={index !== visibleInvoices.length - 1 ? 'border-b border-gray-200' : ''}><td className="px-6 py-4 font-semibold text-[#CC2622]">{invoice.invoiceNumber}</td><td className="px-6 py-4 text-gray-900">{invoice.clientName ?? '—'}</td><td className="px-6 py-4 text-gray-600">{invoice.eventName}</td><td className="px-6 py-4 text-gray-600">{new Date(invoice.createdAt).toLocaleDateString()}</td><td className="px-6 py-4 font-semibold text-gray-900">KSh {Number(invoice.amountDue).toLocaleString()}</td><td className="px-6 py-4"><span className={`rounded px-3 py-1 text-xs font-medium ${statusStyles[invoice.invoiceStatus]}`}>{invoice.invoiceStatus}</span></td><td className="px-6 py-4"><button aria-label={`Actions for ${invoice.invoiceNumber}`} className="rounded-lg p-2 hover:bg-gray-100"><MoreVertical className="h-4 w-4 text-gray-600" /></button></td></tr>)}</tbody></table><div className="border-t border-gray-200 px-6 py-4 text-sm text-gray-600">Showing {visibleInvoices.length} invoices</div></div>}</main><Footer /></div>
}
