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
  discountPercent?: number | null
  discountReason?: string | null
  eventDateTime: string
  eventEndDateTime: string | null
  createdAt?: string | null
  clientName: string | null
  clientPhone: string | null
  clientEmail: string | null
}
export type EventRequest = { eventName: string; guestCount: number; eventStatus: EventStatus; eventVenue: string; eventLocation?: string; eventDateTime: string; eventEndDateTime?: string; clientId: number }
export type EventDiscountUpdateRequest = {
  discountPercent: number
  discountReason?: string | null
}

export const EVENT_STATUSES: EventStatus[] = ['INQUIRY', 'TENTATIVE', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

export const getEvents = () => apiClient<EventResponse[]>('/event/all-events')
export const getEvent = (eventId: number) => apiClient<EventResponse>(`/event/${eventId}`)
export const createEvent = (payload: EventRequest) =>
  apiClient<EventResponse>('/event/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
export const updateEventStatus = (eventId: number, eventStatus: EventStatus) =>
  apiClient<EventResponse>(`/event/${eventId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventStatus }),
  })
export const updateEventDiscount = (eventId: number, payload: EventDiscountUpdateRequest) =>
  apiClient<EventResponse>(`/event/${eventId}/discount`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
