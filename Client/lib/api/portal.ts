import { apiClient } from './client'
import type { EventResponse, EventStatus } from './events'
import type { MenuCategoryResponse, MenuPackageResponse } from './menu'

export type PortalProfile = {
  clientId: number
  firstName: string
  lastName: string | null
  fullName: string
  clientEmail: string
  clientPhone: string
  companyName: string | null
  profileImageUrl: string | null
  token?: string | null
  refreshToken?: string | null
}

export type PortalProfileUpdateRequest = {
  firstName: string
  lastName?: string
  clientEmail: string
  clientPhone: string
  companyName?: string
  profileImageUrl?: string | null
}

export type PortalPasswordChangeRequest = {
  currentPassword: string
  newPassword: string
}

export type PortalActivityItem = {
  type: string
  title: string
  description: string
  occurredAt: string | null
}

export type PortalDashboard = {
  clientName: string
  nextEvent: EventResponse | null
  totalBudget: number
  totalPaid: number
  totalOutstanding: number
  pendingInvoiceCount: number
  activity: PortalActivityItem[]
}

export type MenuSelection = {
  selectionId: number
  menuPackageId: number
  eventId: number
  eventName: string
  packageName: string
  serviceType: string | null
  minGuests: number | null
  guestCount: number
  pricePerPax: number
  menuItemNames: string[] | null
}

export type RentalAllocation = {
  allocationId: number
  eventId: number
  inventoryName: string
  eventName: string
  clientName: string | null
  pricingType: 'FLAT_RATE' | 'PER_UNIT'
  quantityAllocated: number
  unitPriceAtAllocation: number | null
  flatRate: number | null
  totalCost: number
}

