'use client'

import React, { useState } from 'react'
import { Calendar, Check, Download, Eye, Send, X } from 'lucide-react'
import type { InvoiceDisplayOptions, InvoiceTemplateData } from './InvoiceTemplate'

export interface DraftInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onPreview: (data: InvoiceTemplateData) => void
  onSendInvoice: (data: InvoiceTemplateData) => void
  onSaveDraft?: (data: InvoiceTemplateData) => void
  invoiceNumber?: string
  totalEventAmount?: number
  eventData?: {
    eventName?: string
    clientName?: string
    clientEmail?: string
    clientAddress?: string
    eventDate?: string
    eventVenue?: string
    lineItems?: Array<{ description: string; subdescription?: string; qty: number; unitPrice: number; total: number }>
  }
}

export default function DraftInvoiceModal({
  isOpen,
  onClose,
  onPreview,
  onSendInvoice,
  onSaveDraft,
  invoiceNumber = '#INV-2026-005',
  totalEventAmount = 1250000,
  eventData,
}: DraftInvoiceModalProps) {
  const [documentTitle, setDocumentTitle] = useState('Invoice')
  const [amount, setAmount] = useState<number>(totalEventAmount)
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  )
  const [quickCalc, setQuickCalc] = useState<'10%' | '25%' | '50%' | 'Full balance'>('Full balance')

  // Display options switches
  const [displayOptions, setDisplayOptions] = useState<InvoiceDisplayOptions>({
    showQuantities: true,
    showUnitPrices: true,
    showDescriptions: true,
    showPackageComponents: false,
  })

  if (!isOpen) return null

  const handleQuickCalc = (option: '10%' | '25%' | '50%' | 'Full balance') => {
    setQuickCalc(option)
    if (option === '10%') setAmount(totalEventAmount * 0.1)
    else if (option === '25%') setAmount(totalEventAmount * 0.25)
    else if (option === '50%') setAmount(totalEventAmount * 0.5)
    else setAmount(totalEventAmount)
  }

  const buildTemplateData = (): InvoiceTemplateData => {
    const rawNum = invoiceNumber.replace('#', '')
    const subtotal = amount
    const taxAmount = subtotal * 0.05 // 5% tax or matching calculation
    const totalDue = subtotal + taxAmount

    return {
      invoiceNumber: rawNum,
      dueDate: dueDate,
      status: 'Pending Payment',
      clientName: eventData?.clientName || 'David Johnson',
      clientContact: 'Attn: Procurement',
      clientAddress: eventData?.clientAddress || '123 Enterprise Rd, Suite 100',
      clientEmail: eventData?.clientEmail || 'david.johnson@example.com',
      eventName: eventData?.eventName || 'Luxury Gala: Night of Stars',
      eventDate: eventData?.eventDate || 'Oct 24, 2026',
      eventVenue: eventData?.eventVenue || 'Grand Ballroom',
      lineItems: eventData?.lineItems || [
        {
          description: documentTitle || 'Event Catering & Services',
          subdescription: 'Package components & full service catering',
          qty: 1,
          unitPrice: amount,
          total: amount,
        },
      ],
      subtotal: subtotal,
      taxRate: 5,
      taxAmount: taxAmount,
      totalDue: totalDue,
      displayOptions: displayOptions,
    }
  }

  const handlePreviewClick = () => {
    onPreview(buildTemplateData())
  }

  const handleSendInvoiceClick = () => {
    onSendInvoice(buildTemplateData())
  }

  const handleSaveDraftClick = () => {
    if (onSaveDraft) {
      onSaveDraft(buildTemplateData())
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#CC2622]">
              BILLING MODULE
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-extrabold text-slate-900">Draft Invoice</h2>
              <span className="font-mono text-sm text-slate-500">{invoiceNumber}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
          {/* Document Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              DOCUMENT TITLE
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
            />
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                AMOUNT
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm font-semibold text-slate-500">KSh</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-14 pr-4 text-slate-900 font-semibold focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                DUE DATE
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-slate-900 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
                />
                <Calendar className="absolute right-4 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Amount Calculation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              QUICK AMOUNT CALCULATION
            </label>
            <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-blue-50/70 p-1.5 border border-blue-100">
              {(['10%', '25%', '50%', 'Full balance'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleQuickCalc(opt)}
                  className={`rounded-lg py-2.5 text-xs font-bold transition ${
                    quickCalc === opt
                      ? 'bg-[#CC2622] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-blue-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Display Options */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              DISPLAY OPTIONS
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ToggleRow
                label="Show quantities"
                checked={!!displayOptions.showQuantities}
                onChange={(val) =>
                  setDisplayOptions((prev) => ({ ...prev, showQuantities: val }))
                }
              />
              <ToggleRow
                label="Show unit prices"
                checked={!!displayOptions.showUnitPrices}
                onChange={(val) =>
                  setDisplayOptions((prev) => ({ ...prev, showUnitPrices: val }))
                }
              />
              <ToggleRow
                label="Show descriptions"
                checked={!!displayOptions.showDescriptions}
                onChange={(val) =>
                  setDisplayOptions((prev) => ({ ...prev, showDescriptions: val }))
                }
              />
              <ToggleRow
                label="Show package components"
                checked={!!displayOptions.showPackageComponents}
                onChange={(val) =>
                  setDisplayOptions((prev) => ({ ...prev, showPackageComponents: val }))
                }
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-50/80 border-t border-slate-100">
          {/* Left Actions */}
          <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
            <button
              onClick={handlePreviewClick}
              className="inline-flex items-center gap-1.5 hover:text-[#CC2622] transition"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <span className="text-slate-300">&bull;</span>
            <button
              onClick={handlePreviewClick}
              className="inline-flex items-center gap-1.5 hover:text-[#CC2622] transition"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            <span className="text-slate-300">&bull;</span>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 hover:text-[#CC2622] transition"
            >
              <Check className="h-4 w-4" />
              Mark Sent
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraftClick}
              className="rounded-xl bg-blue-100 px-4 py-2.5 text-xs font-bold text-blue-800 transition hover:bg-blue-200"
            >
              Save Draft
            </button>
            <button
              onClick={handleSendInvoiceClick}
              className="inline-flex items-center gap-2 rounded-xl bg-[#CC2622] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#a01f1a]"
            >
              Send Invoice
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
