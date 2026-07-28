'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock, Copy, MapPin, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { createClient, getClients, type ClientRequest, type ClientResponse } from '@/lib/api/clients'
import { ApiError } from '@/lib/api/client'
import { createEvent, getEvents, type EventRequest, type EventResponse, type EventStatus } from '@/lib/api/events'

const statusStyles: Record<EventResponse['eventStatus'], string> = {
  CONFIRMED: 'bg-blue-100 text-blue-700',
  INQUIRY: 'bg-purple-100 text-purple-700',
  TENTATIVE: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-green-100 text-green-700',
}

const eventStatuses: { label: string; value: EventStatus }[] = [
  { label: 'Inquiry', value: 'INQUIRY' },
  { label: 'Tentative', value: 'TENTATIVE' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2)
  const minutes = index % 2 === 0 ? '00' : '30'
  const value = `${hours.toString().padStart(2, '0')}:${minutes}`
  return { value, label: formatTimeLabel(value) }
})

type WorkflowStep = 'select-client' | 'create-client' | 'event-details'

type ClientForm = {
  firstName: string
  lastName: string
  clientEmail: string
  clientPhone: string
  companyName: string
}

type EventForm = {
  eventName: string
  eventDate: string
  endDate: string
  startTime: string
  endTime: string
  guestCount: string
  eventVenue: string
  eventStatus: EventStatus
  eventLocation: string
}

const emptyClientForm: ClientForm = {
  firstName: '',
  lastName: '',
  clientEmail: '',
  clientPhone: '',
  companyName: '',
}

const emptyEventForm: EventForm = {
  eventName: '',
  eventDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  guestCount: '',
  eventVenue: '',
  eventStatus: 'INQUIRY',
  eventLocation: '',
}

