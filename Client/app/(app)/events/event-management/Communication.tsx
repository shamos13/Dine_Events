'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, MessageSquare, Send } from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import {
  getEventMessages,
  markEventMessagesRead,
  postEventMessage,
  type EventMessage,
} from '@/lib/api/communication'
import type { EventRecord } from './event-data'
import { Panel, SectionHeading } from './components'

/** True when the latest thread message is from the client (admin still owes a reply). */
export function awaitingAdminReply(messages: EventMessage[]) {
  if (messages.length === 0) return false
  return messages[messages.length - 1].sender === 'CLIENT'
}

export default function Communication({
  event,
  onUnreadChange,
  onAwaitingReplyChange,
}: {
  event: EventRecord
  onUnreadChange?: (count: number) => void
  onAwaitingReplyChange?: (awaiting: boolean) => void
}) {
  const [messages, setMessages] = useState<EventMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const markedRead = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEventMessages(event.id)
      setMessages(data)
      const unread = data.filter((message) => message.sender === 'CLIENT' && !message.readByAdmin).length
      onUnreadChange?.(unread)
      onAwaitingReplyChange?.(awaitingAdminReply(data))
      if (unread > 0 && !markedRead.current) {
        markedRead.current = true
        await markEventMessagesRead(event.id)
        onUnreadChange?.(0)
        setMessages((current) =>
          current.map((message) =>
            message.sender === 'CLIENT' ? { ...message, readByAdmin: true } : message
          )
        )
      }
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load messages.')
    } finally {
      setLoading(false)
    }
  }, [event.id, onUnreadChange, onAwaitingReplyChange])

  useEffect(() => {
    markedRead.current = false
    void load()
  }, [load])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const onSend = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault()
    if (!body.trim()) return
    setSending(true)
    setError(null)
    try {
      const created = await postEventMessage(event.id, { body: body.trim(), messageKind: 'GENERAL' })
      setMessages((current) => [...current, created])
      onAwaitingReplyChange?.(false)
      setBody('')
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Panel className="p-0">
      <div className="border-b border-[#efb6b0] p-6">
        <SectionHeading
          title="Communication"
          subtitle={`Client correspondence for ${event.name}. Quotation flags from the portal appear here.`}
        />
        {awaitingAdminReply(messages) && (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Client is waiting for a reply on the latest message.
          </p>
        )}
      </div>

      <div className="flex min-h-[420px] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading messages...
            </div>
          ) : error ? (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : messages.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center text-slate-600">
              <MessageSquare className="h-10 w-10 text-[#cc2622]" />
              <p className="mt-3 text-sm font-medium">No messages yet</p>
              <p className="mt-1 max-w-sm text-sm">
                When the client flags a quotation or sends a note, it will show up in this thread.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const fromAdmin = message.sender === 'ADMIN'
              return (
                <div
                  key={message.messageId}
                  className={`flex ${fromAdmin ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                      fromAdmin
                        ? 'bg-[#cc2622] text-white'
                        : 'border border-[#efb6b0] bg-[#edf4ff] text-slate-900'
                    }`}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
                      <span>{fromAdmin ? 'You' : 'Client'}</span>
                      {message.messageKind === 'QUOTATION_FLAG' && (
                        <span className={fromAdmin ? 'text-white/90' : 'text-amber-800'}>
                          Quotation flag
                          {message.quotationNumber ? ` · ${message.quotationNumber}` : ''}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap leading-6">{message.body}</p>
                    <p className={`mt-2 text-[11px] ${fromAdmin ? 'text-white/70' : 'text-slate-500'}`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={onSend} className="border-t border-[#efb6b0] bg-white p-4">
          <div className="flex gap-3">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={2}
              placeholder="Reply to the client..."
              className="min-h-[44px] flex-1 resize-y rounded-md border border-[#efb6b0] px-3 py-2 text-sm outline-none focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20"
            />
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="inline-flex h-11 shrink-0 items-center gap-2 self-end rounded-md bg-[#cc2622] px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </div>
        </form>
      </div>
    </Panel>
  )
}

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
