import { apiClient } from './client'
import type { FinancialReport } from './reports'

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'MPESA' | 'CASH' | 'BANK'

export type AdminPaymentResponse = {
  paymentId: number
  invoiceNumber: string
  eventName?: string | null
  clientName: string | null
  amount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  mpesaReceiptNumber: string | null
  initiatedAt?: string | null
  completedAt?: string | null
}

export type AdminPaymentStatusResponse = {
  paymentStatus: PaymentStatus
  mpesaReceiptNumber: string | null
  receiptConfirmed?: boolean
  checkoutRequestId?: string | null
  failureReason?: string | null
}

export type AdminPaymentInitiateResponse = {
  paymentId: number
  checkoutRequestId: string
  customerMessage: string | null
}

export type AdminPaymentRequest = {
  phoneNumber?: string
  amount?: number
}

export type RevenueSummary = {
  totalRevenue: number
  monthRevenue: number
  totalOutstanding: number
  totalRefunded: number
  successfulPaymentsCount: number
  pendingPaymentsCount: number
  refundedPaymentsCount: number
}

export const requestInvoicePayment = (invoiceId: number, payload: AdminPaymentRequest = {}) =>
  apiClient<AdminPaymentInitiateResponse>('/payments/mpesa/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoiceId,
      phoneNumber: payload.phoneNumber,
      amount: payload.amount,
    }),
  })

export const getAdminPaymentStatus = (paymentId: number) =>
  apiClient<AdminPaymentStatusResponse>(`/payments/${paymentId}/status`)

export const getRecentPayments = (_limit = 8) =>
  apiClient<AdminPaymentResponse[]>('/payments/recent')

/** Maps the financial report into the compact dashboard revenue card shape. */
export async function getRevenueSummary(): Promise<RevenueSummary> {
  const report = await apiClient<FinancialReport>('/reports/financial')
  const payments = report.payments ?? []
  const latestMonth = report.monthly?.[report.monthly.length - 1]
  return {
    totalRevenue: Number(report.totalRevenue ?? 0),
    monthRevenue: Number(latestMonth?.collected ?? 0),
    totalOutstanding: Number(report.totalOutstanding ?? 0),
    totalRefunded: Number(report.totalRefunded ?? 0),
    successfulPaymentsCount: payments.filter((p) => p.paymentStatus === 'COMPLETED').length,
    pendingPaymentsCount: payments.filter((p) => p.paymentStatus === 'PENDING').length,
    refundedPaymentsCount: payments.filter((p) => p.paymentStatus === 'REFUNDED').length,
  }
}

export async function waitForAdminPaymentResult(
  paymentId: number,
  options: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<AdminPaymentStatusResponse> {
  const intervalMs = options.intervalMs ?? 2000
  const timeoutMs = options.timeoutMs ?? 90000
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const status = await getAdminPaymentStatus(paymentId)
    if (status.paymentStatus === 'FAILED') {
      return status
    }
    if (
      status.paymentStatus === 'COMPLETED' &&
      (status.receiptConfirmed || (status.mpesaReceiptNumber && /^[A-Z0-9]{8,15}$/i.test(status.mpesaReceiptNumber)))
    ) {
      return status
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  return getAdminPaymentStatus(paymentId)
}
