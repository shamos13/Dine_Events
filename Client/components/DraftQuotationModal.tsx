'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, Check, Download, Eye, Send, X } from 'lucide-react'
import type { InvoiceDisplayOptions } from './InvoiceTemplate'
import type { QuotationTemplateData } from './QuotationTemplate'

export interface DraftQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  onPreview: (data: QuotationTemplateData) => void | Promise<void>
  onSendQuotation: (data: QuotationTemplateData) => void | Promise<void>
  onSaveDraft?: (data: QuotationTemplateData) => void | Promise<void>
  quotationNumber?: string
  quotationName?: string
  validUntil?: string
  totalEventAmount: number
  eventData?: {
    eventName?: string
    clientName?: string
    clientEmail?: string
    clientAddress?: string
    eventDate?: string
    eventVenue?: string
    lineItems?: Array<{ id?: number | string; description: string; subdescription?: string; qty: number; unitPrice: number; total: number }>
  }
}

export default function DraftQuotationModal({
  isOpen,
  onClose,
  onPreview,
  onSendQuotation,
  onSaveDraft,
  quotationNumber = 'Draft',
  quotationName = 'Event Quotation',
  validUntil,
  totalEventAmount,
  eventData,
}: DraftQuotationModalProps) {
  const [documentTitle, setDocumentTitle] = useState(quotationName)
  const [validUntilDate, setValidUntilDate] = useState(
    validUntil ? validUntil.split('T')[0] : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  )
  const [acceptanceNotes, setAcceptanceNotes] = useState('To accept this quotation, reply to confirm availability and event details. Final invoice will be generated after approval.')
  const [actionError, setActionError] = useState<string | null>(null)
  const [submittingAction, setSubmittingAction] = useState<'preview' | 'send' | 'save' | null>(null)
  const [displayOptions, setDisplayOptions] = useState<InvoiceDisplayOptions>({
    showQuantities: true,
    showUnitPrices: true,
    showDescriptions: true,
    showPackageComponents: false,
  })

  useEffect(() => {
    setDocumentTitle(quotationName)
  }, [quotationName])

  useEffect(() => {
    if (validUntil) setValidUntilDate(validUntil.split('T')[0])
  }, [validUntil])

  if (!isOpen) return null

  const buildTemplateData = (): QuotationTemplateData => {
    const rawNum = quotationNumber.replace('#', '')

    return {
      quotationNumber: rawNum,
      quotationName: documentTitle,
      issueDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      validUntil: validUntilDate
        ? new Date(`${validUntilDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : undefined,
      status: 'Draft',
      clientName: eventData?.clientName,
      clientAddress: eventData?.clientAddress,
      clientEmail: eventData?.clientEmail,
      eventName: eventData?.eventName,
      eventDate: eventData?.eventDate,
      eventVenue: eventData?.eventVenue,
      lineItems: eventData?.lineItems ?? [],
      subtotal: totalEventAmount,
      taxRate: 0,
      taxAmount: 0,
      total: totalEventAmount,
      acceptanceNotes,
      displayOptions,
    }
  }

  const runAction = async (
    action: 'preview' | 'send' | 'save',
    handler: (data: QuotationTemplateData) => void | Promise<void>
  ) => {
    setSubmittingAction(action)
    setActionError(null)
    try {
      await handler(buildTemplateData())
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Unable to create quotation.')
    } finally {
      setSubmittingAction(null)
    }
  }

  const handleSaveDraftClick = () => {
    if (onSaveDraft) void runAction('save', onSaveDraft)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        <div className="flex items-start justify-between border-b border-slate-100 p-6 pb-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#CC2622]">PROPOSAL MODULE</p>
            <div className="mt-1 flex items-baseline gap-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Draft Quotation</h2>
              <span className="font-mono text-sm text-slate-500">{quotationNumber}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-140px)] space-y-6 overflow-y-auto p-6">
          {actionError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {actionError}
            </p>
          )}

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Document Title
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Quotation Total
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-900">
                KSh {Number(totalEventAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Valid Until
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={validUntilDate}
                  onChange={(e) => setValidUntilDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-slate-900 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
                />
                <Calendar className="pointer-events-none absolute right-4 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Acceptance Notes
            </label>
            <textarea
              rows={3}
              value={acceptanceNotes}
              onChange={(e) => setAcceptanceNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-900 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
            />
          </div>

          <div>
            <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Display Options
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ToggleRow label="Show quantities" checked={!!displayOptions.showQuantities} onChange={(val) => setDisplayOptions((prev) => ({ ...prev, showQuantities: val }))} />
              <ToggleRow label="Show unit prices" checked={!!displayOptions.showUnitPrices} onChange={(val) => setDisplayOptions((prev) => ({ ...prev, showUnitPrices: val }))} />
              <ToggleRow label="Show descriptions" checked={!!displayOptions.showDescriptions} onChange={(val) => setDisplayOptions((prev) => ({ ...prev, showDescriptions: val }))} />
              <ToggleRow label="Show package components" checked={!!displayOptions.showPackageComponents} onChange={(val) => setDisplayOptions((prev) => ({ ...prev, showPackageComponents: val }))} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/80 p-6">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
            <button
              onClick={() => void runAction('preview', onPreview)}
              disabled={submittingAction !== null}
              className="inline-flex items-center gap-1.5 transition hover:text-[#CC2622] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              {submittingAction === 'preview' ? 'Creating...' : 'Preview'}
            </button>
            <span className="text-slate-300">&bull;</span>
            <button
              onClick={() => void runAction('preview', onPreview)}
              disabled={submittingAction !== null}
              className="inline-flex items-center gap-1.5 transition hover:text-[#CC2622] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            <span className="text-slate-300">&bull;</span>
            <button onClick={onClose} className="inline-flex items-center gap-1.5 transition hover:text-[#CC2622]">
              <Check className="h-4 w-4" />
              Mark Sent
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraftClick}
              disabled={submittingAction !== null}
              className="rounded-xl bg-blue-100 px-4 py-2.5 text-xs font-bold text-blue-800 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingAction === 'save' ? 'Creating...' : 'Save Draft'}
            </button>
            <button
              onClick={() => void runAction('send', onSendQuotation)}
              disabled={submittingAction !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-[#CC2622] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#a01f1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingAction === 'send' ? 'Creating...' : 'Send Quotation'}
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold text-slate-800">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-[#CC2622]' : 'bg-slate-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
