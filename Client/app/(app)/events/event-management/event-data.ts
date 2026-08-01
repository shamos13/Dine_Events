import type { EventResponse, EventStatus } from '@/lib/api/events'

export type EventRecord = {
  id: number
  name: string
  date: string
  dateTime: string
  endDateTime: string | null
  client: string
  email: string
  phone: string | null
  guests: number
  venue: string
  location: string
  specialRequests: string | null
  status: EventStatus
  statusStyle: string
}

function statusStyle(status: EventStatus): string {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-700'
    case 'TENTATIVE':
      return 'bg-orange-100 text-orange-700'
    case 'CANCELLED':
      return 'bg-red-100 text-red-700'
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700'
    case 'INQUIRY':
    default:
      return 'bg-purple-100 text-purple-700'
  }
}

export function toEventRecord(event: EventResponse): EventRecord {
  const dateTime = new Date(event.eventDateTime)
  const endDateTime = event.eventEndDateTime ? new Date(event.eventEndDateTime) : null
  return {
    id: event.eventId,
    name: event.eventName,
    date: dateTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    dateTime: dateTime.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }),
    endDateTime: endDateTime
      ? endDateTime.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
      : null,
    client: event.clientName ?? 'Unassigned client',
    email: event.clientEmail ?? '',
    phone: event.clientPhone ?? null,
    guests: event.guestCount,
    venue: event.eventVenue,
    location: event.eventLocation ?? '',
    specialRequests: event.specialRequests ?? null,
    status: event.eventStatus,
    statusStyle: statusStyle(event.eventStatus),
  }
}
