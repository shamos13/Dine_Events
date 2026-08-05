import { apiClient } from './client'

export type EventSummary = {
  eventId: number
  eventName: string
  eventVenue: string
  guestCount: number
  eventDateTime: string
}

export type ClientResponse = {
  clientId: number
  fullName: string
  clientEmail: string | null
  clientPhone: string
  companyName: string | null
  profileImageUrl: string | null
  events: EventSummary[] | null
}

export type ClientRequest = {
  firstName: string
  lastName?: string
  clientEmail?: string
  clientPhone: string
  companyName?: string
  profileImageUrl?: string
}

export const getClients = () => apiClient<ClientResponse[]>('/client/all-clients')

export const createClient = (payload: ClientRequest) =>
  apiClient<ClientResponse>('/client/save-client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
