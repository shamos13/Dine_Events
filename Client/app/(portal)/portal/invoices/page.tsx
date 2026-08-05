'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ApiError } from '@/lib/api/client'
import { formatKsh } from '@/lib/api/menu'
import { getPortalInvoices, type InvoiceResponse } from '@/lib/api/portal'
import { DEPOSIT_PERCENT, suggestedDeposit } from '@/lib/payments/partial'
import { Card } from '@/components/ui/card'
import { StatusPill } from '@/components/ui/status-pill'
import { Skeleton } from '@/components/ui/skeleton'

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPortalInvoices()
      .then(setInvoices)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load invoices.')
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <p className="mt-1 text-gray-600">
          Pay a {DEPOSIT_PERCENT}% deposit or smaller installments via M-Pesa — full payment is not required at once.
        </p>
      </div>

      {loading && <Skeleton className="h-40 w-full" />}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

      {!loading && !error && invoices.length === 0 && (
        <Card className="text-center text-sm text-gray-600">No invoices yet. Accept a quotation to generate one.</Card>
      )}

      <div className="space-y-3">
        {invoices.map((invoice) => {
          const balance = Number(invoice.balance)
          const paid = Number(invoice.amountPaid)
          const deposit = suggestedDeposit(Number(invoice.amountDue), Number(invoice.amountDue))
          const depositMet = paid >= deposit && deposit > 0
          const canPay = balance > 0 && invoice.invoiceStatus !== 'CANCELLED' && invoice.invoiceStatus !== 'PAID'

          return (
            <Link key={invoice.invoiceId} href={`/portal/invoices/${invoice.invoiceId}`}>
              <Card className="transition hover:border-brand/40 hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {invoice.eventName} · Due {invoice.dueDate}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      Paid {formatKsh(paid)} · Balance {formatKsh(balance)} of {formatKsh(invoice.amountDue)}
                    </p>
                    {canPay && (
                      <p className="mt-1 text-xs text-emerald-700">
                        {depositMet
                          ? 'Deposit met — you can continue with the remaining balance.'
                          : `Suggested deposit ${formatKsh(Math.min(deposit, balance))} · or pay any amount`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill status={invoice.invoiceStatus} />
                    {canPay && (
                      <span className="text-xs font-semibold text-brand">Pay deposit / installment →</span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
