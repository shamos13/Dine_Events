'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Archive, CircleHelp, Loader2, PackagePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import {
  createInventory,
  createInventoryAllocation,
  deleteInventoryAllocation,
  getInventory,
  getInventoryAllocations,
  getInventoryAllocationsByEvent,
  updateInventoryAllocation,
  type InventoryAllocationResponse,
  type InventoryRequest,
  type InventoryResponse,
  type PricingType,
} from '@/lib/api/inventory'
import type { EventRecord } from './event-data'
import { Panel, SectionHeading } from './components'
import EventSidebarActions from './EventSidebarActions'

const emptyInventoryForm = {
  inventoryName: '',
  inventoryQuantity: '',
  unitPrice: '',
}

export default function Rentals({
  event,
  onGenerateInvoice,
  onGenerateProposal,
}: {
  event: EventRecord
  onGenerateInvoice?: () => void
  onGenerateProposal?: () => void
}) {
  const [allocations, setAllocations] = useState<InventoryAllocationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryAllocationResponse | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [adjustingId, setAdjustingId] = useState<number | null>(null)
  const [adjustMessage, setAdjustMessage] = useState<string | null>(null)

  const loadAllocations = () => {
    setLoading(true)
    setError(null)
    return getInventoryAllocationsByEvent(event.id)
      .then(setAllocations)
      .catch(() =>
        getInventoryAllocations().then((items) =>
          setAllocations(items.filter((item) => item.eventId === event.id || item.eventName === event.name))
        )
      )
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load rental items.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    void loadAllocations()
  }, [event.id, event.name])

  const subtotal = allocations.reduce((total, item) => total + Number(item.totalCost ?? 0), 0)
  const cancelled = event.status === 'CANCELLED'

  const handleDelete = async (allocation: InventoryAllocationResponse) => {
    if (!window.confirm(`Remove "${allocation.inventoryName}" from this event?`)) return
    setDeletingId(allocation.allocationId)
    setError(null)
    setAdjustMessage(null)
    try {
      await deleteInventoryAllocation(allocation.allocationId)
      await loadAllocations()
      setAdjustMessage(`Removed ${allocation.inventoryName}. Generate a new proposal to refresh the quotation.`)
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to delete rental item.')
    } finally {
      setDeletingId(null)
    }
  }

  const adjustQuantity = async (allocation: InventoryAllocationResponse, nextQty: number) => {
    if (nextQty < 1) {
      await handleDelete(allocation)
      return
    }
    const maxQty = (allocation.availableQuantity ?? 0) + (allocation.quantityAllocated ?? 0)
    if (nextQty > maxQty) {
      setError(`Only ${maxQty} available for ${allocation.inventoryName}.`)
      return
    }
    setAdjustingId(allocation.allocationId)
    setError(null)
    setAdjustMessage(null)
    try {
      await updateInventoryAllocation(allocation.allocationId, {
        pricingType: allocation.pricingType,
        quantityAllocated: nextQty,
        flatRate: allocation.pricingType === 'FLAT_RATE' ? Number(allocation.flatRate ?? 0) : undefined,
      })
      await loadAllocations()
      setAdjustMessage(
        `Updated ${allocation.inventoryName} to qty ${nextQty}. Generate a new proposal so the quotation reflects the change.`
      )
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to adjust quantity.')
    } finally {
      setAdjustingId(null)
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.96fr)]">
        <div className="space-y-6">
          <Panel className="p-0">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeading
                title="Rental Items"
                subtitle="Equipment allocated to this event — edit or reduce quantities when a client requests an adjustment"
              />
              {!cancelled && (
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#cc2622] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a01f1a]"
                >
                  <Plus className="h-5 w-5" />
                  Add Rental Item
                </button>
              )}
            </div>
            {cancelled && (
              <div className="px-6 pb-2">
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  This event is cancelled. Rental items cannot be added.
                </p>
              </div>
            )}
            {adjustMessage && (
              <div className="px-6 pb-2">
                <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  {adjustMessage}
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading rental items...
              </div>
            ) : error ? (
              <div className="p-6">
                <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </p>
              </div>
            ) : allocations.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ff] text-[#cc2622]">
                  <Archive className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">No rental items added yet</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Allocated inventory from the server will appear here for this event.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-sm">
                  <thead>
                    <tr className="border-y border-[#efb6b0] bg-[#edf4ff] text-xs font-semibold uppercase tracking-[0.08em] text-[#3b1d1a]">
                      <th className="px-6 py-4 text-left">Item</th>
                      <th className="px-6 py-4 text-left">Pricing</th>
                      <th className="px-6 py-4 text-right">Quantity</th>
                      <th className="px-6 py-4 text-right">Unit Price</th>
                      <th className="px-6 py-4 text-right">Flat Rate</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      {!cancelled && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((allocation) => (
                      <tr key={allocation.allocationId} className="border-b border-[#efb6b0]">
                        <td className="px-6 py-6 align-middle">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#dce9ff] text-[#cc2622]">
                              <Archive className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-950">{allocation.inventoryName}</p>
                              <p className="mt-1 text-sm text-[#3b1d1a]">{allocation.clientName ?? event.client}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 align-middle text-slate-950">{formatPricingType(allocation.pricingType)}</td>
                        <td className="px-6 py-6 text-right align-middle text-slate-950">
                          {!cancelled ? (
                            <div className="inline-flex items-center justify-end gap-2">
                              <button
                                type="button"
                                aria-label={`Decrease ${allocation.inventoryName} quantity`}
                                disabled={adjustingId === allocation.allocationId}
                                onClick={() =>
                                  void adjustQuantity(allocation, Number(allocation.quantityAllocated ?? 1) - 1)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#efb6b0] text-lg font-bold text-slate-700 transition hover:border-[#cc2622] hover:text-[#cc2622] disabled:opacity-50"
                              >
                                −
                              </button>
                              <span className="min-w-8 text-center font-semibold">
                                {adjustingId === allocation.allocationId ? (
                                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                                ) : (
                                  allocation.quantityAllocated ?? '-'
                                )}
                              </span>
                              <button
                                type="button"
                                aria-label={`Increase ${allocation.inventoryName} quantity`}
                                disabled={
                                  adjustingId === allocation.allocationId ||
                                  Number(allocation.quantityAllocated ?? 0) >=
                                    (allocation.availableQuantity ?? 0) + (allocation.quantityAllocated ?? 0)
                                }
                                onClick={() =>
                                  void adjustQuantity(allocation, Number(allocation.quantityAllocated ?? 0) + 1)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#efb6b0] text-lg font-bold text-slate-700 transition hover:border-[#cc2622] hover:text-[#cc2622] disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            allocation.quantityAllocated ?? '-'
                          )}
                        </td>
                        <td className="px-6 py-6 text-right align-middle text-slate-950">
                          {formatCurrency(allocation.unitPriceAtAllocation)}
                        </td>
                        <td className="px-6 py-6 text-right align-middle text-slate-950">
                          {formatCurrency(allocation.flatRate)}
                        </td>
                        <td className="px-6 py-6 text-right align-middle font-bold text-slate-950">
                          {formatCurrency(allocation.totalCost)}
                        </td>
                        {!cancelled && (
                          <td className="px-6 py-6 text-right align-middle">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                aria-label={`Edit ${allocation.inventoryName}`}
                                onClick={() => setEditing(allocation)}
                                className="rounded-md border border-[#efb6b0] p-2 text-slate-700 transition hover:border-[#cc2622] hover:text-[#cc2622]"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${allocation.inventoryName}`}
                                disabled={deletingId === allocation.allocationId}
                                onClick={() => handleDelete(allocation)}
                                className="rounded-md border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingId === allocation.allocationId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        )}
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
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#dce9ff] text-[#cc2622]">
                  <CircleHelp className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950">Need assistance?</h3>
                  <p className="mt-1 text-sm text-[#3b1d1a]">
                    Our equipment specialists are available 24/7 for rental support.
                  </p>
                </div>
              </div>
              <button className="inline-flex items-center gap-2 text-sm font-bold text-[#cc2622] transition hover:underline">
                Contact Support Center
              </button>
            </div>
          </Panel>
        </div>

        <EventSidebarActions
          eventId={event.id}
          eventStatus={event.status}
          discountPercent={event.discountPercent}
          liveTotals={{ RENTAL: subtotal }}
          onGenerateInvoice={onGenerateInvoice}
          onGenerateProposal={onGenerateProposal}
        />
      </div>

      {drawerOpen && !cancelled && (
        <AddRentalDrawer
          eventId={event.id}
          allocatedInventoryNames={allocations.map((allocation) => allocation.inventoryName)}
          onClose={() => setDrawerOpen(false)}
          onAllocated={loadAllocations}
        />
      )}

      {editing && !cancelled && (
        <EditRentalModal
          allocation={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            const name = editing.inventoryName
            setEditing(null)
            await loadAllocations()
            setAdjustMessage(
              `Updated ${name}. Generate a new proposal so the quotation reflects the change.`
            )
          }}
        />
      )}
    </>
  )
}

function EditRentalModal({
  allocation,
  onClose,
  onSaved,
}: {
  allocation: InventoryAllocationResponse
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [form, setForm] = useState({
    pricingType: allocation.pricingType,
    quantityAllocated: String(allocation.quantityAllocated ?? 1),
    flatRate: allocation.flatRate != null ? String(allocation.flatRate) : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const maxQty =
    (allocation.availableQuantity ?? 0) + (allocation.quantityAllocated ?? 0)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateInventoryAllocation(allocation.allocationId, {
        pricingType: form.pricingType,
        quantityAllocated: Number(form.quantityAllocated),
        flatRate: form.pricingType === 'FLAT_RATE' ? Number(form.flatRate) : undefined,
      })
      await onSaved()
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to update rental item.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-md rounded-lg border border-[#efb6b0] bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Edit rental</h2>
            <p className="mt-1 text-sm text-slate-600">{allocation.inventoryName}</p>
            <p className="mt-1 text-xs text-slate-500">
              Available to assign: {maxQty} (includes this allocation)
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-4">
          <AllocationFields value={form} onChange={setForm} maxQuantity={maxQty} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#efb6b0] px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-[#cc2622] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}

function AddRentalDrawer({
  eventId,
  allocatedInventoryNames,
  onClose,
  onAllocated,
}: {
  eventId: number
  allocatedInventoryNames: string[]
  onClose: () => void
  onAllocated: () => Promise<void>
}) {
  const [inventory, setInventory] = useState<InventoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [savingNew, setSavingNew] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyInventoryForm)
  const [allocationForms, setAllocationForms] = useState<
    Record<number, { pricingType: PricingType; quantityAllocated: string; flatRate: string }>
  >({})
  const [newAllocation, setNewAllocation] = useState<{
    pricingType: PricingType
    quantityAllocated: string
    flatRate: string
  }>({ pricingType: 'PER_UNIT', quantityAllocated: '1', flatRate: '' })

  useEffect(() => {
    setLoading(true)
    getInventory()
      .then(setInventory)
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load inventory.'))
      .finally(() => setLoading(false))
  }, [])

  const allocated = useMemo(() => new Set(allocatedInventoryNames), [allocatedInventoryNames])
  const filteredInventory = inventory.filter((item) => item.inventoryName.toLowerCase().includes(query.toLowerCase()))

  const getAllocationForm = (inventoryId: number) =>
    allocationForms[inventoryId] ?? { pricingType: 'PER_UNIT', quantityAllocated: '1', flatRate: '' }
  const updateAllocationForm = (
    inventoryId: number,
    values: Partial<{ pricingType: PricingType; quantityAllocated: string; flatRate: string }>
  ) => {
    setAllocationForms((current) => ({ ...current, [inventoryId]: { ...getAllocationForm(inventoryId), ...values } }))
  }

  const allocateInventory = async (item: InventoryResponse) => {
    const available = item.availableQuantity ?? item.inventoryQuantity
    if (available <= 0) {
      setError(`No available stock for ${item.inventoryName}.`)
      return
    }
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
            <p className="mt-2 text-sm text-slate-600">
              Choose existing inventory or create a new inventory entry. Available qty shows what is free to assign.
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-2 text-[#4a241f] transition hover:bg-red-50 hover:text-[#cc2622]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="relative">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search inventory..."
              className="h-14 w-full rounded-md border border-[#efb6b0] bg-white px-4 pr-12 text-base text-slate-950 outline-none transition focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20"
            />
          </div>

          <button
            onClick={() => setCreating((value) => !value)}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#efb6b0] bg-[#edf4ff] text-sm font-bold text-slate-950 transition hover:border-[#cc2622] hover:text-[#cc2622]"
          >
            <PackagePlus className="h-5 w-5" />
            Create New Inventory
          </button>

          {error && (
            <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {creating && (
            <form onSubmit={createAndAllocateInventory} className="mt-5 space-y-4 rounded-lg border border-[#efb6b0] bg-white p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Inventory Name"
                  value={form.inventoryName}
                  onChange={(value) => setForm((current) => ({ ...current, inventoryName: value }))}
                  required
                />
                <Field
                  label="Available Quantity"
                  type="number"
                  min="1"
                  value={form.inventoryQuantity}
                  onChange={(value) => setForm((current) => ({ ...current, inventoryQuantity: value }))}
                  required
                />
                <Field
                  label="Unit Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(value) => setForm((current) => ({ ...current, unitPrice: value }))}
                  required
                />
              </div>
              <AllocationFields value={newAllocation} onChange={setNewAllocation} />
              <button
                disabled={savingNew}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#cc2622] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a01f1a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingNew && <Loader2 className="h-4 w-4 animate-spin" />}
                Create And Add
              </button>
            </form>
          )}

          <div className="mt-5 overflow-hidden rounded-lg border border-[#efb6b0] bg-white">
            {loading ? (
              <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading inventory...
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="p-5 text-sm text-slate-600">No inventory found.</div>
            ) : (
              filteredInventory.map((item) => {
                const isAllocated = allocated.has(item.inventoryName)
                const available = item.availableQuantity ?? item.inventoryQuantity
                const outOfStock = available <= 0
                const allocationForm = getAllocationForm(item.inventoryId)
                const estimate = estimateTotal(item.unitPrice, allocationForm)
                return (
                  <div key={item.inventoryId} className="border-b border-[#efb6b0] p-5 last:border-b-0">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-950">{item.inventoryName}</h3>
                          {isAllocated && (
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-[#cc2622]">
                              Added
                            </span>
                          )}
                          {outOfStock && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                              No stock
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-[#3b1d1a]">
                          <span className="font-semibold text-slate-900">Qty available: {available}</span>
                          <span className="text-slate-500">
                            {' '}
                            / {item.inventoryQuantity} in catalog · Unit {formatCurrency(item.unitPrice)}
                          </span>
                        </p>
                      </div>
                      <span className="shrink-0 text-base font-bold text-slate-950">{formatCurrency(estimate)}</span>
                    </div>
                    <div className="mt-4">
                      <AllocationFields
                        value={allocationForm}
                        onChange={(value) => updateAllocationForm(item.inventoryId, value)}
                        maxQuantity={available}
                      />
                    </div>
                    <button
                      disabled={isAllocated || outOfStock || savingId !== null}
                      onClick={() => allocateInventory(item)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#cc2622] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a01f1a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
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
          <button
            onClick={onClose}
            className="rounded-md border border-[#efb6b0] px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-red-50"
          >
            Cancel
          </button>
        </div>
      </aside>
    </div>
  )
}

function AllocationFields({
  value,
  onChange,
  maxQuantity,
}: {
  value: { pricingType: PricingType; quantityAllocated: string; flatRate: string }
  onChange: (value: { pricingType: PricingType; quantityAllocated: string; flatRate: string }) => void
  maxQuantity?: number
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-semibold text-slate-700">
        Pricing Type
        <select
          value={value.pricingType}
          onChange={(event) => onChange({ ...value, pricingType: event.target.value as PricingType })}
          className="mt-2 h-10 w-full rounded-md border border-[#efb6b0] bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20"
        >
          <option value="PER_UNIT">Per Unit</option>
          <option value="FLAT_RATE">Flat Rate</option>
        </select>
      </label>
      <Field
        label={maxQuantity != null ? `Quantity (max ${maxQuantity})` : 'Quantity Allocated'}
        type="number"
        min="1"
        max={maxQuantity != null ? String(maxQuantity) : undefined}
        value={value.quantityAllocated}
        onChange={(quantityAllocated) => onChange({ ...value, quantityAllocated })}
        required
      />
      {value.pricingType === 'FLAT_RATE' && (
        <Field
          label="Flat Rate"
          type="number"
          min="0.01"
          step="0.01"
          value={value.flatRate}
          onChange={(flatRate) => onChange({ ...value, flatRate })}
          required
        />
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  min,
  max,
  step,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  min?: string
  max?: string
  step?: string
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
        min={min}
        max={max}
        step={step}
        className="mt-2 h-10 w-full rounded-md border border-[#efb6b0] bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20"
      />
    </label>
  )
}

function toAllocationPayload(
  inventoryId: number,
  eventId: number,
  form: { pricingType: PricingType; quantityAllocated: string; flatRate: string }
) {
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
