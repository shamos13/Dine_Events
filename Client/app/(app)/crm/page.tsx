'use client'

import Image from 'next/image'
import { MessageSquareText, Search, UserPlus, UserRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import ImageUpload from '@/components/ui/ImageUpload'
import { Modal } from '@/components/ui/modal'
import { StatusPill } from '@/components/ui/status-pill'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api/client'
import { createClient, getClients, type ClientResponse } from '@/lib/api/clients'
import { getAllFeedback, updateFeedback, type FeedbackResponse } from '@/lib/api/feedback'

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  clientEmail: '',
  clientPhone: '',
  companyName: '',
  profileImageUrl: null as string | null,
}

export default function Crm() {
  const { toast } = useToast()
  const [tab, setTab] = useState<'clients' | 'feedback'>('clients')
  const [clients, setClients] = useState<ClientResponse[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [feedback, setFeedback] = useState<FeedbackResponse[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(true)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [respondTarget, setRespondTarget] = useState<FeedbackResponse | null>(null)
  const [responseText, setResponseText] = useState('')
  const [respondSaving, setRespondSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getClients()
      .then(setClients)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load clients.')
      )
      .finally(() => setLoading(false))
  }, [])

  const loadFeedback = useCallback(() => {
    setFeedbackLoading(true)
    setFeedbackError(null)
    getAllFeedback()
      .then(setFeedback)
      .catch((reason: unknown) =>
        setFeedbackError(reason instanceof ApiError ? reason.message : 'Unable to load feedback.')
      )
      .finally(() => setFeedbackLoading(false))
  }, [])

  useEffect(() => {
    load()
    loadFeedback()
  }, [load, loadFeedback])

  const openFeedbackCount = useMemo(
    () => feedback.filter((item) => item.feedbackStatus !== 'RESOLVED').length,
    [feedback]
  )

  const setStatus = async (item: FeedbackResponse, status: FeedbackResponse['feedbackStatus']) => {
    try {
      const updated = await updateFeedback(item.feedbackId, { feedbackStatus: status })
      setFeedback((current) =>
        current.map((entry) => (entry.feedbackId === updated.feedbackId ? updated : entry))
      )
      toast(`Feedback marked ${status.replaceAll('_', ' ').toLowerCase()}.`, 'success')
    } catch (reason: unknown) {
      toast(reason instanceof ApiError ? reason.message : 'Unable to update feedback.', 'error')
    }
  }

  const openRespond = (item: FeedbackResponse) => {
    setRespondTarget(item)
    setResponseText(item.adminResponse ?? '')
  }

  const saveResponse = async () => {
    if (!respondTarget) return
    setRespondSaving(true)
    try {
      const updated = await updateFeedback(respondTarget.feedbackId, {
        adminResponse: responseText.trim(),
        feedbackStatus: 'RESOLVED',
      })
      setFeedback((current) =>
        current.map((entry) => (entry.feedbackId === updated.feedbackId ? updated : entry))
      )
      setRespondTarget(null)
      toast('Response sent and feedback resolved.', 'success')
    } catch (reason: unknown) {
      toast(reason instanceof ApiError ? reason.message : 'Unable to save response.', 'error')
    } finally {
      setRespondSaving(false)
    }
  }

  const visibleClients = useMemo(
    () =>
      clients.filter((client) =>
        `${client.fullName} ${client.companyName ?? ''} ${client.clientEmail ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [clients, search]
  )

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFieldErrors({})
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setIsSaving(true)
    try {
      const created = await createClient({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        clientEmail: form.clientEmail.trim() || undefined,
        clientPhone: form.clientPhone.trim(),
        companyName: form.companyName.trim() || undefined,
        profileImageUrl: form.profileImageUrl || undefined,
      })
      setClients((current) => [...current, created])
      toast(`${created.companyName || created.fullName} added.`, 'success')
      closeModal()
    } catch (reason: unknown) {
      if (reason instanceof ApiError) {
        setFieldErrors(reason.fieldErrors ?? {})
        setFormError(reason.message)
      } else {
        setFormError('Unable to add client. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass =
    'h-11 w-full rounded-lg border border-gray-200 bg-[#F7F8FC] px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#CC2622] focus:bg-white focus:ring-2 focus:ring-[#CC2622]/15'

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">CRM</h1>
            <p className="text-gray-600">Manage client relationships, suggestions and complaints</p>
          </div>
          {tab === 'clients' && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[#CC2622] px-6 py-3 font-medium text-white hover:bg-[#A01F1A]"
            >
              <UserPlus className="h-4 w-4" />
              Add Client
            </button>
          )}
        </div>

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('clients')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === 'clients' ? 'bg-[#CC2622] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Clients
          </button>
          <button
            type="button"
            onClick={() => setTab('feedback')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === 'feedback' ? 'bg-[#CC2622] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MessageSquareText className="h-4 w-4" />
            Feedback
            {openFeedbackCount > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  tab === 'feedback' ? 'bg-white text-[#CC2622]' : 'bg-[#CC2622] text-white'
                }`}
              >
                {openFeedbackCount}
              </span>
            )}
          </button>
        </div>

        {tab === 'feedback' ? (
          feedbackLoading ? (
            <p className="text-gray-600">Loading feedback...</p>
          ) : feedbackError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {feedbackError}
            </p>
          ) : feedback.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
              No feedback yet. Client suggestions and complaints submitted through the portal will appear here.
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div key={item.feedbackId} className="rounded-lg border border-gray-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">{item.subject}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.clientName}
                        {item.companyName ? ` · ${item.companyName}` : ''}
                        {item.clientEmail ? ` · ${item.clientEmail}` : ''}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={item.feedbackType} className="bg-gray-100 text-gray-700" />
                      <StatusPill status={item.feedbackStatus} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-700">{item.message}</p>
                  {item.adminResponse && (
                    <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-gray-800">
                      <span className="font-semibold">Your response:</span> {item.adminResponse}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.feedbackStatus === 'OPEN' && (
                      <button
                        type="button"
                        onClick={() => setStatus(item, 'IN_PROGRESS')}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Mark in progress
                      </button>
                    )}
                    {item.feedbackStatus !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => openRespond(item)}
                        className="rounded-lg bg-[#CC2622] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#A01F1A]"
                      >
                        Respond & resolve
                      </button>
                    )}
                    {item.feedbackStatus === 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => setStatus(item, 'OPEN')}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <>
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search clients..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#CC2622]"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading clients...</p>
        ) : error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-blue-50">
                <tr>
                  {['Client', 'Email', 'Phone', 'Events'].map((item) => (
                    <th key={item} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleClients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      {clients.length === 0 ? 'No clients yet. Add your first one.' : 'No clients match your search.'}
                    </td>
                  </tr>
                )}
                {visibleClients.map((client, index) => (
                  <tr
                    key={client.clientId}
                    className={index !== visibleClients.length - 1 ? 'border-b border-gray-200' : ''}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-[#edf4ff]">
                          {client.profileImageUrl ? (
                            <Image
                              src={client.profileImageUrl}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#CC2622]">
                              <UserRound className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {client.companyName || client.fullName}
                          </p>
                          {client.companyName && (
                            <p className="text-xs text-gray-500">{client.fullName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{client.clientEmail ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{client.clientPhone}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{client.events?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}
      </main>
      <Footer />

      <Modal
        isOpen={respondTarget !== null}
        onClose={() => setRespondTarget(null)}
        title={`Respond to ${respondTarget?.clientName ?? 'client'}`}
        size="lg"
      >
        <div className="space-y-4">
          {respondTarget && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">{respondTarget.subject}</p>
              <p className="mt-1">{respondTarget.message}</p>
            </div>
          )}
          <div>
            <label htmlFor="admin-response" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-900">
              Your response
            </label>
            <textarea
              id="admin-response"
              autoFocus
              className="min-h-28 w-full rounded-lg border border-gray-200 bg-[#F7F8FC] p-3 text-sm text-gray-900 outline-none transition focus:border-[#CC2622] focus:bg-white focus:ring-2 focus:ring-[#CC2622]/15"
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              placeholder="Thanks for the feedback — here's what we'll do…"
            />
            <p className="mt-1.5 text-xs text-gray-500">The client sees this reply on their Help &amp; support page.</p>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setRespondTarget(null)}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={respondSaving || !responseText.trim()}
              onClick={saveResponse}
              className="rounded-lg bg-[#CC2622] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A01F1A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {respondSaving ? 'Sending…' : 'Send & resolve'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Add Client" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload
            value={form.profileImageUrl}
            onChange={(url) => setForm((current) => ({ ...current, profileImageUrl: url }))}
            folder="clients"
            label="Profile photo"
            shape="circle"
            helperText="Optional. Clients can also update this photo from the portal."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-900">
                First name
              </label>
              <input id="firstName" name="firstName" required value={form.firstName} onChange={handleChange} placeholder="Sarah" className={inputClass} />
              {fieldErrors.firstName && <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-900">
                Last name
              </label>
              <input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Jenkins" className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="clientPhone" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-900">
              Phone
            </label>
            <input id="clientPhone" name="clientPhone" type="tel" required value={form.clientPhone} onChange={handleChange} placeholder="07XXXXXXXX" className={inputClass} />
            {fieldErrors.clientPhone && <p className="mt-1 text-xs text-red-600">{fieldErrors.clientPhone}</p>}
          </div>

          <div>
            <label htmlFor="clientEmail" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-900">
              Email <span className="font-normal normal-case text-gray-400">(optional)</span>
            </label>
            <input id="clientEmail" name="clientEmail" type="email" value={form.clientEmail} onChange={handleChange} placeholder="sarah@example.com" className={inputClass} />
            {fieldErrors.clientEmail && <p className="mt-1 text-xs text-red-600">{fieldErrors.clientEmail}</p>}
            <p className="mt-1.5 text-xs text-gray-500">
              If they later sign up for the client portal with this email, their account links to this record automatically.
            </p>
          </div>

          <div>
            <label htmlFor="companyName" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-900">
              Company / organization <span className="font-normal normal-case text-gray-400">(optional)</span>
            </label>
            <input id="companyName" name="companyName" value={form.companyName} onChange={handleChange} placeholder="Jenkins Family" className={inputClass} />
          </div>

          {formError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-[#CC2622] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A01F1A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Add Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