export type QuotationLineItem = {
  lineItemId: number
  lineItemType: string
  lineItemDescription: string
  quantity: number
  unitPriceAtQuotation: number
  totalPrice: number
  includedMenuItemNames?: string[] | null
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'SUPERSEDED'

export type QuotationResponse = {
  quotationId: number
  quotationNumber: string
  quotationName: string
  eventId: number
  eventName: string
  clientName: string | null
  clientPhone: string | null
  clientEmail: string | null
  subTotal: number
  discountPercent?: number | null
  discountAmount?: number | null
  discountReason?: string | null
  total: number
  quotationStatus: QuotationStatus
  validUntil: string | null
  createdAt: string
  lineItems: QuotationLineItem[]
}

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'MPESA' | 'CASH' | 'BANK'

export type PaymentResponse = {
  paymentId: number
  invoiceNumber: string
  eventName?: string | null
  clientName?: string | null
  amount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  mpesaReceiptNumber: string | null
  checkoutRequestId?: string | null
  phoneNumber?: string | null
  failureReason?: string | null
  initiatedAt?: string | null
  completedAt?: string | null
}

/** Slim poll response from GET /portal/payments/{id}/status */
export type PaymentStatusResponse = {
  paymentStatus: PaymentStatus
  mpesaReceiptNumber: string | null
  receiptConfirmed?: boolean
  checkoutRequestId?: string | null
  failureReason?: string | null
}

export type InvoiceStatus = 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED'

export type InvoiceResponse = {
  invoiceId: number
  invoiceNumber: string
  eventId: number
  eventName: string
  clientName: string | null
  quotationId?: number | null
  amountDue: number
  amountPaid: number
  balance: number
  dueDate: string
  invoiceStatus: InvoiceStatus
  createdAt: string
  lineItems?: QuotationLineItem[] | null
  payments?: PaymentResponse[] | null
}

export type PortalEventDetail = {
  event: EventResponse & { specialRequests?: string | null; createdAt?: string | null }
  menuSelections: MenuSelection[]
  rentals: RentalAllocation[]
  quotations: QuotationResponse[]
  invoices: InvoiceResponse[]
}

export type PortalEventCreateRequest = {
  eventName: string
  guestCount: number
  eventVenue: string
  eventLocation?: string
  eventDateTime: string
  eventEndDateTime?: string
  specialRequests?: string
  menuPackageIds?: number[]
}

export type PortalPayRequest = {
  phoneNumber: string
  amount: number
}

export type PortalEventUpdateRequest = {
  eventName?: string
  guestCount?: number
  eventVenue?: string
  eventLocation?: string
  eventDateTime?: string
  eventEndDateTime?: string
  specialRequests?: string
  /** Replaces the current package selections when provided */
  menuPackageIds?: number[]
}

export type PortalCancellationResponse = {
  event: EventResponse
  totalPaid: number
  refundAmount: number
  refundReference: string | null
  message: string
}

export type FeedbackType = 'SUGGESTION' | 'COMPLAINT' | 'COMPLIMENT' | 'QUESTION'
export type FeedbackStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'

export type FeedbackResponse = {
  feedbackId: number
  clientId: number
  clientName: string
  clientEmail: string | null
  companyName: string | null
  feedbackType: FeedbackType
  subject: string
  message: string
  feedbackStatus: FeedbackStatus
  adminResponse: string | null
  createdAt: string
  resolvedAt: string | null
}

export type FeedbackRequest = {
  feedbackType: FeedbackType
  subject: string
  message: string
}

export const getPortalProfile = () => apiClient<PortalProfile>('/portal/me')

export const updatePortalProfile = (payload: PortalProfileUpdateRequest) =>
  apiClient<PortalProfile>('/portal/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export const changePortalPassword = (payload: PortalPasswordChangeRequest) =>
  apiClient<void>('/portal/me/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export const getPortalDashboard = () => apiClient<PortalDashboard>('/portal/dashboard')
export const getPortalEvents = () => apiClient<EventResponse[]>('/portal/events')
export const getPortalEvent = (eventId: number) => apiClient<PortalEventDetail>(`/portal/events/${eventId}`)
export const createPortalEvent = (payload: PortalEventCreateRequest) =>
  apiClient<PortalEventDetail>('/portal/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
export const updatePortalEvent = (eventId: number, payload: PortalEventUpdateRequest) =>
  apiClient<PortalEventDetail>(`/portal/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
export const cancelPortalEvent = (eventId: number) =>
  apiClient<PortalCancellationResponse>(`/portal/events/${eventId}/cancel`, { method: 'POST' })
export const submitPortalFeedback = (payload: FeedbackRequest) =>
  apiClient<FeedbackResponse>('/portal/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
export const getPortalFeedback = () => apiClient<FeedbackResponse[]>('/portal/feedback')
export const getPortalQuotations = () => apiClient<QuotationResponse[]>('/portal/quotations')
export const getPortalQuotation = (quotationId: number) =>
  apiClient<QuotationResponse>(`/portal/quotations/${quotationId}`)
export const acceptPortalQuotation = (quotationId: number) =>
  apiClient<InvoiceResponse>(`/portal/quotations/${quotationId}/accept`, { method: 'PATCH' })
export const declinePortalQuotation = (quotationId: number) =>
  apiClient<QuotationResponse>(`/portal/quotations/${quotationId}/decline`, { method: 'PATCH' })
export const getPortalInvoices = () => apiClient<InvoiceResponse[]>('/portal/invoices')
export const getPortalInvoice = (invoiceId: number) =>
  apiClient<InvoiceResponse>(`/portal/invoices/${invoiceId}`)
export const payPortalInvoice = (invoiceId: number, payload: PortalPayRequest) =>
  apiClient<PaymentResponse>(`/portal/invoices/${invoiceId}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
export const getPortalPaymentStatus = (paymentId: number) =>
  apiClient<PaymentStatusResponse>(`/portal/payments/${paymentId}/status`)

export const confirmPortalPaymentReceipt = (paymentId: number, mpesaReceiptNumber: string) =>
  apiClient<PaymentStatusResponse>(`/portal/payments/${paymentId}/receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mpesaReceiptNumber }),
  })
export const getPortalMenuPackages = () => apiClient<MenuPackageResponse[]>('/portal/menu/packages')
export const getPortalMenuCategories = () => apiClient<MenuCategoryResponse[]>('/portal/menu/categories')

export type { EventStatus }
