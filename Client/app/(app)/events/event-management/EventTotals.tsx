'use client'

import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { getQuotations, type LineItemType, type QuotationLineItemResponse, type QuotationResponse } from '@/lib/api/quotations'
import { Panel, SectionHeading } from './components'

export const lineItemLabels: Record<LineItemType, string> = {
  MENU_PACKAGE: 'Menu Packages',
  RENTAL: 'Rental Items',
  SERVICE: 'Services',
  STAFF: 'Staff',
  OTHER: 'Other Items',
}

export function useEventQuotation(eventId: number) {
  const [quotations, setQuotations] = useState<QuotationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getQuotations()
      .then((items) => setQuotations(items.filter((quotation) => quotation.eventId === eventId)))
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load event totals.'))
      .finally(() => setLoading(false))
  }, [eventId])

  const currentQuotation = useMemo(() => [...quotations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null, [quotations])

  return { currentQuotation, quotations, loading, error }
}

export function groupLineItems(lineItems: QuotationLineItemResponse[]) {
  const totals = new Map<LineItemType, number>()
  lineItems.forEach((item) => totals.set(item.lineItemType, (totals.get(item.lineItemType) ?? 0) + Number(item.totalPrice ?? 0)))
  return Array.from(totals.entries())
}

export function EventTotals({ eventId, className = '', liveTotals }: { eventId: number; className?: string; liveTotals?: Partial<Record<LineItemType, number>> }) {
  const { currentQuotation, loading, error } = useEventQuotation(eventId)
  const totalsByType = useMemo(() => {
    const totals = new Map<LineItemType, number>(groupLineItems(currentQuotation?.lineItems ?? []))
    Object.entries(liveTotals ?? {}).forEach(([type, value]) => totals.set(type as LineItemType, Number(value ?? 0)))
    return Array.from(totals.entries())
  }, [currentQuotation, liveTotals])
  const itemTotal = useMemo(() => totalsByType.reduce((sum, [, value]) => sum + value, 0), [totalsByType])
  const total = liveTotals ? itemTotal : Number(currentQuotation?.total ?? 0)

  return (
    <Panel className={className}>
      <SectionHeading title="Event Totals" subtitle="Summary of all charges" />
      {loading ? (
        <p className="text-sm text-slate-600">Loading event totals...</p>
      ) : error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : (
        <div className="space-y-4 text-sm">
          {totalsByType.length ? totalsByType.map(([type, value]) => <Total key={type} label={lineItemLabels[type]} value={currency(value)} />) : <p className="text-sm text-slate-600">No billed items from server yet.</p>}
          <div className="border-t border-[#efb6b0] pt-4"><Total label="Item Total" value={currency(liveTotals ? itemTotal : currentQuotation?.subTotal ?? 0)} /></div>
          <div className="border-t border-blue-200 pt-4"><Total label={<span className="text-xl font-bold">Total</span>} value={<span className="text-xl font-bold text-[#cc2622]">{currency(total)}</span>} /></div>
        </div>
      )}
    </Panel>
  )
}

function Total({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4"><span>{label}</span><span className="font-medium text-slate-900">{value}</span></div>
}

export function currency(value: number | null | undefined) {
  return `KSh ${Number(value ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
