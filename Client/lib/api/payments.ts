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
 * Fast poll: STK follow-ups run server-side every few seconds, so we check often.
 * Returns on FAILED, or COMPLETED with a confirmed receipt.
 * If COMPLETED without receipt (callback missed), returns that state so the UI
 * can collect the SMS receipt code.
 */
export async function waitForPaymentResult(
  paymentId: number,
  options: { intervalMs?: number; timeoutMs?: number; requireReceipt?: boolean } = {}
): Promise<PaymentStatusResponse> {
  const intervalMs = options.intervalMs ?? 1000
  const timeoutMs = options.timeoutMs ?? 60000
  const requireReceipt = options.requireReceipt ?? false
  const started = Date.now()
  let last: PaymentStatusResponse | null = null

  while (Date.now() - started < timeoutMs) {
    last = await pollPaymentStatus(paymentId)

    if (last.paymentStatus === 'FAILED') {
      return last
    }

    if (last.paymentStatus === 'COMPLETED') {
      if (last.receiptConfirmed || isValidMpesaReceipt(last.mpesaReceiptNumber)) {
        return last
      }
      // Completed via STK query — give the callback a short window, then surface to UI.
      if (!requireReceipt && Date.now() - started > 12000) {
        return last
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  return last ?? pollPaymentStatus(paymentId)
}
