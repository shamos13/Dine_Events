'use client'

import { formatKsh } from '@/lib/api/menu'
import { paymentAmountPresets } from '@/lib/payments/partial'

type Props = {
  amountDue: number
  balance: number
  amountPaid?: number
  selectedAmount: number
  onSelect: (amount: number) => void
  className?: string
}

export function PaymentAmountPresets({
  amountDue,
  balance,
  amountPaid = 0,
  selectedAmount,
  onSelect,
  className = '',
}: Props) {
  const presets = paymentAmountPresets(amountDue, balance, amountPaid)
  if (presets.length === 0) return null

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-current opacity-80">
        Quick amounts
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const active = Math.round(selectedAmount) === Math.round(preset.amount)
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => onSelect(preset.amount)}
              className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                active
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-emerald-300 bg-white text-emerald-900 hover:border-emerald-500 hover:bg-emerald-50'
              }`}
            >
              <span className="block">{preset.label}</span>
              {preset.hint && (
                <span className={`block text-xs font-medium ${active ? 'text-emerald-50' : 'text-emerald-700'}`}>
                  {preset.hint}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs opacity-80">
        Or enter any custom amount up to {formatKsh(balance)}. Deposits and smaller installments are allowed.
      </p>
    </div>
  )
}
