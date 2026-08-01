'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CheckCircle2, Loader2, Smartphone, Wallet, XCircle } from 'lucide-react'
import InvoiceTemplate from '@/components/InvoiceTemplate'
import { Modal } from '@/components/ui/modal'
import { StatusPill } from '@/components/ui/status-pill'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api/client'
import { formatKsh } from '@/lib/api/menu'
import { confirmPaymentReceipt, isValidMpesaReceipt, waitForPaymentResult } from '@/lib/api/payments'
import { getPortalInvoice, getPortalProfile, payPortalInvoice, type InvoiceResponse, type PaymentStatus } from '@/lib/api/portal'

type PayPhase = 'idle' | 'awaiting' | 'completed' | 'failed' | 'pending' | 'needReceipt'

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
  const [paymentId, setPaymentId] = useState<number | null>(null)
  const [receipt, setReceipt] = useState<string | null>(null)
  const [receiptInput, setReceiptInput] = useState('')
  const [savingReceipt, setSavingReceipt] = useState(false)
  const [checkoutRef, setCheckoutRef] = useState<string | null>(null)
  const [statusDetail, setStatusDetail] = useState('')

  const load = useCallback(async () => {
    if (!Number.isFinite(invoiceId)) return
    setLoading(true)
    try {
      const [inv, profile] = await Promise.all([getPortalInvoice(invoiceId), getPortalProfile()])
      setInvoice(inv)
      setAmount(String(inv.balance ?? inv.amountDue ?? ''))
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
    (invoice.invoiceStatus === 'UNPAID' ||
      invoice.invoiceStatus === 'PARTIALLY_PAID' ||
      invoice.invoiceStatus === 'OVERDUE') &&
    Number(invoice.balance) > 0

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
    setReceiptInput('')
    setPaymentId(null)
    setCheckoutRef(null)
    setStatusDetail('Check your phone and enter your M-Pesa PIN. We confirm with Safaricom within a few seconds.')
    setPollOpen(true)
    try {
      const payment = await payPortalInvoice(invoice.invoiceId, {
        phoneNumber: phone,
        amount: Number(amount),
      })
      setPaymentId(payment.paymentId)
      setCheckoutRef(payment.checkoutRequestId ?? null)

      const result = await waitForPaymentResult(payment.paymentId, {
        intervalMs: 1000,
        timeoutMs: 60000,
      })

      setReceipt(result.mpesaReceiptNumber)
      setCheckoutRef(result.checkoutRequestId ?? payment.checkoutRequestId ?? null)

      const status = result.paymentStatus as PaymentStatus
      if (status === 'COMPLETED') {
        await load()
        if (isValidMpesaReceipt(result.mpesaReceiptNumber)) {
          setPhase('completed')
          setStatusDetail(`Payment confirmed. M-Pesa receipt ${result.mpesaReceiptNumber}`)
          toast(`Payment received · Receipt ${result.mpesaReceiptNumber}`, 'success')
        } else {
          setPhase('needReceipt')
          setStatusDetail(
            'Payment confirmed and your invoice is updated. Enter the M-Pesa receipt code from your SMS so it is saved in payment history.'
          )
          toast('Payment received — enter your M-Pesa receipt code.', 'success')
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

  const onSaveReceipt = async () => {
    if (!paymentId || !receiptInput.trim()) return
    setSavingReceipt(true)
    try {
      const confirmed = await confirmPaymentReceipt(paymentId, receiptInput.trim())
      setReceipt(confirmed.mpesaReceiptNumber)
      setPhase('completed')
      setStatusDetail(`Payment confirmed. M-Pesa receipt ${confirmed.mpesaReceiptNumber}`)
      toast(`Receipt ${confirmed.mpesaReceiptNumber} saved.`, 'success')
      await load()
    } catch (reason: unknown) {
      toast(reason instanceof ApiError ? reason.message : 'Unable to save receipt.', 'error')
    } finally {
      setSavingReceipt(false)
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

      {canPay && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-emerald-950">Pay via M-Pesa</h2>
          </div>
          <p className="mt-1 text-sm text-emerald-800">
            Outstanding balance {formatKsh(invoice.balance)}. You can pay in full or partially.
          </p>
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
            {paying ? 'Waiting for M-Pesa…' : 'Pay Now'}
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
          paymentNotes: `Amount paid: ${formatKsh(invoice.amountPaid)} · Balance: ${formatKsh(invoice.balance)}`,
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

      {invoice.payments && invoice.payments.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold text-gray-900">Payment history</h2>
          <p className="mb-3 text-xs text-gray-500">
            Use the M-Pesa receipt number to cross-check against your phone SMS or M-Pesa statement.
          </p>
          <ul className="space-y-2">
            {invoice.payments.map((payment) => {
              const receipt = isValidMpesaReceipt(payment.mpesaReceiptNumber)
                ? payment.mpesaReceiptNumber
                : null
              return (
                <li
                  key={payment.paymentId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {formatKsh(payment.amount)} via {payment.paymentMethod}
                    </p>
                    {receipt ? (
                      <p className="mt-0.5 font-mono text-xs font-semibold tracking-wide text-emerald-800">
                        M-Pesa receipt · {receipt}
                      </p>
                    ) : payment.paymentStatus === 'COMPLETED' ? (
                      <p className="mt-0.5 text-xs text-amber-700">Receipt syncing from Safaricom…</p>
                    ) : payment.checkoutRequestId ? (
                      <p className="mt-0.5 font-mono text-xs text-gray-500">Request {payment.checkoutRequestId}</p>
                    ) : null}
                  </div>
                  <StatusPill status={payment.paymentStatus} />
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <Modal
        isOpen={pollOpen}
        onClose={closeModal}
        closeDisabled={paying || phase === 'awaiting' || savingReceipt}
        title={
          phase === 'completed'
            ? 'Payment successful'
            : phase === 'needReceipt'
              ? 'Payment successful — add receipt'
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
                  <li>This screen updates automatically</li>
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

          {(phase === 'completed' || phase === 'needReceipt') && (
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
                  <p className="mt-1 text-xs text-emerald-800/80">Saved to payment history for reconciliation.</p>
                </div>
              ) : (
                <div className="mt-4 w-full space-y-3 text-left">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    M-Pesa receipt from your SMS
                  </label>
                  <input
                    className="form-input font-mono uppercase tracking-wide"
                    placeholder="e.g. NLJ7RT61SV"
                    value={receiptInput}
                    onChange={(e) => setReceiptInput(e.target.value.toUpperCase())}
                    maxLength={15}
                  />
                  <button
                    type="button"
                    disabled={savingReceipt || !isValidMpesaReceipt(receiptInput)}
                    onClick={onSaveReceipt}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingReceipt ? 'Saving…' : 'Save receipt to payment history'}
                  </button>
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">Invoice balance has been updated.</p>
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
