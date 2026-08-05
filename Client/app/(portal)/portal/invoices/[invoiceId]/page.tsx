'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CheckCircle2, Loader2, Smartphone, Wallet, XCircle } from 'lucide-react'
import InvoiceTemplate from '@/components/InvoiceTemplate'
import { InvoicePaymentHistory } from '@/components/payments/InvoicePaymentHistory'
import { InvoicePaymentPlan } from '@/components/payments/InvoicePaymentPlan'
import { PaymentAmountPresets } from '@/components/payments/PaymentAmountPresets'
import { Modal } from '@/components/ui/modal'
import { StatusPill } from '@/components/ui/status-pill'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api/client'
import { formatKsh } from '@/lib/api/menu'
import { isValidMpesaReceipt, waitForPaymentResult } from '@/lib/api/payments'
import { getPortalInvoice, getPortalProfile, payPortalInvoice, type InvoiceResponse, type PaymentStatus } from '@/lib/api/portal'
import { suggestedDeposit } from '@/lib/payments/partial'

type PayPhase = 'idle' | 'awaiting' | 'completed' | 'failed' | 'pending'

export default function PortalInvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>()
  const invoiceId = Number(params.invoiceId)
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null)
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [pollOpen, setPollOpen] = useState(false)
  const [phase, setPhase] = useState<PayPhase>('idle')
  const [receipt, setReceipt] = useState<string | null>(null)
  const [checkoutRef, setCheckoutRef] = useState<string | null>(null)
  const [statusDetail, setStatusDetail] = useState('')

  const load = useCallback(async () => {
    if (!Number.isFinite(invoiceId)) return
    setLoading(true)
    try {
      const [inv, profile] = await Promise.all([getPortalInvoice(invoiceId), getPortalProfile()])
      setInvoice(inv)
      const balance = Number(inv.balance ?? 0)
      const paid = Number(inv.amountPaid ?? 0)
      const deposit = suggestedDeposit(Number(inv.amountDue ?? 0), balance)
      // Default to deposit if unpaid, otherwise remaining balance.
      const defaultAmount = paid <= 0 && deposit > 0 && deposit < balance ? deposit : balance
      setAmount(String(defaultAmount || balance || inv.amountDue || ''))
      setPhone(profile.clientPhone ?? '')
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to load invoice.')
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    load()
  }, [load])

  const canPay =
    invoice &&
    invoice.invoiceStatus !== 'CANCELLED' &&
    invoice.invoiceStatus !== 'PAID' &&
    (invoice.invoiceStatus === 'UNPAID' ||
      invoice.invoiceStatus === 'PARTIALLY_PAID' ||
      invoice.invoiceStatus === 'OVERDUE') &&
    Number(invoice.balance) > 0

  const isCancelled = invoice?.invoiceStatus === 'CANCELLED'

  const closeModal = () => {
    if (paying) return
    setPollOpen(false)
    setPhase('idle')
  }

  const onPay = async () => {
    if (!invoice) return
    setPaying(true)
    setPhase('awaiting')
    setReceipt(null)
    setCheckoutRef(null)
    setStatusDetail(
      'Check your phone and enter your M-Pesa PIN. We capture the receipt automatically from Safaricom.'
    )
    setPollOpen(true)
    try {
      const payment = await payPortalInvoice(invoice.invoiceId, {
        phoneNumber: phone,
        amount: Number(amount),
      })
      setCheckoutRef(payment.checkoutRequestId ?? null)

      const result = await waitForPaymentResult(payment.paymentId, {
        intervalMs: 750,
        timeoutMs: 90000,
        requireReceipt: false,
      })

      setReceipt(result.mpesaReceiptNumber ?? null)
      setCheckoutRef(result.checkoutRequestId ?? payment.checkoutRequestId ?? null)

      const status = result.paymentStatus as PaymentStatus
      if (status === 'COMPLETED') {
        await load()
        if (isValidMpesaReceipt(result.mpesaReceiptNumber)) {
          setPhase('completed')
          setStatusDetail(`Payment confirmed. M-Pesa receipt ${result.mpesaReceiptNumber}`)
          toast(`Payment received · Receipt ${result.mpesaReceiptNumber}`, 'success')
        } else {
          setPhase('completed')
          setStatusDetail(
            'Payment confirmed and your invoice is updated. The M-Pesa receipt will appear in payment history when Safaricom finishes syncing.'
          )
          toast('Payment received.', 'success')
        }
      } else if (status === 'FAILED') {
        setPhase('failed')
        setStatusDetail(result.failureReason || 'Payment failed or was cancelled on your phone.')
        toast('Payment failed.', 'error')
      } else {
        setPhase('pending')
        setStatusDetail(
          'Still waiting on Safaricom. If you already paid, wait a moment or refresh — confirmation is automatic.'
        )
        toast('Payment is still pending confirmation.', 'info')
      }
    } catch (reason: unknown) {
      setPhase('failed')
      setStatusDetail(reason instanceof ApiError ? reason.message : 'Unable to initiate payment.')
      toast(reason instanceof ApiError ? reason.message : 'Unable to initiate payment.', 'error')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <Skeleton className="h-96 w-full" />
  if (error) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
  if (!invoice) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/portal/invoices" className="text-sm font-semibold text-brand hover:text-brand-dark">
            ← Back to invoices
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
        </div>
        <StatusPill status={invoice.invoiceStatus} />
      </div>

      {isCancelled && (
        <p role="status" className="rounded-lg border border-slate-300 bg-slate-100 p-4 text-sm text-slate-800">
          This invoice was cancelled after a revised proposal. Please open your booking and pay the current invoice
          instead — payment is not accepted on replaced invoices.
        </p>
      )}

      {!isCancelled && (
        <InvoicePaymentPlan
          amountDue={Number(invoice.amountDue)}
          amountPaid={Number(invoice.amountPaid)}
          balance={Number(invoice.balance)}
          dueDate={invoice.dueDate}
        />
      )}

      {canPay && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-emerald-950">Pay via M-Pesa</h2>
          </div>
          <p className="mt-1 text-sm text-emerald-800">
            Outstanding balance {formatKsh(invoice.balance)}. Pay a deposit, a smaller installment, or the full
            remaining amount.
          </p>

          <PaymentAmountPresets
            className="mt-4 text-emerald-900"
            amountDue={Number(invoice.amountDue)}
            balance={Number(invoice.balance)}
            amountPaid={Number(invoice.amountPaid)}
            selectedAmount={Number(amount) || 0}
            onSelect={(value) => setAmount(String(value))}
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-emerald-900">Phone</label>
              <div className="relative">
                <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />
                <input
                  className="form-input pl-10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-emerald-900">Amount (KSh)</label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={Number(invoice.balance)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={paying || !phone || !amount || Number(amount) <= 0}
            onClick={onPay}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Wallet className="h-4 w-4" />
            {paying ? 'Waiting for M-Pesa…' : `Pay ${formatKsh(Number(amount) || 0)}`}
          </button>
        </section>
      )}

      <InvoiceTemplate
        showActions={false}
        data={{
          invoiceNumber: invoice.invoiceNumber,
          issueDate: invoice.createdAt?.slice(0, 10),
          dueDate: invoice.dueDate,
          status: invoice.invoiceStatus,
          clientName: invoice.clientName ?? undefined,
          eventName: invoice.eventName,
          subtotal: Number(invoice.amountDue),
          totalDue: Number(invoice.amountDue),
          paymentNotes: `Paid ${formatKsh(invoice.amountPaid)} · Balance ${formatKsh(invoice.balance)}. Deposits and partial payments are accepted.`,
          lineItems: (invoice.lineItems ?? []).map((line) => ({
            id: line.lineItemId,
            description: line.lineItemDescription,
            qty: Number(line.quantity),
            unitPrice: Number(line.unitPriceAtQuotation),
            total: Number(line.totalPrice),
            type: line.lineItemType,
            subdescription: line.includedMenuItemNames?.join(', '),
          })),
        }}
      />

      <InvoicePaymentHistory
        payments={invoice.payments}
        amountDue={Number(invoice.amountDue)}
        emptyMessage="No payments yet. Use the form above to pay a deposit or any amount toward this invoice."
      />

      <Modal
        isOpen={pollOpen}
        onClose={closeModal}
        closeDisabled={paying || phase === 'awaiting'}
        title={
          phase === 'completed'
            ? 'Payment successful'
            : phase === 'failed'
              ? 'Payment unsuccessful'
              : 'Awaiting M-Pesa confirmation'
        }
      >
        <div className="flex flex-col items-center text-center">
          {phase === 'awaiting' && (
            <>
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-200/70" />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
                </span>
              </div>
              <p className="text-base font-semibold text-gray-900">Waiting for you to complete payment</p>
              <p className="mt-2 max-w-sm text-sm text-gray-600">{statusDetail}</p>
              <div className="mt-5 w-full rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-left text-sm text-emerald-950">
                <p className="font-semibold">On your phone</p>
                <ol className="mt-1 list-decimal space-y-1 pl-4 text-emerald-900/90">
                  <li>Open the M-Pesa PIN prompt</li>
                  <li>Enter your PIN and confirm</li>
                  <li>Receipt is saved automatically — no typing needed</li>
                </ol>
              </div>
              {(checkoutRef || amount) && (
                <p className="mt-4 text-xs text-gray-500">
                  {amount ? `Amount ${formatKsh(Number(amount))}` : null}
                  {amount && checkoutRef ? ' · ' : null}
                  {checkoutRef ? `Request ${checkoutRef}` : null}
                </p>
              )}
            </>
          )}

          {phase === 'completed' && (
            <>
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" strokeWidth={1.75} />
              </div>
              <p className="text-lg font-bold text-emerald-800">Paid</p>
              <p className="mt-2 max-w-sm text-sm text-gray-600">{statusDetail}</p>
              {isValidMpesaReceipt(receipt) ? (
                <div className="mt-4 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">M-Pesa receipt</p>
                  <p className="mt-1 font-mono text-lg font-bold tracking-wide text-emerald-950">{receipt}</p>
                  <p className="mt-1 text-xs text-emerald-800/80">Captured automatically and saved to payment history.</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-amber-700">Receipt syncing from Safaricom…</p>
              )}
              <p className="mt-2 text-xs text-gray-500">Invoice balance and payment history have been updated.</p>
            </>
          )}

          {phase === 'failed' && (
            <>
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-12 w-12 text-red-600" strokeWidth={1.75} />
              </div>
              <p className="text-lg font-bold text-red-800">Not completed</p>
              <p className="mt-2 max-w-sm text-sm text-gray-600">{statusDetail}</p>
            </>
          )}

          {phase === 'pending' && (
            <>
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                <Loader2 className="h-10 w-10 text-amber-600" />
              </div>
              <p className="text-base font-semibold text-gray-900">Still confirming</p>
              <p className="mt-2 max-w-sm text-sm text-gray-600">{statusDetail}</p>
              {checkoutRef && (
                <p className="mt-3 font-mono text-xs text-gray-500">Ref {checkoutRef}</p>
              )}
            </>
          )}

          {!paying && phase !== 'awaiting' && (
            <button
              type="button"
              onClick={closeModal}
              className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
            >
              {phase === 'completed' ? 'Done' : 'Close'}
            </button>
          )}
        </div>
      </Modal>
    </div>
  )
}
