import { apiClient } from './client'

export type InvoiceStatus = 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED'
export type InvoiceResponse = { invoiceId: number; invoiceNumber: string; eventId: number; eventName: string; clientName: string | null; amountDue: number; amountPaid: number; balance: number; dueDate: string; invoiceStatus: InvoiceStatus; createdAt: string }

export const getInvoices = () => apiClient<InvoiceResponse[]>('/invoice/all-invoices')
export const getInvoice = (invoiceId: number) => apiClient<InvoiceResponse>(`/invoice/${invoiceId}`)
