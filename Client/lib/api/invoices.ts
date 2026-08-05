import { apiClient } from './client'

export type InvoiceStatus = 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED'
export type InvoiceResponse = {
  invoiceId: number
  invoiceNumber: string
  eventId: number
  eventName: string
  clientName: string | null
  clientPhone?: string | null
  quotationId?: number | null
  amountDue: number
  amountPaid: number
  balance: number
  dueDate: string
  invoiceStatus: InvoiceStatus
  createdAt: string
  lineItems?: Array<{
    lineItemId: number
    lineItemType: string
    lineItemDescription: string
    quantity: number
    unitPriceAtQuotation: number
    totalPrice: number
    includedMenuItemNames?: string[] | null
  }> | null
  payments?: Array<{
    paymentId: number
    amount: number
    paymentMethod: string
    paymentStatus: string
    mpesaReceiptNumber?: string | null
    checkoutRequestId?: string | null
    initiatedAt?: string | null
    completedAt?: string | null
  }> | null
}

export const getInvoices = () => apiClient<InvoiceResponse[]>('/invoice/all-invoices')
export const getInvoice = (invoiceId: number) => apiClient<InvoiceResponse>(`/invoice/${invoiceId}`)
