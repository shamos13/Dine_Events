import {
  confirmPortalPaymentReceipt,
  getPortalPaymentStatus,
  payPortalInvoice,
  type PaymentResponse,
  type PaymentStatusResponse,
  type PortalPayRequest,
} from './portal'

export type { PaymentResponse, PortalPayRequest, PaymentStatusResponse }

export const initiateMpesaPayment = payPortalInvoice
export const pollPaymentStatus = getPortalPaymentStatus
export const confirmPaymentReceipt = confirmPortalPaymentReceipt

/** Genuine Safaricom receipt codes are short alphanumeric (e.g. RB15P0ICDO). */
export function isValidMpesaReceipt(receipt?: string | null): boolean {
  if (!receipt) return false
  const trimmed = receipt.trim()
  if (/^CHK-/i.test(trimmed) || /^ws_CO_/i.test(trimmed)) return false
  return /^[A-Z0-9]{8,15}$/i.test(trimmed)
}

/**
 * Poll until FAILED or COMPLETED.
 *
 * Receipts arrive only from Safaricom's callback (backfilled server-side).
 * By default we return as soon as the payment is COMPLETED so the UI is not
 * blocked waiting for a late callback; pass requireReceipt: true to wait.
 */
export async function waitForPaymentResult(
  paymentId: number,
  options: { intervalMs?: number; timeoutMs?: number; requireReceipt?: boolean } = {}
): Promise<PaymentStatusResponse> {
  const intervalMs = options.intervalMs ?? 750
  const timeoutMs = options.timeoutMs ?? 90000
  const requireReceipt = options.requireReceipt ?? false
  const started = Date.now()
  let last: PaymentStatusResponse | null = null

  while (Date.now() - started < timeoutMs) {
    last = await pollPaymentStatus(paymentId)

    if (last.paymentStatus === 'FAILED') {
      return last
    }

    if (last.paymentStatus === 'COMPLETED') {
      if (!requireReceipt) {
        return last
      }
      if (last.receiptConfirmed || isValidMpesaReceipt(last.mpesaReceiptNumber)) {
        return last
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  return last ?? pollPaymentStatus(paymentId)
}
