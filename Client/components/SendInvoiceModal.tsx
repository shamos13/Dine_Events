'use client'

import React, { useState } from 'react'
import { AtSign, FileText, ReceiptText, Send, X } from 'lucide-react'

export interface SendInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSendSuccess?: () => void
  invoiceNumber?: string
  eventName?: string
  clientName?: string
  clientEmail?: string
  totalAmount?: number
  savedTime?: string
}

export default function SendInvoiceModal({
  isOpen,
  onClose,
  onSendSuccess,
  invoiceNumber = 'INV-2026-005',
  eventName = 'Luxury Gala: Night of Stars',
  clientName = 'David Johnson',
  clientEmail = 'david.johnson@example.com',
  totalAmount = 1250000,
  savedTime = 'Draft saved 2h ago',
}: SendInvoiceModalProps) {
  const [recipientEmail, setRecipientEmail] = useState(clientEmail)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)

  if (!isOpen) return null

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    // Simulate sending email
    setTimeout(() => {
      setSending(false)
      setSentSuccess(true)
      setTimeout(() => {
        setSentSuccess(false)
        if (onSendSuccess) onSendSuccess()
        onClose()
      }, 1200)
    }, 800)
  }

  const formatCurrency = (val: number) => {
    return `KSh ${Number(val).toLocaleString('en-US')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Send Invoice</h2>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-600">
                {invoiceNumber}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              {eventName} <span className="text-slate-300">&bull;</span> Client: {clientName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSend} className="p-6 space-y-5">
          {sentSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Send className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Invoice Sent Successfully!</h3>
              <p className="text-sm text-slate-500">
                A email with PDF attachment has been dispatched to <span className="font-semibold text-slate-700">{recipientEmail}</span>.
              </p>
            </div>
          ) : (
            <>
              {/* Recipient Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  RECIPIENT EMAIL
                </label>
                <div className="relative flex items-center">
                  <AtSign className="absolute left-4 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-slate-900 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
                  />
                </div>
              </div>

              {/* Message Optional */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  MESSAGE <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal note to include with the document..."
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
                />
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/60 p-4 text-xs text-slate-700">
                <FileText className="h-5 w-5 text-[#CC2622] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  A professional PDF of <span className="font-bold text-slate-900">{invoiceNumber}</span> will be automatically generated and attached to this email.
                </p>
              </div>

              {/* Invoice Summary Box */}
              <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Invoice Total</p>
                    <p className="text-xs text-slate-500">{savedTime}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-extrabold text-slate-900">{formatCurrency(totalAmount)}</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#CC2622] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#a01f1a] disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Email'}
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
