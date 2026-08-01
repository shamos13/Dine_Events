'use client'

import React, { useEffect, useState } from 'react'
import { AtSign, FileText, ReceiptText, Send, X } from 'lucide-react'

export interface SendQuotationModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: () => Promise<void>
  onSendSuccess?: () => void
  quotationNumber?: string
  eventName?: string
  clientName?: string
  clientEmail?: string
  totalAmount?: number
  savedTime?: string
}

export default function SendQuotationModal({
  isOpen,
  onClose,
  onSend,
  onSendSuccess,
  quotationNumber = 'QT-2026-005',
  eventName = 'Luxury Gala: Night of Stars',
  clientName = 'David Johnson',
  clientEmail = 'david.johnson@example.com',
  totalAmount = 1250000,
  savedTime = 'Draft saved just now',
}: SendQuotationModalProps) {
  const [recipientEmail, setRecipientEmail] = useState(clientEmail)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setRecipientEmail(clientEmail)
      setMessage('')
      setSending(false)
      setSentSuccess(false)
      setError(null)
    }
  }, [clientEmail, isOpen])

  if (!isOpen) return null

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await onSend()
      setSentSuccess(true)
      setTimeout(() => {
        setSentSuccess(false)
        onSendSuccess?.()
        onClose()
      }, 1200)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send quotation.')
    } finally {
      setSending(false)
    }
  }

  const formatCurrency = (val: number) => `KSh ${Number(val).toLocaleString('en-US')}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        <div className="flex items-start justify-between border-b border-slate-100 p-6 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Send Quotation</h2>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-600">
                {quotationNumber}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {eventName} <span className="text-slate-300">&bull;</span> Client: {clientName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSend(e)} className="space-y-5 p-6">
          {sentSuccess ? (
            <div className="space-y-3 py-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Send className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Proposal Sent Successfully!</h3>
              <p className="text-sm text-slate-500">
                The quotation is now visible to <span className="font-semibold text-slate-700">{recipientEmail}</span> in their portal for acceptance.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Recipient Email
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

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Message <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal note to include with the document..."
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
                />
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/60 p-4 text-xs text-slate-700">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#CC2622]" />
                <p className="leading-relaxed">
                  Sending marks <span className="font-bold text-slate-900">{quotationNumber}</span> as SENT so the client can review and accept it in their portal.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Quotation Total</p>
                    <p className="text-xs text-slate-500">{savedTime}</p>
                  </div>
                </div>

                <p className="text-xl font-extrabold text-slate-900">{formatCurrency(totalAmount)}</p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#CC2622] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#a01f1a] disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send to Client'}
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
