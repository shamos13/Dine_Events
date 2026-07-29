'use client'

import React from 'react'
import Link from 'next/link'
import { Download, Mail, Printer, Sparkles } from 'lucide-react'

export type InvoiceDisplayOptions = {
  showQuantities?: boolean
  showUnitPrices?: boolean
  showDescriptions?: boolean
  showPackageComponents?: boolean
}

export type InvoiceTemplateData = {
  invoiceNumber: string
  issueDate?: string
  dueDate?: string
  status?: string
  clientName?: string
  clientContact?: string
  clientAddress?: string
  clientEmail?: string
  eventName?: string
  eventDate?: string
  eventVenue?: string
  lineItems?: Array<{
    id?: number | string
    description: string
    subdescription?: string
    qty: number
    unitPrice: number
    total: number
    type?: string
  }>
  subtotal: number
  taxRate?: number
  taxAmount?: number
  totalDue: number
  paymentNotes?: string
  displayOptions?: InvoiceDisplayOptions
}

interface InvoiceTemplateProps {
  data: InvoiceTemplateData
  onSendEmail?: () => void
  showActions?: boolean
  previewMode?: boolean
}

export default function InvoiceTemplate({
  data,
  onSendEmail,
  showActions = true,
  previewMode = false,
}: InvoiceTemplateProps) {
  const {
    invoiceNumber,
    issueDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    dueDate = new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status = 'Pending Payment',
    clientName = 'Acme Corporation',
    clientContact = 'Attn: Jane Doe, Procurement',
    clientAddress = '456 Industrial Way, Tech City, CA 94016',
    clientEmail = 'jane.doe@acmecorp.com',
    eventName = 'Annual Tech Gala',
    eventDate = 'Oct 20, 2023',
    eventVenue = 'The Grand Hall',
    lineItems = [
      { description: 'Premium Catering Services', subdescription: '3-course meal for 150 guests', qty: 150, unitPrice: 85, total: 12750 },
      { description: 'A/V Equipment Rental', subdescription: 'Projectors, microphones, lighting rig', qty: 1, unitPrice: 2400, total: 2400 },
      { description: 'Staffing & Service Fee', subdescription: 'Waitstaff, bartenders, and coordinators (8 hrs)', qty: 12, unitPrice: 350, total: 4200 },
      { description: 'Venue Cleaning', subdescription: 'Post-event deep clean', qty: 1, unitPrice: 500, total: 500 },
    ],
    subtotal = 19850,
    taxRate = 5,
    taxAmount = 992.50,
    totalDue = 20842.50,
    paymentNotes = `Please include invoice number ${invoiceNumber} on your check or wire transfer. Late payments may be subject to a 1.5% monthly fee.`,
    displayOptions = {
      showQuantities: true,
      showUnitPrices: true,
      showDescriptions: true,
      showPackageComponents: false,
    },
  } = data

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = () => {
    window.print()
  }

  const formatCurrency = (val: number) => {
    return `KSh ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="w-full font-sans text-slate-800">
      {/* Top Action Bar & Breadcrumbs */}
      {showActions && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Link href="/invoices" className="hover:text-[#CC2622] transition-colors">
              Invoices
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="font-semibold text-slate-900">{invoiceNumber}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Printer className="h-4 w-4 text-slate-600" />
              Print
            </button>
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Download className="h-4 w-4 text-slate-600" />
              Download PDF
            </button>
            {onSendEmail && (
              <button
                onClick={onSendEmail}
                className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a01f1a]"
              >
                <Mail className="h-4 w-4" />
                Send via Email
              </button>
            )}
          </div>
        </div>
      )}

      {/* Invoice Document Box */}
      <div className="relative mx-auto w-full max-w-[960px] rounded-2xl border border-red-200/80 bg-white p-8 shadow-sm sm:p-12 print:border-none print:shadow-none">
        {previewMode && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 print:hidden">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Document Preview Mode &mdash; showing live invoice layout formatted for database export.</span>
          </div>
        )}

        {/* Company & Invoice Header */}
        <div className="flex flex-col justify-between gap-8 pb-10 sm:flex-row sm:items-start">
          {/* Left: Company Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#CC2622] to-amber-500 text-white shadow-md">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.46 3.9 3.45 4.38L4 22h2.1l2.05-7.7A4.49 4.49 0 0 0 11 10.38V9zm8-7h-1c-1.66 0-3 1.34-3 3v7h2v9h2V2z" />
                </svg>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Dine<span className="text-[#CC2622]">Events</span>
              </span>
            </div>

            <div className="text-sm leading-relaxed text-slate-600">
              <p className="font-bold text-slate-900">Dine Events Management</p>
              <p>123 Culinary Boulevard, Suite 400</p>
              <p>Metropolis, NY 10012</p>
              <p className="mt-1">billing@dineevents.com</p>
              <p>+1 (555) 019-8273</p>
            </div>
          </div>

          {/* Right: Invoice Metadata */}
          <div className="text-left sm:text-right space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-[#CC2622]">INVOICE</h1>

            <div className="space-y-1.5 pt-2 text-sm text-slate-700">
              <div className="flex justify-start sm:justify-end gap-4">
                <span className="text-slate-500">Invoice Number</span>
                <span className="font-bold text-slate-900">{invoiceNumber}</span>
              </div>
              <div className="flex justify-start sm:justify-end gap-4">
                <span className="text-slate-500">Date of Issue</span>
                <span className="font-bold text-slate-900">{issueDate}</span>
              </div>
              <div className="flex justify-start sm:justify-end gap-4">
                <span className="text-slate-500">Due Date</span>
                <span className="font-bold text-[#CC2622]">{dueDate}</span>
              </div>
            </div>

            <div className="pt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-700">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100"></div>

        {/* Bill To & Event Details */}
        <div className="grid gap-8 py-8 sm:grid-cols-2">
          {/* Bill To */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">BILL TO</p>
            <p className="text-base font-bold text-slate-900">{clientName}</p>
            {clientContact && <p className="text-sm font-medium text-slate-700">{clientContact}</p>}
            <p className="text-sm text-slate-600 leading-relaxed">{clientAddress}</p>
            <p className="text-sm text-slate-600">{clientEmail}</p>
          </div>

          {/* Event Details */}
          <div className="space-y-2 sm:pl-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">EVENT DETAILS</p>
            <p className="text-sm font-medium text-slate-800">
              <span className="font-bold text-slate-900">Name: </span>
              {eventName}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Date: </span>
              {eventDate}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Location: </span>
              {eventVenue}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3.5 px-4">Description</th>
                {displayOptions.showQuantities !== false && <th className="py-3.5 px-4 text-center">Qty</th>}
                {displayOptions.showUnitPrices !== false && <th className="py-3.5 px-4 text-right">Unit Price</th>}
                <th className="py-3.5 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-900">{item.description}</p>
                    {displayOptions.showDescriptions !== false && item.subdescription && (
                      <p className="mt-0.5 text-xs text-slate-500">{item.subdescription}</p>
                    )}
                  </td>
                  {displayOptions.showQuantities !== false && (
                    <td className="py-4 px-4 text-center font-medium text-slate-700">{item.qty}</td>
                  )}
                  {displayOptions.showUnitPrices !== false && (
                    <td className="py-4 px-4 text-right font-medium text-slate-700">{formatCurrency(item.unitPrice)}</td>
                  )}
                  <td className="py-4 px-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Payment Notes */}
        <div className="mt-8 grid gap-6 sm:grid-cols-12 sm:items-start">
          {/* Payment Notes (Left) */}
          <div className="sm:col-span-7 rounded-xl border border-red-200/80 bg-red-50/30 p-4 text-sm">
            <p className="font-bold text-slate-900 mb-1">Payment Notes</p>
            <p className="text-xs text-slate-600 leading-relaxed">{paymentNotes}</p>
          </div>

          {/* Totals (Right) */}
          <div className="sm:col-span-5 space-y-2 text-right text-sm">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>Tax ({taxRate}%)</span>
                <span className="font-semibold text-slate-900">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
              <span className="font-extrabold text-[#CC2622]">Total Due</span>
              <span className="text-xl font-extrabold text-[#CC2622]">{formatCurrency(totalDue)}</span>
            </div>
          </div>
        </div>

        {/* Footer Thank You */}
        <div className="mt-14 border-t border-slate-100 pt-6 text-center text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-800 text-sm">Thank you for your business!</p>
          <p>Payment is due within 14 days. If you have any questions concerning this invoice, please contact billing@dineevents.com.</p>
        </div>
      </div>
    </div>
  )
}
