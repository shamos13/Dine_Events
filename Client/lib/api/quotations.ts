import { apiClient } from './client'
import type { InvoiceResponse } from './invoices'

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
export type LineItemType = 'MENU_PACKAGE' | 'RENTAL' | 'SERVICE' | 'STAFF' | 'OTHER'
export type QuotationLineItemResponse = { lineItemId: number; lineItemType: LineItemType; lineItemDescription: string; quantity: number; unitPriceAtQuotation: number; totalPrice: number }
export type QuotationResponse = { quotationId: number; quotationNumber: string; quotationName: string; eventId: number; eventName: string; clientName: string | null; clientPhone: string | null; clientEmail: string | null; subTotal: number; total: number; quotationStatus: QuotationStatus; validUntil: string; createdAt: string; lineItems: QuotationLineItemResponse[] }
export type QuotationRequest = { eventId: number; quotationName?: string; validUntil?: string }

export const getQuotations = () => apiClient<QuotationResponse[]>('/quotation/all-quotations')
export const createQuotation = (payload: QuotationRequest) => apiClient<QuotationResponse>('/quotation/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
export const sendQuotation = (quotationId: number) =>
  apiClient<QuotationResponse>(`/quotation/${quotationId}/send`, { method: 'PATCH' })
export const approveQuotation = (quotationId: number) => apiClient<InvoiceResponse>(`/quotation/${quotationId}/approve`, { method: 'PATCH' })
