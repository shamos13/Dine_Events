'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Archive, CircleHelp, ClipboardList, FileText, Loader2, PackagePlus, Plus, ReceiptText, Search, X } from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import {
  createInventory,
  createInventoryAllocation,
  getInventory,
  getInventoryAllocations,
  type InventoryAllocationResponse,
  type InventoryRequest,
  type InventoryResponse,
  type PricingType,
} from '@/lib/api/inventory'
import type { EventRecord } from './event-data'
import { OutlineButton, Panel, SectionHeading } from './components'
import { EventTotals } from './EventTotals'

const emptyInventoryForm = {
  inventoryName: '',
  inventoryQuantity: '',
  unitPrice: '',
}

export default function Rentals({ event }: { event: EventRecord }) {
  const [allocations, setAllocations] = useState<InventoryAllocationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadAllocations = () => {
    setLoading(true)
    setError(null)
    return getInventoryAllocations()
      .then((items) => setAllocations(items.filter((item) => item.eventName === event.name)))
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load rental items.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    void loadAllocations()
  }, [event.name])

  const subtotal = allocations.reduce((total, item) => total + Number(item.totalCost ?? 0), 0)

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.96fr)]">
        <div className="space-y-6">
          <Panel className="p-0">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeading title="Rental Items" subtitle="Equipment and inventory allocated to this event" />
              <button onClick={() => setDrawerOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#cc2622] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a01f1a]">
                <Plus className="h-5 w-5" />
                Add Rental Item
              </button>
            </div>

            {loading ? (
              <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading rental items...</div>
            ) : error ? (
              <div className="p-6"><p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p></div>
            ) : allocations.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ff] text-[#cc2622]"><Archive className="h-8 w-8" /></div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">No rental items added yet</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Allocated inventory from the server will appear here for this event.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full text-sm">
                  <thead>
                    <tr className="border-y border-[#efb6b0] bg-[#edf4ff] text-xs font-semibold uppercase tracking-[0.08em] text-[#3b1d1a]">
                      <th className="px-6 py-4 text-left">Item</th>
                      <th className="px-6 py-4 text-left">Pricing</th>
                      <th className="px-6 py-4 text-right">Quantity</th>
                      <th className="px-6 py-4 text-right">Unit Price</th>
                      <th className="px-6 py-4 text-right">Flat Rate</th>
                      <th className="px-6 py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((allocation) => (
                      <tr key={allocation.allocationId} className="border-b border-[#efb6b0]">
                        <td className="px-6 py-6 align-middle">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#dce9ff] text-[#cc2622]"><Archive className="h-6 w-6" /></div>
                            <div>
                              <p className="font-bold text-slate-950">{allocation.inventoryName}</p>
                              <p className="mt-1 text-sm text-[#3b1d1a]">{allocation.clientName ?? event.client}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 align-middle text-slate-950">{formatPricingType(allocation.pricingType)}</td>
                        <td className="px-6 py-6 text-right align-middle text-slate-950">{allocation.quantityAllocated ?? '-'}</td>
                        <td className="px-6 py-6 text-right align-middle text-slate-950">{formatCurrency(allocation.unitPriceAtAllocation)}</td>
                        <td className="px-6 py-6 text-right align-middle text-slate-950">{formatCurrency(allocation.flatRate)}</td>
                        <td className="px-6 py-6 text-right align-middle font-bold text-slate-950">{formatCurrency(allocation.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end bg-slate-50 px-6 py-5">
              <div className="flex min-w-64 items-center justify-between gap-10 text-base text-[#3b1d1a]">
                <span>Rental Subtotal</span>
                <span className="font-bold text-[#cc2622]">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </Panel>

          <Panel className="border-blue-100 bg-[#edf4ff] p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#dce9ff] text-[#cc2622]"><CircleHelp className="h-8 w-8" /></div>
                <div>
                  <h3 className="font-bold text-slate-950">Need assistance?</h3>
                  <p className="mt-1 text-sm text-[#3b1d1a]">Our equipment specialists are available 24/7 for rental support.</p>
                </div>
              </div>
              <button className="inline-flex items-center gap-2 text-sm font-bold text-[#cc2622] transition hover:underline">Contact Support Center</button>
            </div>
          </Panel>
        </div>

        <aside className="space-y-6">
          <EventTotals eventId={event.id} />
          <div className="space-y-3">
            <OutlineButton className="w-full bg-white py-4"><FileText className="h-4 w-4" />Create Report</OutlineButton>
            <OutlineButton className="w-full bg-white py-4"><ClipboardList className="h-4 w-4" />Create Proposal</OutlineButton>
            <OutlineButton className="w-full bg-white py-4"><ReceiptText className="h-4 w-4" />Create Invoice</OutlineButton>
          </div>
        </aside>
      </div>

      {drawerOpen && <AddRentalDrawer eventId={event.id} allocatedInventoryNames={allocations.map((allocation) => allocation.inventoryName)} onClose={() => setDrawerOpen(false)} onAllocated={loadAllocations} />}
    </>
  )
}

function AddRentalDrawer({ eventId, allocatedInventoryNames, onClose, onAllocated }: { eventId: number; allocatedInventoryNames: string[]; onClose: () => void; onAllocated: () => Promise<void> }) {
  const [inventory, setInventory] = useState<InventoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [savingNew, setSavingNew] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyInventoryForm)
  const [allocationForms, setAllocationForms] = useState<Record<number, { pricingType: PricingType; quantityAllocated: string; flatRate: string }>>({})
  const [newAllocation, setNewAllocation] = useState<{ pricingType: PricingType; quantityAllocated: string; flatRate: string }>({ pricingType: 'PER_UNIT', quantityAllocated: '1', flatRate: '' })

  useEffect(() => {
    setLoading(true)
    getInventory()
      .then(setInventory)
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load inventory.'))
      .finally(() => setLoading(false))
  }, [])

  const allocated = useMemo(() => new Set(allocatedInventoryNames), [allocatedInventoryNames])
  const filteredInventory = inventory.filter((item) => item.inventoryName.toLowerCase().includes(query.toLowerCase()))

  const getAllocationForm = (inventoryId: number) => allocationForms[inventoryId] ?? { pricingType: 'PER_UNIT', quantityAllocated: '1', flatRate: '' }
  const updateAllocationForm = (inventoryId: number, values: Partial<{ pricingType: PricingType; quantityAllocated: string; flatRate: string }>) => {
    setAllocationForms((current) => ({ ...current, [inventoryId]: { ...getAllocationForm(inventoryId), ...values } }))
  }

  const allocateInventory = async (item: InventoryResponse) => {
    const allocationForm = getAllocationForm(item.inventoryId)
    setSavingId(item.inventoryId)
    setError(null)

    try {
      await createInventoryAllocation(toAllocationPayload(item.inventoryId, eventId, allocationForm))
      await onAllocated()
      onClose()
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to add rental item.')
    } finally {
      setSavingId(null)
    }
  }

  const createAndAllocateInventory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavingNew(true)
    setError(null)

    const payload: InventoryRequest = {
      inventoryName: form.inventoryName.trim(),
      inventoryQuantity: Number(form.inventoryQuantity),
      unitPrice: Number(form.unitPrice),
    }

    try {
      const created = await createInventory(payload)
      await createInventoryAllocation(toAllocationPayload(created.inventoryId, eventId, newAllocation))
      await onAllocated()
      onClose()
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to create and add rental item.')
    } finally {
      setSavingNew(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <button aria-label="Close add rental panel" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[560px] flex-col border-l border-[#efb6b0] bg-[#f7f8fc] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#efb6b0] px-8 py-7">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Add Rental Item</h2>
            <p className="mt-2 text-sm text-slate-600">Choose existing inventory or create a new inventory entry.</p>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-md p-2 text-[#4a241f] transition hover:bg-red-50 hover:text-[#cc2622]"><X className="h-6 w-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="relative">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inventory..." className="h-14 w-full rounded-md border border-[#efb6b0] bg-white px-4 pr-12 text-base text-slate-950 outline-none transition focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20" />
          </div>

          <button onClick={() => setCreating((value) => !value)} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#efb6b0] bg-[#edf4ff] text-sm font-bold text-slate-950 transition hover:border-[#cc2622] hover:text-[#cc2622]">
            <PackagePlus className="h-5 w-5" />
            Create New Inventory
          </button>

          {error && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {creating && (
            <form onSubmit={createAndAllocateInventory} className="mt-5 space-y-4 rounded-lg border border-[#efb6b0] bg-white p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Inventory Name" value={form.inventoryName} onChange={(value) => setForm((current) => ({ ...current, inventoryName: value }))} required />
                <Field label="Available Quantity" type="number" min="1" value={form.inventoryQuantity} onChange={(value) => setForm((current) => ({ ...current, inventoryQuantity: value }))} required />
                <Field label="Unit Price" type="number" min="0" step="0.01" value={form.unitPrice} onChange={(value) => setForm((current) => ({ ...current, unitPrice: value }))} required />
              </div>
              <AllocationFields value={newAllocation} onChange={setNewAllocation} />
              <button disabled={savingNew} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#cc2622] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a01f1a] disabled:cursor-not-allowed disabled:opacity-60">
                {savingNew && <Loader2 className="h-4 w-4 animate-spin" />}
                Create And Add
              </button>
            </form>
          )}

          <div className="mt-5 overflow-hidden rounded-lg border border-[#efb6b0] bg-white">
            {loading ? (
              <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Loading inventory...</div>
            ) : filteredInventory.length === 0 ? (
              <div className="p-5 text-sm text-slate-600">No inventory found.</div>
            ) : (
              filteredInventory.map((item) => {
                const isAllocated = allocated.has(item.inventoryName)
                const allocationForm = getAllocationForm(item.inventoryId)
                const estimate = estimateTotal(item.unitPrice, allocationForm)
                return (
                  <div key={item.inventoryId} className="border-b border-[#efb6b0] p-5 last:border-b-0">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-950">{item.inventoryName}</h3>
                          {isAllocated && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-[#cc2622]">Added</span>}
                        </div>
                        <p className="mt-2 text-sm text-[#3b1d1a]">Available: {item.inventoryQuantity} - Unit price: {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <span className="shrink-0 text-base font-bold text-slate-950">{formatCurrency(estimate)}</span>
                    </div>
                    <div className="mt-4">
                      <AllocationFields value={allocationForm} onChange={(value) => updateAllocationForm(item.inventoryId, value)} />
                    </div>
                    <button disabled={isAllocated || savingId !== null} onClick={() => allocateInventory(item)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#cc2622] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a01f1a] disabled:cursor-not-allowed disabled:opacity-60">
                      {savingId === item.inventoryId && <Loader2 className="h-4 w-4 animate-spin" />}
                      Add To Event
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="border-t border-[#efb6b0] bg-white px-8 py-5">
          <button onClick={onClose} className="rounded-md border border-[#efb6b0] px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-red-50">Cancel</button>
        </div>
      </aside>
    </div>
  )
}

function AllocationFields({ value, onChange }: { value: { pricingType: PricingType; quantityAllocated: string; flatRate: string }; onChange: (value: { pricingType: PricingType; quantityAllocated: string; flatRate: string }) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-semibold text-slate-700">
        Pricing Type
        <select value={value.pricingType} onChange={(event) => onChange({ ...value, pricingType: event.target.value as PricingType })} className="mt-2 h-10 w-full rounded-md border border-[#efb6b0] bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20">
          <option value="PER_UNIT">Per Unit</option>
          <option value="FLAT_RATE">Flat Rate</option>
        </select>
      </label>
      <Field label="Quantity Allocated" type="number" min="1" value={value.quantityAllocated} onChange={(quantityAllocated) => onChange({ ...value, quantityAllocated })} required />
      {value.pricingType === 'FLAT_RATE' && <Field label="Flat Rate" type="number" min="0.01" step="0.01" value={value.flatRate} onChange={(flatRate) => onChange({ ...value, flatRate })} required />}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required = false, min, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; min?: string; step?: string }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} required={required} min={min} step={step} className="mt-2 h-10 w-full rounded-md border border-[#efb6b0] bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20" />
    </label>
  )
}

function toAllocationPayload(inventoryId: number, eventId: number, form: { pricingType: PricingType; quantityAllocated: string; flatRate: string }) {
  const payload = {
    inventoryId,
    eventId,
    pricingType: form.pricingType,
    quantityAllocated: Number(form.quantityAllocated),
  }
  return form.pricingType === 'FLAT_RATE' ? { ...payload, flatRate: Number(form.flatRate) } : payload
}

function estimateTotal(unitPrice: number, form: { pricingType: PricingType; quantityAllocated: string; flatRate: string }) {
  if (form.pricingType === 'FLAT_RATE') return Number(form.flatRate || 0)
  return unitPrice * Number(form.quantityAllocated || 0)
}

function formatPricingType(value: PricingType) {
  return value === 'FLAT_RATE' ? 'Flat Rate' : 'Per Unit'
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return '-'
  return `KSh ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
}
