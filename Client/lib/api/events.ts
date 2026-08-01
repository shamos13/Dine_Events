import { apiClient } from './client'

export type EventStatus = 'INQUIRY' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'TENTATIVE'
export type EventResponse = {
  eventId: number
  eventName: string
  guestCount: number
  eventStatus: EventStatus
  eventVenue: string
  eventLocation: string | null
  specialRequests?: string | null
  eventDateTime: string
  eventEndDateTime: string | null
  createdAt?: string | null
  clientName: string | null
  clientPhone: string | null
  clientEmail: string | null
}
export type EventRequest = { eventName: string; guestCount: number; eventStatus: EventStatus; eventVenue: string; eventLocation?: string; eventDateTime: string; eventEndDateTime?: string; clientId: number }

export const getEvents = () => apiClient<EventResponse[]>('/event/all-events')
export const createEvent = (payload: EventRequest) => apiClient<EventResponse>('/event/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
