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
    issueDate,
    dueDate,
    status,
    clientName,
    clientContact,
    clientAddress,
    clientEmail,
    eventName,
    eventDate,
    eventVenue,
    lineItems = [],
    subtotal = 0,
    taxRate = 0,
    taxAmount = 0,
    totalDue = 0,
    paymentNotes,
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
    document.title = `${invoiceNumber || 'invoice'}`
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
            <span>Invoice preview</span>
          </div>
        )}

        {/* Company & Invoice Header */}
        <div className="flex flex-col justify-between gap-8 pb-10 sm:flex-row sm:items-start">
          {/* Left: Company Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img src="/dine-events-logo.png" alt="Dine Events" className="h-14 w-auto object-contain" />
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
              {issueDate && (
                <div className="flex justify-start sm:justify-end gap-4">
                  <span className="text-slate-500">Date of Issue</span>
                  <span className="font-bold text-slate-900">{issueDate}</span>
                </div>
              )}
              {dueDate && (
                <div className="flex justify-start sm:justify-end gap-4">
                  <span className="text-slate-500">Due Date</span>
                  <span className="font-bold text-[#CC2622]">{dueDate}</span>
                </div>
              )}
            </div>

            {status && <div className="pt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-700">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                {status}
              </span>
            </div>}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100"></div>

        {/* Bill To & Event Details */}
        <div className="grid gap-8 py-8 sm:grid-cols-2">
          {/* Bill To */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">BILL TO</p>
            {clientName && <p className="text-base font-bold text-slate-900">{clientName}</p>}
            {clientContact && <p className="text-sm font-medium text-slate-700">{clientContact}</p>}
            {clientAddress && <p className="text-sm text-slate-600 leading-relaxed">{clientAddress}</p>}
            {clientEmail && <p className="text-sm text-slate-600">{clientEmail}</p>}
          </div>

          {/* Event Details */}
          <div className="space-y-2 sm:pl-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">EVENT DETAILS</p>
            {eventName && <p className="text-sm font-medium text-slate-800">
              <span className="font-bold text-slate-900">Name: </span>
              {eventName}
            </p>}
            {eventDate && <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Date: </span>
              {eventDate}
            </p>}
            {eventVenue && <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-700">Location: </span>
              {eventVenue}
            </p>}
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
              {lineItems.length ? lineItems.map((item, idx) => (
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
              )) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">No invoice line items from the server.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Payment Notes */}
        <div className="mt-8 grid gap-6 sm:grid-cols-12 sm:items-start">
          {/* Payment Notes (Left) */}
          {paymentNotes ? <div className="sm:col-span-7 rounded-xl border border-red-200/80 bg-red-50/30 p-4 text-sm">
            <p className="font-bold text-slate-900 mb-1">Payment Notes</p>
            <p className="text-xs text-slate-600 leading-relaxed">{paymentNotes}</p>
          </div> : <div className="hidden sm:col-span-7 sm:block" />}

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

        <div className="mt-14 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
          <p className="font-bold text-slate-800 text-sm">Thank you for your business.</p>
        </div>
      </div>
    </div>
  )
}
