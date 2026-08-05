import { apiClient } from './client'

export type MessageSender = 'CLIENT' | 'ADMIN'
export type MessageKind = 'GENERAL' | 'QUOTATION_FLAG'

export type EventMessage = {
  messageId: number
  eventId: number
  quotationId: number | null
  quotationNumber: string | null
  sender: MessageSender
  messageKind: MessageKind
  body: string
  readByAdmin: boolean
  readByClient: boolean
  createdAt: string
}

export type EventMessageRequest = {
  body: string
  quotationId?: number
  messageKind?: MessageKind
}

export type EventUnreadCount = {
  eventId: number
  unreadCount: number
}

export const getEventMessages = (eventId: number) =>
  apiClient<EventMessage[]>(`/events/${eventId}/messages`)

export const postEventMessage = (eventId: number, payload: EventMessageRequest) =>
  apiClient<EventMessage>(`/events/${eventId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export const getEventUnreadCount = (eventId: number) =>
  apiClient<EventUnreadCount>(`/events/${eventId}/messages/unread-count`)

export const markEventMessagesRead = (eventId: number) =>
  apiClient<EventUnreadCount>(`/events/${eventId}/messages/mark-read`, { method: 'POST' })

export const getPortalEventMessages = (eventId: number) =>
  apiClient<EventMessage[]>(`/portal/events/${eventId}/messages`)

export const postPortalEventMessage = (eventId: number, payload: EventMessageRequest) =>
  apiClient<EventMessage>(`/portal/events/${eventId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
