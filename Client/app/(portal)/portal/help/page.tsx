'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, MessageCircle, Phone, Send } from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import {
  getPortalFeedback,
  submitPortalFeedback,
  type FeedbackResponse,
  type FeedbackType,
} from '@/lib/api/portal'
import { Card } from '@/components/ui/card'
import { StatusPill } from '@/components/ui/status-pill'
import { useToast } from '@/components/ui/toast'

const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'SUGGESTION', label: 'Suggestion' },
  { value: 'COMPLAINT', label: 'Complaint' },
  { value: 'COMPLIMENT', label: 'Compliment' },
  { value: 'QUESTION', label: 'Question' },
]

export default function PortalHelpPage() {
  const { toast } = useToast()
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('SUGGESTION')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<FeedbackResponse[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadHistory = useCallback(() => {
    setHistoryLoading(true)
    getPortalFeedback()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!subject.trim() || !message.trim()) {
      setError('Please add a subject and a message.')
      return
    }
    setSubmitting(true)
    try {
      await submitPortalFeedback({
        feedbackType,
        subject: subject.trim(),
        message: message.trim(),
      })
      setSubject('')
      setMessage('')
      toast('Thank you! Your feedback has been sent to our team.', 'success')
      loadHistory()
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to send feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & support</h1>
        <p className="mt-1 text-gray-600">Your dedicated planner is here to help shape the perfect event.</p>
      </div>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Send us a suggestion or complaint</h2>
        <p className="text-sm text-gray-600">
          Your message goes straight to the Dine Events team — we track every one and reply here.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFeedbackType(option.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                  feedbackType === option.value
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="feedback-subject" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
              Subject
            </label>
            <input
              id="feedback-subject"
              className="form-input"
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Idea for the menu builder"
            />
          </div>
          <div>
            <label htmlFor="feedback-message" className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
              Message
            </label>
            <textarea
              id="feedback-message"
              className="form-input min-h-32"
              maxLength={4000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what happened or what we could do better…"
            />
          </div>
          {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Sending…' : 'Send feedback'}
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-gray-900">Your previous messages</h2>
        {historyLoading ? (
          <p className="mt-3 text-sm text-gray-500">Loading…</p>
        ) : history.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">You haven&apos;t sent any feedback yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {history.map((item) => (
              <li key={item.feedbackId} className="rounded-lg border border-gray-100 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{item.subject}</p>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-500">
                      {item.feedbackType} · {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusPill status={item.feedbackStatus} />
                </div>
                <p className="mt-2 text-sm text-gray-700">{item.message}</p>
                {item.adminResponse && (
                  <p className="mt-2 rounded-lg bg-brand-soft p-3 text-sm text-gray-800">
                    <span className="font-semibold">Dine Events replied:</span> {item.adminResponse}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Contact your planner</h2>
        <p className="text-sm text-gray-600">
          For menu changes, venue logistics, or invoice questions, reach the Dine Events operations desk.
        </p>
        <div className="space-y-3 text-sm text-gray-700">
          <p className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4 text-brand" /> +254 700 000 000
          </p>
          <p className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand" /> planner@dineevents.ke
          </p>
          <p className="inline-flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" /> WhatsApp business line (Mon–Sat, 8am–6pm EAT)
          </p>
        </div>
        <Link href="/portal/build" className="inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">
          Start a new inquiry
        </Link>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-gray-900">How the portal works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>Build an event inquiry with date, venue, guests, and menu packages.</li>
          <li>Our team builds your proposal (menu, rentals, staffing) and sends it for your acceptance.</li>
          <li>Accept the proposal to create an invoice, then pay the balance via M-Pesa.</li>
          <li>Pay via M-Pesa STK Push — full or partial amounts.</li>
          <li>Need a change? Open your booking to edit details or cancel (75% refund on paid amounts).</li>
        </ol>
      </Card>
    </div>
  )
}
