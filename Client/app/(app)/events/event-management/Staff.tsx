'use client'

import Image from 'next/image'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { CircleHelp, Loader2, Pencil, Plus, Search, Trash2, UserPlus, X } from 'lucide-react'
import ImageUpload from '@/components/ui/ImageUpload'
import { ApiError } from '@/lib/api/client'
import {
  createStaff,
  createStaffAssignment,
  formatStaffPrice,
  formatStaffPricingMethod,
  getStaff,
  getStaffAssignmentsByEvent,
  removeStaffAssignment,
  type StaffAssignmentResponse,
  type StaffPricingMethod,
  type StaffRequest,
  type StaffResponse,
  updateStaff,
} from '@/lib/api/staff'
import type { EventRecord } from './event-data'
import { Panel, SectionHeading } from './components'
import EventSidebarActions from './EventSidebarActions'

const emptyForm = {
  staffName: '',
  staffEmail: '',
  staffPhone: '',
  staffRole: '',
  staffSalary: '',
  pricingMethod: 'FLAT_RATE' as StaffPricingMethod,
  profileImageUrl: '' as string | null,
  responsibilities: '',
}

export default function Staff({
  event,
  onGenerateInvoice,
  onGenerateProposal,
}: {
  event: EventRecord
  onGenerateInvoice?: () => void
  onGenerateProposal?: () => void
}) {
  const [assignments, setAssignments] = useState<StaffAssignmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const loadAssignments = () => {
    setLoading(true)
    setError(null)
    return getStaffAssignmentsByEvent(event.id)
      .then(setAssignments)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load staff assignments.')
      )
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    void loadAssignments()
  }, [event.id])

  const cancelled = event.status === 'CANCELLED'

  const handleRemove = async (assignment: StaffAssignmentResponse) => {
    if (cancelled) return
    const confirmed = window.confirm(`Remove ${assignment.staffName} from this event?`)
    if (!confirmed) return

    setRemovingId(assignment.staffAssignmentId)
    setError(null)
    try {
      await removeStaffAssignment(assignment.staffAssignmentId)
      await loadAssignments()
    } catch (reason: unknown) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to remove staff assignment.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.96fr)]">
        <Panel className="p-6">
          <SectionHeading title="Staff Roles" subtitle="Manage your staff roles and pricing structures." />
          {cancelled && (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              This event is cancelled. Staff cannot be assigned.
            </p>
          )}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading staff assignments...
            </div>
          ) : error ? (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          ) : assignments.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ff] text-[#cc2622]">
                <UserPlus className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-950">No staff assigned yet</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Assign staff roles with pricing so your event totals stay accurate.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full text-sm">
                <thead>
                  <tr className="border-b border-[#efb6b0] bg-[#edf4ff] text-xs font-semibold uppercase tracking-[0.08em] text-[#3b1d1a]">
                    <th className="px-5 py-4 text-left">Staff Name</th>
                    <th className="px-5 py-4 text-left">Responsibilities</th>
                    <th className="px-5 py-4 text-left">Pricing Method</th>
                    <th className="px-5 py-4 text-right">Default Price</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.staffAssignmentId} className="border-b border-[#efb6b0]">
                      <td className="px-5 py-7 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[#efb6b0] bg-[#dce9ff]">
                            <Image
                              src={assignment.profileImageUrl || '/placeholder-user.jpg'}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-950">
                              {assignment.staffName}{' '}
                              <span className="font-semibold text-slate-700">
                                ({assignment.roleForEvent ?? assignment.staffRole})
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[360px] px-5 py-7 align-middle leading-6 text-[#3b1d1a]">
                        {formatResponsibilities(assignment.responsibilities)}
                      </td>
                      <td className="px-5 py-7 align-middle text-slate-950">
                        {formatStaffPricingMethod(assignment.pricingMethod)}
                      </td>
                      <td className="px-5 py-7 text-right align-middle">
                        <span className="font-bold text-slate-950">
                          {formatStaffPrice(assignment.salaryAtAssignment, assignment.pricingMethod)}
                        </span>
                      </td>
                      <td className="px-5 py-7 align-middle">
                        <div className="flex justify-end gap-5 text-[#4a241f]">
                          <button
                            type="button"
                            aria-label={`Edit ${assignment.staffName}`}
                            disabled={cancelled}
                            onClick={() => {
                              setEditingStaffId(assignment.staffId)
                              setDrawerOpen(true)
                            }}
                            className="transition hover:text-[#cc2622] disabled:opacity-40"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${assignment.staffName}`}
                            disabled={cancelled || removingId === assignment.staffAssignmentId}
                            onClick={() => void handleRemove(assignment)}
                            className="transition hover:text-[#cc2622] disabled:opacity-40"
                          >
                            {removingId === assignment.staffAssignmentId ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!cancelled && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingStaffId(null)
                  setDrawerOpen(true)
                }}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#cc2622] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a01f1a]"
              >
                <UserPlus className="h-5 w-5" />
                Add Staff Member
              </button>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <EventSidebarActions
            eventId={event.id}
            eventStatus={event.status}
            discountPercent={event.discountPercent}
            onGenerateInvoice={onGenerateInvoice}
            onGenerateProposal={onGenerateProposal}
          />
          <Panel className="border-[#efb6b0] bg-[#dce9ff] p-8 text-center">
            <CircleHelp className="mx-auto h-11 w-11 text-[#cc2622]" />
            <h3 className="mt-5 text-base font-bold text-slate-950">Need assistance?</h3>
            <p className="mt-3 text-sm leading-6 text-[#3b1d1a]">
              Our kitchen and logistics teams are available 24/7 for event support.
            </p>
            <button type="button" className="mt-6 text-sm font-bold text-[#cc2622] transition hover:underline">
              Contact Support Center
            </button>
          </Panel>
        </div>
      </div>

      {drawerOpen && !cancelled && (
        <AddStaffDrawer
          eventId={event.id}
          editingStaffId={editingStaffId}
          assignedStaffIds={assignments.map((assignment) => assignment.staffId)}
          onClose={() => {
            setDrawerOpen(false)
            setEditingStaffId(null)
          }}
          onAssigned={loadAssignments}
        />
      )}
    </>
  )
}

function AddStaffDrawer({
  eventId,
  editingStaffId,
  assignedStaffIds,
  onClose,
  onAssigned,
}: {
  eventId: number
  editingStaffId: number | null
  assignedStaffIds: number[]
  onClose: () => void
  onAssigned: () => Promise<void>
}) {
  const [staff, setStaff] = useState<StaffResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [savingNew, setSavingNew] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(Boolean(editingStaffId))
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setLoading(true)
    getStaff()
      .then((members) => {
        setStaff(members)
        if (editingStaffId) {
          const member = members.find((item) => item.staffId === editingStaffId)
          if (member) {
            setCreating(true)
            setForm({
              staffName: member.staffName,
              staffEmail: member.staffEmail ?? '',
              staffPhone: member.staffPhone,
              staffRole: member.staffRole,
              staffSalary: String(member.staffSalary ?? ''),
              pricingMethod: member.pricingMethod ?? 'FLAT_RATE',
              profileImageUrl: member.profileImageUrl,
              responsibilities: member.responsibilities?.join(', ') ?? '',
            })
          }
        }
      })
      .catch((reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'Unable to load staff.'))
      .finally(() => setLoading(false))
  }, [editingStaffId])

  const assigned = useMemo(() => new Set(assignedStaffIds), [assignedStaffIds])
  const filteredStaff = staff.filter((member) => {
    const haystack = `${member.staffName} ${member.staffRole} ${member.responsibilities?.join(' ') ?? ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  const assignExistingStaff = async (member: StaffResponse) => {
    setSavingId(member.staffId)
    setError(null)
    try {
      await createStaffAssignment({ staffId: member.staffId, eventId, salaryAtAssignment: member.staffSalary })
      await onAssigned()
      onClose()
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to assign staff member.')
    } finally {
      setSavingId(null)
    }
  }

  const saveStaffForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavingNew(true)
    setError(null)

    const salary = Number(form.staffSalary)
    const payload: StaffRequest = {
      staffName: form.staffName.trim(),
      staffPhone: form.staffPhone.trim(),
      staffRole: form.staffRole.trim(),
      staffSalary: salary,
      pricingMethod: form.pricingMethod,
      responsibilities: splitResponsibilities(form.responsibilities),
    }
    if (form.staffEmail.trim()) payload.staffEmail = form.staffEmail.trim()
    if (form.profileImageUrl) payload.profileImageUrl = form.profileImageUrl

    try {
      if (editingStaffId) {
        await updateStaff(editingStaffId, payload)
      } else {
        const created = await createStaff(payload)
        await createStaffAssignment({
          staffId: created.staffId,
          eventId,
          salaryAtAssignment: created.staffSalary,
        })
      }
      await onAssigned()
      onClose()
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to save staff member.')
    } finally {
      setSavingNew(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
      <button aria-label="Close add staff panel" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[520px] flex-col border-l border-[#efb6b0] bg-[#f7f8fc] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#efb6b0] px-8 py-7">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              {editingStaffId ? 'Edit Staff Role' : 'Add Staff Role'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {editingStaffId
                ? 'Update staff details, pricing, and profile image.'
                : 'Choose a catalog staff member or create a new one.'}
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
          {!editingStaffId && (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search..."
                  className="h-14 w-full rounded-md border border-[#efb6b0] bg-white px-4 pr-12 text-base text-slate-950 outline-none transition focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreating((value) => !value)
                  setForm(emptyForm)
                }}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#efb6b0] bg-[#edf4ff] text-sm font-bold text-slate-950 transition hover:border-[#cc2622] hover:text-[#cc2622]"
              >
                <Plus className="h-5 w-5" />
                Create New
              </button>
            </>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {(creating || editingStaffId) && (
            <form onSubmit={saveStaffForm} className="mt-5 space-y-4 rounded-lg border border-[#efb6b0] bg-white p-5">
              <ImageUpload
                value={form.profileImageUrl}
                onChange={(url) => setForm((current) => ({ ...current, profileImageUrl: url }))}
                folder="staff"
                label="Profile photo"
                shape="circle"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Staff Name"
                  value={form.staffName}
                  onChange={(value) => setForm((current) => ({ ...current, staffName: value }))}
                  required
                />
                <Field
                  label="Role"
                  value={form.staffRole}
                  onChange={(value) => setForm((current) => ({ ...current, staffRole: value }))}
                  required
                />
                <Field
                  label="Phone"
                  value={form.staffPhone}
                  onChange={(value) => setForm((current) => ({ ...current, staffPhone: value }))}
                  required
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.staffEmail}
                  onChange={(value) => setForm((current) => ({ ...current, staffEmail: value }))}
                />
                <label className="block text-sm font-semibold text-slate-700">
                  Pricing Method
                  <select
                    value={form.pricingMethod}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        pricingMethod: event.target.value as StaffPricingMethod,
                      }))
                    }
                    className="mt-2 h-10 w-full rounded-md border border-[#efb6b0] bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20"
                  >
                    <option value="FLAT_RATE">Flat rate</option>
                    <option value="HOURLY">Hourly</option>
                  </select>
                </label>
                <Field
                  label={form.pricingMethod === 'HOURLY' ? 'Default Price / hr' : 'Default Price'}
                  type="number"
                  min="1"
                  value={form.staffSalary}
                  onChange={(value) => setForm((current) => ({ ...current, staffSalary: value }))}
                  required
                />
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                Responsibilities
                <textarea
                  value={form.responsibilities}
                  onChange={(event) => setForm((current) => ({ ...current, responsibilities: event.target.value }))}
                  rows={3}
                  placeholder="Greeting guests, plating, cleanup..."
                  className="mt-2 w-full rounded-md border border-[#efb6b0] bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none transition focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20"
                />
              </label>
              <button
                disabled={savingNew}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#cc2622] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#a01f1a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingNew && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingStaffId ? 'Save Changes' : 'Create And Assign'}
              </button>
            </form>
          )}

          {!editingStaffId && (
            <div className="mt-5 overflow-hidden rounded-lg border border-[#efb6b0] bg-white">
              {loading ? (
                <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading staff...
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="p-5 text-sm text-slate-600">No staff found.</div>
              ) : (
                filteredStaff.map((member) => {
                  const isAssigned = assigned.has(member.staffId)
                  return (
                    <button
                      key={member.staffId}
                      disabled={isAssigned || savingId !== null}
                      onClick={() => assignExistingStaff(member)}
                      className="block w-full border-b border-[#efb6b0] p-5 text-left transition last:border-b-0 hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div className="flex items-start gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#efb6b0] bg-[#edf4ff]">
                            <Image
                              src={member.profileImageUrl || '/placeholder-user.jpg'}
                              alt=""
                              fill
                              sizes="44px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold text-slate-950">{member.staffName}</h3>
                              <span className="rounded-full bg-[#edf4ff] px-2.5 py-1 text-xs font-bold text-slate-700">
                                {member.staffRole}
                              </span>
                              {isAssigned && (
                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-[#cc2622]">
                                  Assigned
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {formatStaffPricingMethod(member.pricingMethod)}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[#3b1d1a]">
                              {formatResponsibilities(member.responsibilities)}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-lg font-bold text-slate-950">
                          {formatStaffPrice(member.staffSalary, member.pricingMethod)}
                        </span>
                      </div>
                      {savingId === member.staffId && (
                        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#cc2622]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Assigning
                        </p>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[#efb6b0] bg-white px-8 py-5">
          <button
            type="button"
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

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  min,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  min?: string
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
        className="mt-2 h-10 w-full rounded-md border border-[#efb6b0] bg-white px-3 text-sm font-normal text-slate-950 outline-none transition focus:border-[#cc2622] focus:ring-2 focus:ring-[#cc2622]/20"
      />
    </label>
  )
}

function splitResponsibilities(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatResponsibilities(responsibilities: string[] | null | undefined) {
  return responsibilities?.length ? responsibilities.join(', ') : 'No responsibilities recorded'
}
