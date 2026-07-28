import type { EventResponse } from '@/lib/api/events'

export type EventRecord = { id: number; name: string; date: string; dateTime: string; client: string; email: string; guests: number; venue: string; location: string; status: string; statusStyle: string }

export function toEventRecord(event: EventResponse): EventRecord {
  const dateTime = new Date(event.eventDateTime)
  return {
    id: event.eventId,
    name: event.eventName,
    date: dateTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    dateTime: dateTime.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }),
    client: event.clientName ?? 'Unassigned client',
    email: event.clientEmail ?? '',
    guests: event.guestCount,
    venue: event.eventVenue,
    location: event.eventLocation ?? '',
    status: event.eventStatus,
    statusStyle: event.eventStatus === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : event.eventStatus === 'TENTATIVE' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700',
  }
}
