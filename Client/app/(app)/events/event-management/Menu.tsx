'use client'

import { CircleHelp, Loader2, PackageOpen, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AddPackageModal from '@/components/events/AddPackageModal'
import { ApiError } from '@/lib/api/client'
import {
  getEventMenuSelections,
  removePackageFromEvent,
  type EventMenuPackageSelectionResponse,
} from '@/lib/api/menu'
import type { EventRecord } from './event-data'
import { DataTable, OutlineButton, Panel, SectionHeading } from './components'
import { currency } from './EventTotals'

import EventSidebarActions from './EventSidebarActions'

function formatServiceType(serviceType: string | null): string | null {
  if (!serviceType) return null
  return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('-', ' ')
}

export default function Menu({
  event,
  onGenerateInvoice,
  onGenerateProposal,
}: {
  event: EventRecord
  onGenerateInvoice?: () => void
  onGenerateProposal?: () => void
}) {
  const [selections, setSelections] = useState<EventMenuPackageSelectionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [removingSelectionId, setRemovingSelectionId] = useState<number | null>(null)

  const loadSelections = useCallback(() => {
    setLoading(true)
    setError(null)
    return getEventMenuSelections(event.id)
      .then(setSelections)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load event packages.')
      )
      .finally(() => setLoading(false))
  }, [event.id])

  useEffect(() => {
    void loadSelections()
  }, [loadSelections])

  const menuItems = useMemo(
    () =>
      selections.flatMap((selection) =>
        (selection.menuItemNames ?? []).map((itemName) => ({
          key: `${selection.selectionId}-${itemName}`,
          itemName,
          packageName: selection.packageName,
        }))
      ),
    [selections]
  )

  const subtotal = useMemo(
    () =>
      selections.reduce(
        (total, selection) => total + Number(selection.pricePerPax ?? 0) * Number(selection.guestCount ?? 0),
        0
      ),
    [selections]
  )

  const handleRemoveSelection = async (selection: EventMenuPackageSelectionResponse) => {
    const confirmed = window.confirm(`Remove ${selection.packageName} from this event?`)
    if (!confirmed) return

    setRemovingSelectionId(selection.selectionId)
    setError(null)
    try {
      await removePackageFromEvent(selection.selectionId)
      await loadSelections()
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to remove package.')
    } finally {
      setRemovingSelectionId(null)
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.96fr)]">
        <div className="space-y-6">
          <Panel>
            <div className="mb-5 flex items-start justify-between border-b border-[#efb6b0] pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Packages</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Complete package offerings with multiple components
                </p>
              </div>
              {selections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-[#cc2622] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a01f1a]"
                >
                  <Plus className="h-4 w-4" />
                  Add Package
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading packages...
              </div>
            ) : error ? (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            ) : selections.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-slate-700">
                  <PackageOpen className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-bold">No Packages Added Yet</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
                  Start by adding a curated catering package to streamline your event menu.
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#cc2622] px-5 py-3 font-semibold text-white hover:bg-[#a01f1a]"
                >
                  <Plus className="h-5 w-5" />
                  Add First Package
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {selections.map((selection) => {
                  const serviceLabel = formatServiceType(selection.serviceType)
                  const lineTotal = Number(selection.pricePerPax ?? 0) * Number(selection.guestCount ?? 0)
                  return (
                    <li
                      key={selection.selectionId}
                      className="rounded-lg border border-[#efb6b0] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{selection.packageName}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {formatKshPerGuest(selection.pricePerPax)} per guest · {selection.guestCount} guests
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <p className="font-semibold text-[#cc2622]">{currency(lineTotal)}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelection(selection)}
                            disabled={removingSelectionId === selection.selectionId}
                            aria-label={`Remove ${selection.packageName}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {removingSelectionId === selection.selectionId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      {(serviceLabel || selection.minGuests != null) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {serviceLabel && (
                            <span className="rounded-full bg-[#edf4ff] px-2.5 py-0.5 text-xs font-medium text-slate-700">
                              {serviceLabel}
                            </span>
                          )}
                          {selection.minGuests != null && (
                            <span className="rounded-full bg-[#edf4ff] px-2.5 py-0.5 text-xs font-medium text-slate-700">
                              Min. {selection.minGuests} Pax
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>

          <Panel>
            <SectionHeading title="Menu Items" subtitle="Food items for this event" />
            {loading ? (
              <p className="text-sm text-slate-600">Loading menu items...</p>
            ) : error ? (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            ) : selections.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#efb6b0] px-6 text-center text-slate-600">
                <PackageOpen className="h-9 w-9" />
                <p className="mt-4 text-sm font-medium">
                  Add a package to see the menu items included for this event.
                </p>
              </div>
            ) : menuItems.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#efb6b0] px-6 text-center text-slate-600">
                <PackageOpen className="h-9 w-9" />
                <p className="mt-4 text-sm font-medium">The selected package has no menu items linked yet.</p>
              </div>
            ) : (
              <>
                <DataTable
                  headers={['Item', 'Package']}
                  rows={menuItems.map((item) => [
                    <span key={`${item.key}-name`} className="font-semibold text-slate-900">
                      {item.itemName}
                    </span>,
                    item.packageName,
                  ])}
                />
                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xl font-bold">Subtotal: {currency(subtotal)}</p>
                  <OutlineButton className="border-[#cc2622] text-[#cc2622]">
                    <Plus className="h-5 w-5" />
                    Add Menu Item
                  </OutlineButton>
                </div>
              </>
            )}
          </Panel>
        </div>
        <div className="space-y-6">
          <EventSidebarActions
            eventId={event.id}
            liveTotals={{ MENU_PACKAGE: subtotal }}
            onGenerateInvoice={onGenerateInvoice}
            onGenerateProposal={onGenerateProposal}
          />
          <Panel className="border-blue-200 bg-blue-50 text-center">
            <CircleHelp className="mx-auto h-11 w-11 text-[#cc2622]" />
            <h3 className="mt-5 text-lg font-bold">Need assistance?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Our kitchen and logistics teams are available 24/7 for event support.
            </p>
            <button className="mt-5 text-sm font-semibold text-[#cc2622] hover:underline">
              Contact Support Center
            </button>
          </Panel>
        </div>
      </div>

      <AddPackageModal
        isOpen={modalOpen}
        eventId={event.id}
        onClose={() => setModalOpen(false)}
        onAdded={loadSelections}
      />
    </>
  )
}

function formatKshPerGuest(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0)
  if (Number.isNaN(value)) return 'KSh 0'
  return `KSh ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