export default function Events() {
  const router = useRouter()
  const autoOpened = useRef(false)
  const [events, setEvents] = useState<EventResponse[]>([])
  const [clients, setClients] = useState<ClientResponse[]>([])
  const [filter, setFilter] = useState('Upcoming')
  const [search, setSearch] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [clientsLoading, setClientsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [workflowOpen, setWorkflowOpen] = useState(false)
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('select-client')
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(null)
  const [clientForm, setClientForm] = useState<ClientForm>(emptyClientForm)
  const [eventForm, setEventForm] = useState<EventForm>(emptyEventForm)

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load events.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (autoOpened.current || typeof window === 'undefined') return
    if (new URLSearchParams(window.location.search).get('new') === '1') {
      autoOpened.current = true
      openWorkflow()
      router.replace('/events')
    }
  }, [router])

  const visibleEvents = useMemo(() => {
    const now = new Date()
    return events.filter((event) => {
      const matchesSearch = `${event.eventName} ${event.clientName ?? ''}`.toLowerCase().includes(search.toLowerCase())
      const eventDate = new Date(event.eventDateTime)
      const matchesFilter = filter === 'All' || (filter === 'Upcoming' ? eventDate >= now : eventDate < now)
      return matchesSearch && matchesFilter
    })
  }, [events, filter, search])

  const visibleClients = useMemo(() => {
    const query = clientSearch.toLowerCase()
    return clients.filter((client) =>
      `${client.fullName} ${client.companyName ?? ''} ${client.clientEmail ?? ''} ${client.clientPhone}`.toLowerCase().includes(query)
    )
  }, [clientSearch, clients])

  function openWorkflow() {
    setWorkflowOpen(true)
    setWorkflowStep('select-client')
    setSelectedClient(null)
    setClientSearch('')
    setModalError(null)
    if (clients.length === 0) {
      setClientsLoading(true)
      getClients()
        .then(setClients)
        .catch((reason: unknown) => setModalError(reason instanceof ApiError ? reason.message : 'Unable to load clients.'))
        .finally(() => setClientsLoading(false))
    }
  }

  function closeWorkflow() {
    if (saving) return
    setWorkflowOpen(false)
    setWorkflowStep('select-client')
    setSelectedClient(null)
    setModalError(null)
    setClientForm(emptyClientForm)
    setEventForm(emptyEventForm)
  }

  function chooseClient(client: ClientResponse) {
    setSelectedClient(client)
    setEventForm((current) => ({
      ...current,
      eventName: current.eventName || `${client.companyName || client.fullName} Event`,
    }))
    setWorkflowStep('event-details')
    setModalError(null)
  }

  async function handleCreateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setModalError(null)
    const payload: ClientRequest = {
      firstName: clientForm.firstName.trim(),
      lastName: clientForm.lastName.trim() || undefined,
      clientEmail: clientForm.clientEmail.trim() || undefined,
      clientPhone: clientForm.clientPhone.trim(),
      companyName: clientForm.companyName.trim() || undefined,
    }
    try {
      const client = await createClient(payload)
      setClients((current) => [client, ...current])
      chooseClient(client)
      setClientForm(emptyClientForm)
    } catch (reason) {
      setModalError(reason instanceof ApiError ? reason.message : 'Unable to create client.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedClient) return
    setSaving(true)
    setModalError(null)

    const guestCount = Number(eventForm.guestCount)
    if (!Number.isInteger(guestCount) || guestCount <= 0) {
      setModalError('Guest count must be a whole number greater than zero.')
      setSaving(false)
      return
    }

    const eventDateTime = new Date(`${eventForm.eventDate}T${eventForm.startTime}`)
    if (Number.isNaN(eventDateTime.getTime())) {
      setModalError('Please enter a valid event date and start time.')
      setSaving(false)
      return
    }

    const eventEndDate = eventForm.endDate || eventForm.eventDate
    const eventEndDateTime = eventForm.endTime ? new Date(`${eventEndDate}T${eventForm.endTime}`) : null
    if (eventEndDateTime && Number.isNaN(eventEndDateTime.getTime())) {
      setModalError('Please enter a valid event end date and end time.')
      setSaving(false)
      return
    }
    if (eventEndDateTime && eventEndDateTime < eventDateTime) {
      setModalError('Event end time cannot be before the start time.')
      setSaving(false)
      return
    }

    const payload: EventRequest = {
      eventName: eventForm.eventName.trim(),
      guestCount,
      eventStatus: eventForm.eventStatus,
      eventVenue: eventForm.eventVenue.trim(),
      eventLocation: eventForm.eventLocation.trim(),
      eventDateTime: eventDateTime.toISOString(),
      ...(eventEndDateTime ? { eventEndDateTime: eventEndDateTime.toISOString() } : {}),
      clientId: selectedClient.clientId,
    }

    try {
      const created = await createEvent(payload)
      setEvents((current) => [created, ...current])
      closeWorkflow()
      router.push(`/events/${created.eventId}`)
    } catch (reason) {
      setModalError(reason instanceof ApiError ? reason.message : 'Unable to create event.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 p-6">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600">Manage your catering events and schedules</p>
          </div>
          <button onClick={openWorkflow} className="flex items-center gap-2 rounded-lg bg-[#CC2622] px-6 py-3 font-medium text-white transition hover:bg-[#A01F1A]">
            <Plus className="h-4 w-4" />
            New event
          </button>
        </div>
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2">
              {['Upcoming', 'Past', 'All'].map((item) => (
                <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-4 py-2 font-medium transition ${filter === item ? 'bg-[#CC2622] text-white' : 'border border-gray-200 bg-white text-gray-700 hover:border-[#CC2622]'}`}>{item}</button>
              ))}
            </div>
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events by name or client..." className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-[#CC2622] focus:outline-none focus:ring-1 focus:ring-[#CC2622]" />
            </div>
          </div>
        </div>
        {loading ? (
          <p className="text-gray-600">Loading events...</p>
        ) : error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-blue-50">
                <tr>{['Name', 'Date', 'Client', 'Status', 'Guests', 'Actions'].map((item) => <th key={item} className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{item}</th>)}</tr>
              </thead>
              <tbody>
                {visibleEvents.map((event, index) => (
                  <tr key={event.eventId} className={`group hover:bg-red-50/30 ${index !== visibleEvents.length - 1 ? 'border-b border-gray-200' : ''}`}>
                    <td className="px-6 py-4 font-medium"><Link href={`/events/${event.eventId}`} className="text-gray-900 group-hover:text-[#CC2622] group-hover:underline">{event.eventName}</Link></td>
                    <td className="px-6 py-4 text-gray-600">{new Date(event.eventDateTime).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-[#CC2622]">{event.clientName ?? 'Unassigned client'}</td>
                    <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[event.eventStatus]}`}>{event.eventStatus}</span></td>
                    <td className="px-6 py-4 font-medium text-gray-900">{event.guestCount}</td>
                    <td className="flex items-center gap-2 px-6 py-4">
                      <button aria-label={`Duplicate ${event.eventName}`} className="rounded-lg p-2 transition hover:bg-gray-100"><Copy className="h-4 w-4 text-gray-600" /></button>
                      <button aria-label={`Delete ${event.eventName}`} className="rounded-lg p-2 transition hover:bg-gray-100"><Trash2 className="h-4 w-4 text-gray-600" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-200 px-6 py-4 text-sm text-gray-600">Showing {visibleEvents.length} of {events.length} events</div>
          </div>
        )}
      </main>
      <Footer />

      {workflowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6 backdrop-blur-sm">
          {workflowStep === 'select-client' && (
            <section role="dialog" aria-modal="true" aria-labelledby="new-event-client-title" className="flex max-h-[calc(100vh-3rem)] w-full max-w-[620px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
              <ModalHeader title="New event" subtitle="Select a client to continue" onClose={closeWorkflow} />
              <div className="overflow-y-auto border-t border-gray-200 bg-gray-50 px-8 py-7">
                <p className="mb-4 text-sm text-gray-600">Search for an existing client or create a new one to continue.</p>
                <div className="relative mb-5">
                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
                  <input value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder="Search..." className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-12 pr-4 text-gray-900 outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]" />
                </div>
                <button onClick={() => { setWorkflowStep('create-client'); setModalError(null) }} className="mb-6 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white font-medium text-gray-900 shadow-sm hover:border-[#CC2622] hover:text-[#CC2622]">
                  <Plus className="h-5 w-5" />
                  Create New
                </button>
                {modalError && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{modalError}</p>}
                {clientsLoading ? (
                  <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">Loading clients...</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-300 bg-white">
                    {visibleClients.length === 0 ? (
                      <p className="p-5 text-sm text-gray-600">No clients found.</p>
                    ) : (
                      visibleClients.map((client, index) => (
                        <button key={client.clientId} onClick={() => chooseClient(client)} className={`block w-full border-l-4 px-4 py-4 text-left transition hover:bg-red-50 ${index === 0 ? 'border-l-[#CC2622] bg-red-50/70' : 'border-l-transparent'} ${index !== visibleClients.length - 1 ? 'border-b border-gray-200' : ''}`}>
                          <span className={`block text-sm font-semibold ${index === 0 ? 'text-[#CC2622]' : 'text-gray-950'}`}>{client.companyName || client.fullName}</span>
                          <span className="mt-1 block text-sm text-gray-600">{client.fullName} {client.clientEmail ? `- ${client.clientEmail}` : ''}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {workflowStep === 'create-client' && (
            <section role="dialog" aria-modal="true" aria-labelledby="create-client-title" className="flex max-h-[calc(100vh-3rem)] w-full max-w-[620px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
              <ModalHeader title="Create client" subtitle="Add the client details for this event" onClose={closeWorkflow} />
              <form onSubmit={handleCreateClient} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto border-t border-gray-200 px-8 py-7">
                  {modalError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{modalError}</p>}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="First name" required value={clientForm.firstName} onChange={(value) => setClientForm((current) => ({ ...current, firstName: value }))} />
                    <Field label="Last name" value={clientForm.lastName} onChange={(value) => setClientForm((current) => ({ ...current, lastName: value }))} />
                  </div>
                  <Field label="Company name" value={clientForm.companyName} onChange={(value) => setClientForm((current) => ({ ...current, companyName: value }))} />
                  <Field label="Email" type="email" value={clientForm.clientEmail} onChange={(value) => setClientForm((current) => ({ ...current, clientEmail: value }))} />
                  <Field label="Phone number" required value={clientForm.clientPhone} onChange={(value) => setClientForm((current) => ({ ...current, clientPhone: value }))} />
                </div>
                <ModalFooter onCancel={() => setWorkflowStep('select-client')} submitLabel="Continue" saving={saving} />
              </form>
            </section>
          )}

          {workflowStep === 'event-details' && selectedClient && (
            <section role="dialog" aria-modal="true" aria-labelledby="new-event-title" className="flex max-h-[calc(100vh-3rem)] w-full max-w-[700px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
              <ModalHeader title="New event" subtitle={selectedClient.companyName || selectedClient.fullName} onClose={closeWorkflow} />
              <form onSubmit={handleCreateEvent} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto border-t border-gray-200 px-8 py-7">
                  {modalError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{modalError}</p>}
                  <Field label="Name" required helper="Enter the full name of this event" value={eventForm.eventName} onChange={(value) => setEventForm((current) => ({ ...current, eventName: value }))} />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <DatePicker label="Event date" required value={eventForm.eventDate} onChange={(value) => setEventForm((current) => ({ ...current, eventDate: value, endDate: current.endDate && current.endDate < value ? '' : current.endDate }))} />
                    <TimePicker label="Start time" required value={eventForm.startTime} onChange={(value) => setEventForm((current) => ({ ...current, startTime: value }))} />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <DatePicker label="End date" helper="Optional. Defaults to the event date." value={eventForm.endDate} onChange={(value) => setEventForm((current) => ({ ...current, endDate: value }))} minDate={eventForm.eventDate || undefined} />
                    <TimePicker label="End time" helper="Leave blank for events with no end time" value={eventForm.endTime} onChange={(value) => setEventForm((current) => ({ ...current, endTime: value }))} allowEmpty />
                  </div>
                  <Field label="Venue" required helper="Where this event will be hosted" value={eventForm.eventVenue} onChange={(value) => setEventForm((current) => ({ ...current, eventVenue: value }))} />
                  <Field label="Guest Count" required type="number" helper="Number of guests expected to attend" value={eventForm.guestCount} onChange={(value) => setEventForm((current) => ({ ...current, guestCount: value }))} />
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-gray-950">Status <span className="text-[#CC2622]">*</span></span>
                    <select value={eventForm.eventStatus} onChange={(event) => setEventForm((current) => ({ ...current, eventStatus: event.target.value as EventStatus }))} className="h-12 w-full rounded-md border border-gray-300 bg-white px-4 text-gray-900 outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]">
                      {eventStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
                    <span className="mt-2 block text-sm text-gray-600">Current status of this event</span>
                  </label>
                  <LocationField value={eventForm.eventLocation} onChange={(value) => setEventForm((current) => ({ ...current, eventLocation: value }))} />
                </div>
                <ModalFooter onCancel={() => setWorkflowStep('select-client')} submitLabel="Save" saving={saving} />
              </form>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function ModalHeader({ title, subtitle, onClose, className = '' }: { title: string; subtitle: string; onClose: () => void; className?: string }) {
  return (
    <div className={`flex items-start justify-between bg-white px-8 py-7 ${className}`}>
      <div>
        <h2 className="text-3xl font-bold tracking-normal text-slate-950">{title}</h2>
        <p className="mt-2 text-base text-gray-600">{subtitle}</p>
      </div>
      <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900">
        <X className="h-6 w-6" />
      </button>
    </div>
  )
}

function ModalFooter({ onCancel, submitLabel, saving }: { onCancel: () => void; submitLabel: string; saving: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-8 py-6">
      <button type="button" onClick={onCancel} disabled={saving} className="rounded-md border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-60">Cancel</button>
      <button type="submit" disabled={saving} className="rounded-md bg-[#EE3026] px-7 py-2.5 font-semibold text-white shadow-sm hover:bg-[#CC2622] disabled:opacity-60">{saving ? 'Saving...' : submitLabel}</button>
    </div>
  )
}

function DatePicker({ label, value, onChange, required = false, helper, minDate }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; helper?: string; minDate?: string }) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseDateValue(value)
  const today = startOfDay(new Date())
  const minimumDate = parseDateValue(minDate ?? '') ?? today
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? new Date())
  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ]

  function moveMonth(direction: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1))
  }

  function selectDate(date: Date) {
    if (isBeforeDay(date, minimumDate)) return
    onChange(formatDateValue(date))
    setVisibleMonth(date)
    setOpen(false)
  }

  return (
    <div className="relative">
      <span className="mb-2 block text-sm font-semibold text-gray-950">{label}{required && <span className="text-[#CC2622]">*</span>}</span>
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-12 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 text-left text-gray-900 outline-none transition hover:border-[#CC2622] focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]">
        <span>{selectedDate ? selectedDate.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'Select date'}</span>
        <CalendarDays className="h-5 w-5 text-gray-500" />
      </button>
      {helper && <span className="mt-2 block text-sm text-gray-600">{helper}</span>}
      {open && (
        <div className="absolute z-20 mt-2 w-full min-w-[300px] rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => moveMonth(-1)} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Prev</button>
            <p className="font-semibold text-gray-950">{visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
            <button type="button" onClick={() => moveMonth(1)} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Next</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="py-1">{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((date, index) => {
              const selected = date && value === formatDateValue(date)
              const today = date && formatDateValue(date) === formatDateValue(new Date())
              const disabled = date ? isBeforeDay(date, minimumDate) : false
              return date ? (
                <button key={date.toISOString()} type="button" disabled={disabled} onClick={() => selectDate(date)} className={`aspect-square rounded-md text-sm font-medium transition ${disabled ? 'cursor-not-allowed text-gray-300' : selected ? 'bg-[#CC2622] text-white' : today ? 'bg-red-50 text-[#CC2622] hover:bg-red-100' : 'text-gray-800 hover:bg-gray-100'}`}>
                  {date.getDate()}
                </button>
              ) : (
                <span key={`blank-${index}`} />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TimePicker({ label, value, onChange, required = false, helper, allowEmpty = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; helper?: string; allowEmpty?: boolean }) {
  const [open, setOpen] = useState(false)
  const [customTime, setCustomTime] = useState(value)
  const selectedLabel = value ? formatTimeLabel(value) : allowEmpty ? '--:-- --' : 'Select time'

  useEffect(() => {
    setCustomTime(value)
  }, [value])

  function applyCustomTime() {
    if (!customTime) return
    onChange(customTime)
    setOpen(false)
  }

  return (
    <div className="relative">
      <span className="mb-2 block text-sm font-semibold text-gray-950">{label}{required && <span className="text-[#CC2622]">*</span>}</span>
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-12 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 text-left text-gray-900 outline-none transition hover:border-[#CC2622] focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]">
        <span>{selectedLabel}</span>
        <Clock className="h-5 w-5 text-gray-500" />
      </button>
      {helper && <span className="mt-2 block text-sm text-gray-600">{helper}</span>}
      {open && (
        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
          <div className="sticky top-0 z-10 border-b border-gray-100 bg-white p-2">
            <label className="block text-xs font-semibold uppercase text-gray-500">Custom time</label>
            <div className="mt-2 flex gap-2">
              <input type="time" value={customTime} onChange={(event) => setCustomTime(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]" />
              <button type="button" onClick={applyCustomTime} className="rounded-md bg-[#CC2622] px-3 text-sm font-semibold text-white hover:bg-[#A01F1A]">Set</button>
            </div>
          </div>
          {allowEmpty && (
            <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50">No end time</button>
          )}
          {timeOptions.map((option) => (
            <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false) }} className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${value === option.value ? 'bg-red-50 text-[#CC2622]' : 'text-gray-800 hover:bg-gray-50'}`}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, required = false, type = 'text', helper, icon }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; helper?: string; icon?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-950">{label} {required && <span className="text-[#CC2622]">*</span>}</span>
      <div className="relative">
        <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={`h-12 w-full rounded-md border border-gray-300 bg-white px-4 text-gray-900 outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622] ${icon ? 'pr-12' : ''}`} />
        {icon && <span className="pointer-events-none absolute right-4 top-3.5">{icon}</span>}
      </div>
      {helper && <span className="mt-2 block text-sm text-gray-600">{helper}</span>}
    </label>
  )
}

function LocationField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-950">Event location <span className="text-[#CC2622]">*</span></span>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
        <input
          required
          type="text"
          inputMode="text"
          autoComplete="street-address"
          placeholder="Street address, building, neighborhood, city"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-md border border-gray-300 bg-white px-4 pl-12 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
        />
      </div>
      <span className="mt-2 block text-sm text-gray-600">Use a complete address or recognizable venue location for logistics and delivery planning.</span>
    </label>
  )
}

function parseDateValue(value: string) {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isBeforeDay(date: Date, minimumDate: Date) {
  return startOfDay(date).getTime() < startOfDay(minimumDate).getTime()
}

function formatTimeLabel(value: string) {
  const [hourPart, minutePart] = value.split(':')
  const hour = Number(hourPart)
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutePart} ${period}`
}
