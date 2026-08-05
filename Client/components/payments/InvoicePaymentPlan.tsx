'use client'

import { formatKsh } from '@/lib/api/menu'
import { DEPOSIT_PERCENT, suggestedDeposit } from '@/lib/payments/partial'

type Props = {
  amountDue: number
  amountPaid: number
  balance: number
  dueDate?: string | null
  className?: string
}

export function InvoicePaymentPlan({ amountDue, amountPaid, balance, dueDate, className = '' }: Props) {
  const total = Number(amountDue) || 0
  const paid = Number(amountPaid) || 0
  const remaining = Number(balance) || 0
  const depositTarget = suggestedDeposit(total, total)
  const depositMet = paid >= depositTarget && depositTarget > 0
  const paidPercent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      <h2 className="text-lg font-bold text-gray-900">How to pay this invoice</h2>
      <p className="mt-1 text-sm text-gray-600">
        You do not need to pay everything at once. A {DEPOSIT_PERCENT}% deposit is recommended first; then settle
        the remaining balance in one or more payments before the due date.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Invoice total" value={formatKsh(total)} />
        <Stat
          label={`Suggested deposit (${DEPOSIT_PERCENT}%)`}
          value={formatKsh(depositTarget)}
          hint={depositMet ? 'Deposit met' : paid > 0 ? `${formatKsh(Math.max(0, depositTarget - paid))} still toward deposit` : 'Recommended first payment'}
          tone={depositMet ? 'good' : 'warn'}
        />
        <Stat label="Paid so far" value={formatKsh(paid)} hint={`${paidPercent}% of total`} tone="good" />
        <Stat
          label="Remaining balance"
          value={formatKsh(remaining)}
          hint={dueDate ? `Due ${new Date(dueDate).toLocaleDateString()}` : undefined}
          tone={remaining > 0 ? 'warn' : 'good'}
        />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-600">
          <span>Progress</span>
          <span>
            {formatKsh(paid)} / {formatKsh(total)}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min(100, paidPercent)}%` }}
          />
        </div>
      </div>

      {remaining > 0 && (
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-gray-700">
          <li>
            {depositMet
              ? 'Deposit is covered — you can pay any remaining amount that suits you.'
              : `Pay a deposit of about ${formatKsh(Math.min(depositTarget, remaining))} (or any smaller amount) to get started.`}
          </li>
          <li>Continue with additional payments until the balance reaches zero.</li>
          <li>Keep your M-Pesa receipts — they appear in payment history for your records.</li>
        </ol>
      )}

      {remaining <= 0 && paid > 0 && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          This invoice is fully paid. Thank you.
        </p>
      )}
    </section>
  )
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'good' | 'warn'
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p
        className={`mt-1 text-lg font-bold ${
          tone === 'good' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
