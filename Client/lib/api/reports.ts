import { apiClient } from './client'
import type { EventResponse } from './events'
import type { PaymentResponse } from './portal'

export type MonthlyFinancialEntry = {
  month: string
  collected: number
  refunded: number
  net: number
  paymentCount: number
}

export type FinancialReport = {
  totalRevenue: number
  totalRefunded: number
  totalOutstanding: number
  totalInvoiced: number
  invoiceCount: number
  paidInvoiceCount: number
  monthly: MonthlyFinancialEntry[]
  payments: PaymentResponse[]
}

export type MonthlyCountEntry = {
  month: string
  count: number
  guests: number
}

export type EventsReport = {
  totalEvents: number
  statusCounts: Record<string, number>
  upcomingCount: number
  totalGuests: number
  monthly: MonthlyCountEntry[]
  events: EventResponse[]
}

export type TopClientEntry = {
  clientId: number
  clientName: string
  companyName: string | null
  clientEmail: string | null
  eventCount: number
  totalPaid: number
}

export type ClientsReport = {
  totalClients: number
  openFeedbackCount: number
  inProgressFeedbackCount: number
  resolvedFeedbackCount: number
  topClients: TopClientEntry[]
}

export const getFinancialReport = () => apiClient<FinancialReport>('/reports/financial')
export const getEventsReport = () => apiClient<EventsReport>('/reports/events')
export const getClientsReport = () => apiClient<ClientsReport>('/reports/clients')
