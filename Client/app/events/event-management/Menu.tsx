'use client'

import { CircleHelp, ClipboardList, FileText, PackageOpen, Plus, ReceiptText } from 'lucide-react'
import type { EventRecord } from './event-data'
import { DataTable, OutlineButton, Panel, SectionHeading } from './components'
import { currency, EventTotals, lineItemLabels, useEventQuotation } from './EventTotals'

export default function Menu({ event }: { event: EventRecord }) {
  const { currentQuotation, loading, error } = useEventQuotation(event.id)
  const menuItems = currentQuotation?.lineItems.filter((item) => item.lineItemType === 'MENU_PACKAGE') ?? []
  const subtotal = menuItems.reduce((total, item) => total + Number(item.totalPrice ?? 0), 0)

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.96fr)]">
    <div className="space-y-6">
      <Panel><SectionHeading title="Packages" subtitle="Complete package offerings with multiple components" /><div className="flex min-h-80 flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-slate-700"><PackageOpen className="h-8 w-8" /></div><h3 className="mt-6 text-xl font-bold">No Packages Added Yet</h3><p className="mt-3 max-w-md text-sm leading-6 text-slate-600">Start by adding a curated catering package to streamline your event menu.</p><button className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#cc2622] px-5 py-3 font-semibold text-white hover:bg-[#a01f1a]"><Plus className="h-5 w-5" />Add First Package</button></div></Panel>
      <Panel><SectionHeading title="Menu Items" subtitle="Food items for this event" />{loading ? <p className="text-sm text-slate-600">Loading menu billing items...</p> : error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : menuItems.length ? <><DataTable headers={['Item', 'Type', 'Quantity', 'Unit Price', 'Total']} rows={menuItems.map((item) => [<div key={item.lineItemId}><p className="font-semibold text-slate-900">{item.lineItemDescription}</p><p className="mt-1 text-sm text-slate-600">{lineItemLabels[item.lineItemType]}</p></div>, lineItemLabels[item.lineItemType], Number(item.quantity ?? 0).toLocaleString(), currency(item.unitPriceAtQuotation), <span key={`${item.lineItemId}-total`} className="font-semibold text-slate-900">{currency(item.totalPrice)}</span>])} /><div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xl font-bold">Subtotal: {currency(subtotal)}</p><OutlineButton className="border-[#cc2622] text-[#cc2622]"><Plus className="h-5 w-5" />Add Menu Item</OutlineButton></div></> : <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#efb6b0] px-6 text-center text-slate-600"><PackageOpen className="h-9 w-9" /><p className="mt-4 text-sm font-medium">No menu billing items from server yet.</p></div>}</Panel>
    </div>
    <aside className="space-y-6"><EventTotals eventId={event.id} /><div className="space-y-3"><OutlineButton className="w-full"><FileText className="h-4 w-4" />Create Report</OutlineButton><OutlineButton className="w-full"><ClipboardList className="h-4 w-4" />Create Proposal</OutlineButton><button className="flex w-full items-center justify-center gap-2 rounded-md bg-[#cc2622] px-4 py-3 text-sm font-semibold text-white hover:bg-[#a01f1a]"><ReceiptText className="h-4 w-4" />Create Invoice</button></div><Panel className="border-blue-200 bg-blue-50 text-center"><CircleHelp className="mx-auto h-11 w-11 text-[#cc2622]" /><h3 className="mt-5 text-lg font-bold">Need assistance?</h3><p className="mt-3 text-sm leading-6 text-slate-600">Our kitchen and logistics teams are available 24/7 for event support.</p><button className="mt-5 text-sm font-semibold text-[#cc2622] hover:underline">Contact Support Center</button></Panel></aside>
  </div>
}
