import { CircleHelp, ClipboardList, FileText, PackageOpen, Pencil, Plus, ReceiptText, Trash2 } from 'lucide-react'
import type { EventRecord } from './event-data'
import { DataTable, OutlineButton, Panel, SectionHeading } from './components'

const menuItems = [
  { name: 'Chapati', category: 'Side dish', quantity: 1, price: 3500 },
  { name: 'Pilau', category: 'Main course', quantity: 1, price: 30000 },
]

export default function Menu({ event }: { event: EventRecord }) {
  const subtotal = menuItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const serviceCharge = subtotal * 0.2
  const salesTax = subtotal * 0.05
  const total = subtotal + serviceCharge + salesTax

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.96fr)]">
    <div className="space-y-6">
      <Panel><SectionHeading title="Packages" subtitle="Complete package offerings with multiple components" /><div className="flex min-h-80 flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-slate-700"><PackageOpen className="h-8 w-8" /></div><h3 className="mt-6 text-xl font-bold">No Packages Added Yet</h3><p className="mt-3 max-w-md text-sm leading-6 text-slate-600">Start by adding a curated catering package to streamline your event menu.</p><button className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#cc2622] px-5 py-3 font-semibold text-white hover:bg-[#a01f1a]"><Plus className="h-5 w-5" />Add First Package</button></div></Panel>
      <Panel><SectionHeading title="Menu Items" subtitle="Food items for this event" /><DataTable headers={['Item', 'Quantity', 'Unit Price', 'Total', 'Actions']} rows={menuItems.map((item) => [<div key={item.name}><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-1 text-sm text-slate-600">{item.category}</p></div>, item.quantity.toString(), currency(item.price), <span key={`${item.name}-total`} className="font-semibold text-slate-900">{currency(item.price * item.quantity)}</span>, <div key={`${item.name}-actions`} className="flex justify-end gap-3"><button aria-label={`Edit ${item.name}`} className="text-slate-600 hover:text-[#cc2622]"><Pencil className="h-4 w-4" /></button><button aria-label={`Remove ${item.name}`} className="text-slate-600 hover:text-[#cc2622]"><Trash2 className="h-4 w-4" /></button></div>])} /><div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xl font-bold">Subtotal: {currency(subtotal)}</p><OutlineButton className="border-[#cc2622] text-[#cc2622]"><Plus className="h-5 w-5" />Add Menu Item</OutlineButton></div></Panel>
    </div>
    <aside className="space-y-6"><Totals subtotal={subtotal} serviceCharge={serviceCharge} salesTax={salesTax} total={total} /><div className="space-y-3"><OutlineButton className="w-full"><FileText className="h-4 w-4" />Create Report</OutlineButton><OutlineButton className="w-full"><ClipboardList className="h-4 w-4" />Create Proposal</OutlineButton><button className="flex w-full items-center justify-center gap-2 rounded-md bg-[#cc2622] px-4 py-3 text-sm font-semibold text-white hover:bg-[#a01f1a]"><ReceiptText className="h-4 w-4" />Create Invoice</button></div><Panel className="border-blue-200 bg-blue-50 text-center"><CircleHelp className="mx-auto h-11 w-11 text-[#cc2622]" /><h3 className="mt-5 text-lg font-bold">Need assistance?</h3><p className="mt-3 text-sm leading-6 text-slate-600">Our kitchen and logistics teams are available 24/7 for event support.</p><button className="mt-5 text-sm font-semibold text-[#cc2622] hover:underline">Contact Support Center</button></Panel></aside>
  </div>
}

function Totals({ subtotal, serviceCharge, salesTax, total }: { subtotal: number; serviceCharge: number; salesTax: number; total: number }) { return <Panel><SectionHeading title="Event Totals" subtitle="Summary of all charges" /><div className="space-y-4 text-sm"><Total label="Menu Items" value={currency(subtotal)} /><Total label="Item Total" value={currency(subtotal)} /><div className="border-t border-blue-100" /><Total label="Service Charge (20%)" value={currency(serviceCharge)} /><Total label="Sales Tax (5%)" value={currency(salesTax)} /><div className="border-t border-blue-200 pt-4"><Total label={<span className="text-xl font-bold">Total</span>} value={<span className="text-xl font-bold text-[#cc2622]">{currency(total)}</span>} /></div></div></Panel> }
function Total({ label, value }: { label: React.ReactNode; value: React.ReactNode }) { return <div className="flex items-start justify-between gap-4"><span>{label}</span><span className="font-medium text-slate-900">{value}</span></div> }
function currency(value: number) { return `KSh ${value.toLocaleString('en-KE', { minimumFractionDigits: 2 })}` }
