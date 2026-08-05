'use client'

import { StatusPill } from '@/components/ui/status-pill'
import { formatKsh } from '@/lib/api/menu'
import {
  buildPaymentHistoryRows,
  formatPaymentWhen,
  type PaymentHistoryItem,
} from '@/lib/payments/partial'
import { isValidMpesaReceipt } from '@/lib/api/payments'

type Props = {
  payments: PaymentHistoryItem[] | null | undefined
  amountDue: number
  emptyMessage?: string
  className?: string
}

export function InvoicePaymentHistory({
  payments,
  amountDue,
  emptyMessage = 'No payments recorded yet.',
  className = '',
}: Props) {
  const rows = buildPaymentHistoryRows(payments, amountDue)

  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-5 ${className}`}>
      <h2 className="mb-1 text-lg font-bold text-gray-900">Payment history</h2>
      <p className="mb-4 text-sm text-gray-500">
        Every deposit, installment, and refund on this invoice — newest first.
      </p>

      {rows.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-slate-50">
              <tr>
                {['Date', 'Amount', 'Method', 'Reference', 'Status', 'Balance after'].map((col) => (
                  <th key={col} className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((payment) => {
                const receipt = isValidMpesaReceipt(payment.mpesaReceiptNumber)
                  ? payment.mpesaReceiptNumber
                  : payment.mpesaReceiptNumber?.startsWith('REF-')
                    ? payment.mpesaReceiptNumber
                    : null
                const isRefund = payment.paymentStatus === 'REFUNDED'
                return (
                  <tr key={payment.paymentId}>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                      {formatPaymentWhen(payment.completedAt ?? payment.initiatedAt)}
                    </td>
                    <td className={`px-3 py-3 font-semibold ${isRefund ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {isRefund ? '−' : ''}
                      {formatKsh(payment.amount)}
                    </td>
                    <td className="px-3 py-3 text-gray-600">{payment.paymentMethod}</td>
                    <td className="px-3 py-3">
                      {receipt ? (
                        <span className="font-mono text-xs font-semibold text-emerald-800">{receipt}</span>
                      ) : payment.paymentStatus === 'COMPLETED' ? (
                        <span className="text-xs text-amber-700">Receipt syncing…</span>
                      ) : payment.checkoutRequestId ? (
                        <span className="font-mono text-xs text-gray-500">{payment.checkoutRequestId}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={payment.paymentStatus} />
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {payment.balanceAfter == null ? '—' : formatKsh(payment.balanceAfter)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
