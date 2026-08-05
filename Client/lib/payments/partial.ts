import { formatKsh } from '@/lib/api/menu'

/** Suggested first payment — 30% of the invoice total (capped at remaining balance). */
export const DEPOSIT_PERCENT = 30

export function roundKes(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return Math.round(amount)
}

export function suggestedDeposit(amountDue: number, balance: number): number {
  const deposit = roundKes((Number(amountDue) || 0) * (DEPOSIT_PERCENT / 100))
  const remaining = roundKes(Number(balance) || 0)
  if (remaining <= 0) return 0
  if (deposit <= 0) return remaining
  return Math.min(deposit, remaining)
}

export function halfBalance(balance: number): number {
  const remaining = roundKes(Number(balance) || 0)
  if (remaining <= 0) return 0
  return Math.max(1, roundKes(remaining / 2))
}

export type PaymentAmountPreset = {
  key: string
  label: string
  amount: number
  hint?: string
}

/** Quick amounts for deposit / installment-style payments against remaining balance. */
export function paymentAmountPresets(amountDue: number, balance: number, amountPaid = 0): PaymentAmountPreset[] {
  const remaining = roundKes(Number(balance) || 0)
  if (remaining <= 0) return []

  const presets: PaymentAmountPreset[] = []
  const deposit = suggestedDeposit(amountDue, remaining)
  const half = halfBalance(remaining)
  const paid = Number(amountPaid) || 0

  // Offer deposit only while the first-payment target is still unmet (or nothing paid yet).
  if (paid < deposit && deposit > 0 && deposit < remaining) {
    presets.push({
      key: 'deposit',
      label: `Deposit ${DEPOSIT_PERCENT}%`,
      amount: deposit,
      hint: formatKsh(deposit),
    })
  }

  if (half > 0 && half < remaining && half !== deposit) {
    presets.push({
      key: 'half',
      label: 'Half balance',
      amount: half,
      hint: formatKsh(half),
    })
  }

  presets.push({
    key: 'full',
    label: paid > 0 ? 'Pay remaining' : 'Pay in full',
    amount: remaining,
    hint: formatKsh(remaining),
  })

  return presets
}

export type PaymentHistoryItem = {
  paymentId: number
  amount: number
  paymentMethod: string
  paymentStatus: string
  mpesaReceiptNumber?: string | null
  checkoutRequestId?: string | null
  failureReason?: string | null
  initiatedAt?: string | null
  completedAt?: string | null
}

export type PaymentHistoryRow = PaymentHistoryItem & {
  balanceAfter: number | null
}

/**
 * Newest-first rows with running balance after each COMPLETED credit
 * (computed chronologically from invoice total).
 */
export function buildPaymentHistoryRows(
  payments: PaymentHistoryItem[] | null | undefined,
  amountDue: number
): PaymentHistoryRow[] {
  const list = [...(payments ?? [])]
  const chronological = [...list].sort((a, b) => {
    const aTime = new Date(a.completedAt ?? a.initiatedAt ?? 0).getTime()
    const bTime = new Date(b.completedAt ?? b.initiatedAt ?? 0).getTime()
    return aTime - bTime
  })

  let runningPaid = 0
  const balanceById = new Map<number, number | null>()
  for (const payment of chronological) {
    if (payment.paymentStatus === 'COMPLETED') {
      runningPaid += Number(payment.amount) || 0
      balanceById.set(payment.paymentId, Math.max(0, roundKes(Number(amountDue) - runningPaid)))
    } else if (payment.paymentStatus === 'REFUNDED') {
      balanceById.set(payment.paymentId, null)
    } else {
      balanceById.set(payment.paymentId, null)
    }
  }

  return [...list]
    .sort((a, b) => {
      const aTime = new Date(a.completedAt ?? a.initiatedAt ?? 0).getTime()
      const bTime = new Date(b.completedAt ?? b.initiatedAt ?? 0).getTime()
      return bTime - aTime
    })
    .map((payment) => ({
      ...payment,
      balanceAfter: balanceById.get(payment.paymentId) ?? null,
    }))
}

export function formatPaymentWhen(value?: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
