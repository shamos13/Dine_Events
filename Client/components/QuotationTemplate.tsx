'use client'

import React from 'react'
import Link from 'next/link'
import { Download, Mail, Printer, Sparkles } from 'lucide-react'
import type { InvoiceDisplayOptions } from './InvoiceTemplate'

export type QuotationTemplateData = {
  quotationNumber: string
  quotationName?: string
  issueDate?: string
  validUntil?: string
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
  discountPercent?: number
  discountAmount?: number
  discountReason?: string
  taxRate?: number
  taxAmount?: number
  total: number
  acceptanceNotes?: string
  displayOptions?: InvoiceDisplayOptions
}

interface QuotationTemplateProps {
  data: QuotationTemplateData
  onSendEmail?: () => void
  showActions?: boolean
  previewMode?: boolean
}

export default function QuotationTemplate({
  data,
  onSendEmail,
  showActions = true,
  previewMode = false,
}: QuotationTemplateProps) {
  const {
    quotationNumber,
    quotationName,
    issueDate,
    validUntil,
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
    discountPercent = 0,
    discountAmount = 0,
    discountReason,
    taxRate = 0,
    taxAmount = 0,
    total = 0,
    acceptanceNotes,
    displayOptions = {
      showQuantities: true,
      showUnitPrices: true,
      showDescriptions: true,
      showPackageComponents: false,
    },
  } = data

  const formatCurrency = (val: number) =>
    `KSh ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const handlePrint = () => window.print()

  const handleDownloadPdf = () => {
    document.title = quotationNumber || 'quotation'
    window.print()
  }

  return (
    <div className="w-full font-sans text-slate-800">
      {showActions && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Link href="/events" className="transition-colors hover:text-[#CC2622]">
              Events
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="font-semibold text-slate-900">{quotationNumber}</span>
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

      <div className="relative mx-auto w-full max-w-[960px] rounded-2xl border border-red-200/80 bg-white p-8 shadow-sm sm:p-12 print:border-none print:shadow-none">
        {previewMode && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 print:hidden">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Quotation preview</span>
          </div>
        )}

        <div className="flex flex-col justify-between gap-8 pb-10 sm:flex-row sm:items-start">
          <div className="space-y-3">
            <img src="/dine-events-logo.png" alt="Dine Events" className="h-14 w-auto object-contain" />
            {quotationName && <p className="text-sm font-semibold text-slate-600">{quotationName}</p>}
          </div>

          <div className="space-y-2 text-left sm:text-right">
            <h1 className="text-4xl font-extrabold tracking-tight text-[#CC2622]">QUOTATION</h1>
            <div className="space-y-1.5 pt-2 text-sm text-slate-700">
              <Meta label="Quotation Number" value={quotationNumber} />
              {issueDate && <Meta label="Date of Issue" value={issueDate} />}
              {validUntil && <Meta label="Valid Until" value={validUntil} emphasis />}
            </div>
            {status && (
              <div className="pt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  {status}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        <div className="grid gap-8 py-8 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">PREPARED FOR</p>
            {clientName && <p className="text-base font-bold text-slate-900">{clientName}</p>}
            {clientContact && <p className="text-sm font-medium text-slate-700">{clientContact}</p>}
            {clientAddress && <p className="text-sm leading-relaxed text-slate-600">{clientAddress}</p>}
            {clientEmail && <p className="text-sm text-slate-600">{clientEmail}</p>}
          </div>

          <div className="space-y-2 sm:pl-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">EVENT DETAILS</p>
            {eventName && <Detail label="Name" value={eventName} strong />}
            {eventDate && <Detail label="Date" value={eventDate} />}
            {eventVenue && <Detail label="Location" value={eventVenue} />}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
                <th className="px-4 py-3.5">Description</th>
                {displayOptions.showQuantities !== false && <th className="px-4 py-3.5 text-center">Qty</th>}
                {displayOptions.showUnitPrices !== false && <th className="px-4 py-3.5 text-right">Unit Price</th>}
                <th className="px-4 py-3.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.length ? (
                lineItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-900">{item.description}</p>
                      {displayOptions.showDescriptions !== false && item.subdescription && (
                        <p className="mt-0.5 text-xs text-slate-500">{item.subdescription}</p>
                      )}
                    </td>
                    {displayOptions.showQuantities !== false && (
                      <td className="px-4 py-4 text-center font-medium text-slate-700">{item.qty}</td>
                    )}
                    {displayOptions.showUnitPrices !== false && (
                      <td className="px-4 py-4 text-right font-medium text-slate-700">{formatCurrency(item.unitPrice)}</td>
                    )}
                    <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                    No quotation line items from the server.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-12 sm:items-start">
          {acceptanceNotes ? (
            <div className="rounded-xl border border-red-200/80 bg-red-50/30 p-4 text-sm sm:col-span-7">
              <p className="mb-1 font-bold text-slate-900">Acceptance Notes</p>
              <p className="text-xs leading-relaxed text-slate-600">{acceptanceNotes}</p>
            </div>
          ) : (
            <div className="hidden sm:col-span-7 sm:block" />
          )}

          <div className="space-y-3 sm:col-span-5">
            <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
            {discountPercent > 0 && (
              <SummaryRow
                label={`Discount (${discountPercent}%)`}
                value={`− ${formatCurrency(discountAmount)}`}
              />
            )}
            {discountReason && discountPercent > 0 && (
              <p className="text-xs text-slate-500">{discountReason}</p>
            )}
            {taxRate > 0 && <SummaryRow label={`Tax (${taxRate}%)`} value={formatCurrency(taxAmount)} />}
            <div className="border-t border-slate-200 pt-3">
              <SummaryRow label="Quotation Total" value={formatCurrency(total)} large />
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          <p>Thank you for considering Dine Events. This quotation is subject to availability and confirmation.</p>
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex justify-start gap-4 sm:justify-end">
      <span className="text-slate-500">{label}</span>
      <span className={`font-bold ${emphasis ? 'text-[#CC2622]' : 'text-slate-900'}`}>{value}</span>
    </div>
  )
}

function Detail({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className={`text-sm ${strong ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
      <span className="font-semibold text-slate-700">{label}: </span>
      {value}
    </p>
  )
}

function SummaryRow({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`${large ? 'text-base font-bold text-slate-900' : 'text-sm text-slate-600'}`}>{label}</span>
      <span className={`${large ? 'text-xl font-extrabold text-[#CC2622]' : 'text-sm font-bold text-slate-900'}`}>{value}</span>
    </div>
  )
}
