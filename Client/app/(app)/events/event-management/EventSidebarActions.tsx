'use client'

import React from 'react'
import { ClipboardList, FileText, ReceiptText } from 'lucide-react'
import { OutlineButton } from './components'
import { EventTotals } from './EventTotals'
import type { LineItemType } from '@/lib/api/quotations'
import type { EventStatus } from '@/lib/api/events'

interface EventSidebarActionsProps {
  eventId: number
  eventStatus?: EventStatus | string
  onGenerateInvoice?: () => void
  onGenerateProposal?: () => void
  onCreateReport?: () => void
  className?: string
  liveTotals?: Partial<Record<LineItemType, number>>
  discountPercent?: number
}

export default function EventSidebarActions({
  eventId,
  eventStatus,
  onGenerateInvoice,
  onGenerateProposal,
  onCreateReport,
  className = '',
  liveTotals,
  discountPercent = 0,
}: EventSidebarActionsProps) {
  const cancelled = eventStatus === 'CANCELLED'

  return (
    <aside className={`space-y-6 ${className}`}>
      <EventTotals eventId={eventId} liveTotals={liveTotals} discountPercent={discountPercent} />
      {cancelled ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          This event is cancelled. New proposals and invoices cannot be created.
        </p>
      ) : (
        <div className="space-y-3">
          <OutlineButton onClick={onCreateReport} className="w-full">
            <FileText className="h-4 w-4" />
            Create Report
          </OutlineButton>
          <OutlineButton onClick={onGenerateProposal} className="w-full">
            <ClipboardList className="h-4 w-4" />
            Generate Proposal
          </OutlineButton>
          <button
            type="button"
            onClick={onGenerateInvoice}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#cc2622] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a01f1a]"
          >
            <ReceiptText className="h-4 w-4" />
            Generate Invoice
          </button>
        </div>
      )}
    </aside>
  )
}
