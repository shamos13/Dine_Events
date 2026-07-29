'use client'

import React from 'react'
import { ClipboardList, FileText, ReceiptText } from 'lucide-react'
import { OutlineButton } from './components'
import { EventTotals } from './EventTotals'
import type { LineItemType } from '@/lib/api/quotations'

interface EventSidebarActionsProps {
  eventId: number
  onGenerateInvoice?: () => void
  onGenerateProposal?: () => void
  onCreateReport?: () => void
  className?: string
  liveTotals?: Partial<Record<LineItemType, number>>
}

export default function EventSidebarActions({
  eventId,
  onGenerateInvoice,
  onGenerateProposal,
  onCreateReport,
  className = '',
  liveTotals,
}: EventSidebarActionsProps) {
  return (
    <aside className={`space-y-6 ${className}`}>
      <EventTotals eventId={eventId} liveTotals={liveTotals} />
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
          onClick={onGenerateInvoice}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#cc2622] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a01f1a]"
        >
          <ReceiptText className="h-4 w-4" />
          Generate Invoice
        </button>
      </div>
    </aside>
  )
}
