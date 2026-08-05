'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Banknote, Boxes, CalendarRange, Download, FileDown, RefreshCw, UserCog, Users } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { StatusPill } from '@/components/ui/status-pill'
import { ApiError } from '@/lib/api/client'
import { formatKsh } from '@/lib/api/menu'
import {
  getClientsReport,
  getEventsReport,
  getFinancialReport,
  getInventoryReport,
  getStaffReport,
  type ClientsReport,
  type EventsReport,
  type FinancialReport,
  type InventoryReport,
  type StaffReport,
} from '@/lib/api/reports'
import {
  downloadClientsReportPdf,
  downloadEventsReportPdf,
  downloadFinancialReportPdf,
  downloadInventoryReportPdf,
  downloadStaffReportPdf,
} from '@/lib/reports/pdf'

type TabKey = 'financial' | 'events' | 'clients' | 'staff' | 'inventory'

const TABS: { key: TabKey; label: string; icon: typeof Banknote }[] = [
  { key: 'financial', label: 'Financial', icon: Banknote },
  { key: 'events', label: 'Events', icon: CalendarRange },
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'staff', label: 'Staff', icon: UserCog },
  { key: 'inventory', label: 'Inventory', icon: Boxes },
]

function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (value: string | number | null | undefined) => {
    const text = value == null ? '' : String(value)
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

function ExportButtons({ onCsv, onPdf }: { onCsv: () => void; onPdf: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onCsv}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
      >
        <Download className="h-4 w-4" /> Export CSV
      </button>
      <button
        type="button"
        onClick={onPdf}
        className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-4 py-2 text-sm font-semibold text-white hover:bg-[#A01F1A]"
      >
        <Download className="h-4 w-4" /> Export PDF
      </button>
    </div>
  )
}

function MissingReport({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
      {label} report could not be loaded.{' '}
      <button type="button" onClick={onRetry} className="font-semibold underline">
        Try again
      </button>
    </p>
  )
}

export default function Reports() {
  const [tab, setTab] = useState<TabKey>('financial')
  const [financial, setFinancial] = useState<FinancialReport | null>(null)
  const [events, setEvents] = useState<EventsReport | null>(null)
  const [clients, setClients] = useState<ClientsReport | null>(null)
  const [staff, setStaff] = useState<StaffReport | null>(null)
  const [inventory, setInventory] = useState<InventoryReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)

    const settle = <T,>(promise: Promise<T>) =>
      promise.then(
        (value) => ({ ok: true as const, value }),
        (reason: unknown) => ({
          ok: false as const,
          message: reason instanceof ApiError ? reason.message : 'Unable to generate this report.',
        })
      )

    Promise.all([
      settle(getFinancialReport()),
      settle(getEventsReport()),
      settle(getClientsReport()),
      settle(getStaffReport()),
      settle(getInventoryReport()),
    ])
      .then(([financialResult, eventsResult, clientsResult, staffResult, inventoryResult]) => {
        setFinancial(financialResult.ok ? financialResult.value : null)
        setEvents(eventsResult.ok ? eventsResult.value : null)
        setClients(clientsResult.ok ? clientsResult.value : null)
        setStaff(staffResult.ok ? staffResult.value : null)
        setInventory(inventoryResult.ok ? inventoryResult.value : null)

        const failures = [
          financialResult,
          eventsResult,
          clientsResult,
          staffResult,
          inventoryResult,
        ].filter((result) => !result.ok)
        if (failures.length === 5) {
          setError(failures[0].ok === false ? failures[0].message : 'Unable to generate reports.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const maxMonthlyNet = useMemo(
    () => Math.max(1, ...(financial?.monthly ?? []).map((entry) => Math.abs(entry.net))),
    [financial]
  )
  const maxMonthlyEvents = useMemo(
    () => Math.max(1, ...(events?.monthly ?? []).map((entry) => entry.count)),
    [events]
  )

  const outstandingInvoices = financial?.outstandingInvoices ?? []
  const refunds = financial?.refunds ?? []

  const exportFinancialCsv = () => {
    if (!financial) return
    downloadCsv(
      `financial-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Payment ID', 'Invoice', 'Client', 'Amount (KSh)', 'Method', 'Status', 'M-Pesa Receipt', 'Date'],
      financial.payments.map((payment) => [
        payment.paymentId,
        payment.invoiceNumber,
        payment.clientName ?? '',
        payment.amount,
        payment.paymentMethod,
        payment.paymentStatus,
        payment.mpesaReceiptNumber ?? '',
        payment.completedAt ?? payment.initiatedAt ?? '',
      ])
    )
  }

  const exportOutstandingCsv = () => {
    if (!financial) return
    downloadCsv(
      `outstanding-payments-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Invoice', 'Client', 'Event', 'Amount Due', 'Paid', 'Balance', 'Due Date', 'Status', 'Overdue'],
      outstandingInvoices.map((invoice) => [
        invoice.invoiceNumber,
        invoice.clientName ?? '',
        invoice.eventName ?? '',
        invoice.amountDue,
        invoice.amountPaid,
        invoice.balance,
        invoice.dueDate ?? '',
        invoice.invoiceStatus,
        invoice.overdue ? 'Yes' : 'No',
      ])
    )
  }

  const exportRefundsCsv = () => {
    if (!financial) return
    downloadCsv(
      `refunds-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Payment ID', 'Invoice', 'Client', 'Event', 'Amount (KSh)', 'Reference', 'Note', 'Date'],
      refunds.map((payment) => [
        payment.paymentId,
        payment.invoiceNumber,
        payment.clientName ?? '',
        payment.eventName ?? '',
        payment.amount,
        payment.mpesaReceiptNumber ?? '',
        payment.failureReason ?? '',
        payment.completedAt ?? payment.initiatedAt ?? '',
      ])
    )
  }

  const exportEventsCsv = () => {
    if (!events) return
    downloadCsv(
      `events-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Event ID', 'Name', 'Client', 'Status', 'Guests', 'Venue', 'Date'],
      events.events.map((event) => [
        event.eventId,
        event.eventName,
        event.clientName ?? '',
        event.eventStatus,
        event.guestCount,
        event.eventVenue ?? '',
        event.eventDateTime,
      ])
    )
  }

  const exportClientsCsv = () => {
    if (!clients) return
    downloadCsv(
      `clients-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Client ID', 'Name', 'Company', 'Email', 'Events', 'Total Paid (KSh)'],
      clients.topClients.map((client) => [
        client.clientId,
        client.clientName,
        client.companyName ?? '',
        client.clientEmail ?? '',
        client.eventCount,
        client.totalPaid,
      ])
    )
  }

  const exportStaffCsv = () => {
    if (!staff) return
    downloadCsv(
      `staff-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Staff ID', 'Name', 'Role', 'Email', 'Phone', 'Rate (KSh)', 'Pricing', 'Assignments', 'Total Earned (KSh)'],
      staff.staff.map((member) => [
        member.staffId,
        member.staffName,
        member.staffRole ?? '',
        member.staffEmail ?? '',
        member.staffPhone ?? '',
        member.staffSalary,
        member.pricingMethod ?? '',
        member.assignmentCount,
        member.totalEarned,
      ])
    )
  }

  const exportInventoryCsv = () => {
    if (!inventory) return
    downloadCsv(
      `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Item ID', 'Name', 'Stock', 'Allocated', 'Available', 'Utilization %', 'Unit Price', 'Stock Value'],
      inventory.items.map((item) => [
        item.inventoryId,
        item.inventoryName,
        item.stockQuantity,
        item.allocatedQuantity,
        item.availableQuantity,
        item.utilizationPercent,
        item.unitPrice,
        item.stockValue,
      ])
    )
  }

  const exportActivePdf = () => {
    if (tab === 'financial' && financial) downloadFinancialReportPdf(financial)
    else if (tab === 'events' && events) downloadEventsReportPdf(events)
    else if (tab === 'clients' && clients) downloadClientsReportPdf(clients)
    else if (tab === 'staff' && staff) downloadStaffReportPdf(staff)
    else if (tab === 'inventory' && inventory) downloadInventoryReportPdf(inventory)
  }

  const canExportPdf =
    !loading &&
    !error &&
    ((tab === 'financial' && !!financial) ||
      (tab === 'events' && !!events) ||
      (tab === 'clients' && !!clients) ||
      (tab === 'staff' && !!staff) ||
      (tab === 'inventory' && !!inventory))

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">
              Live financial, staff, and inventory reports for day-to-day operations
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportActivePdf}
              disabled={!canExportPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A01F1A] disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === key ? 'bg-[#CC2622] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-600">Generating reports from live records…</p>
        ) : error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}{' '}
            <button type="button" onClick={load} className="font-semibold underline">
              Try again
            </button>
          </p>
        ) : (
          <>
            {tab === 'financial' &&
              (financial ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Net revenue" value={formatKsh(financial.totalRevenue)} hint="Collected minus refunds" />
                  <StatCard
                    label="Outstanding"
                    value={formatKsh(financial.totalOutstanding)}
                    hint={`${financial.outstandingInvoiceCount ?? outstandingInvoices.length} unpaid invoices`}
                  />
                  <StatCard
                    label="Refunded"
                    value={formatKsh(financial.totalRefunded)}
                    hint={`${financial.refundCount ?? refunds.length} cancellation refunds`}
                  />
                  <StatCard
                    label="Invoices"
                    value={`${financial.paidInvoiceCount} / ${financial.invoiceCount}`}
                    hint="Fully paid vs total"
                  />
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Monthly revenue (last 6 months)</h3>
                  <div className="space-y-3">
                    {financial.monthly.map((entry) => (
                      <div key={entry.month} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">{entry.month}</span>
                        <div className="h-6 flex-1 overflow-hidden rounded bg-gray-100">
                          <div
                            className="h-full rounded bg-[#CC2622]/80"
                            style={{ width: `${Math.min(100, (Math.abs(entry.net) / maxMonthlyNet) * 100)}%` }}
                          />
                        </div>
                        <span className="w-40 shrink-0 text-right text-sm font-semibold text-gray-900">
                          {formatKsh(entry.net)}
                          {entry.refunded > 0 && (
                            <span className="ml-1 text-xs font-normal text-indigo-600">(−{formatKsh(entry.refunded)})</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Outstanding payments ({outstandingInvoices.length})
                      </h3>
                      <p className="text-sm text-gray-500">Invoices with unpaid balances that still need collection</p>
                    </div>
                    <button
                      type="button"
                      onClick={exportOutstandingCsv}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      <Download className="h-4 w-4" /> Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-blue-50">
                        <tr>
                          {['Invoice', 'Client', 'Event', 'Due date', 'Status', 'Balance'].map((col) => (
                            <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {outstandingInvoices.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No outstanding balances — all invoices are settled.
                            </td>
                          </tr>
                        )}
                        {outstandingInvoices.map((invoice) => (
                          <tr key={invoice.invoiceId} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-3 font-semibold text-gray-900">{invoice.invoiceNumber}</td>
                            <td className="px-4 py-3 text-gray-600">{invoice.clientName ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{invoice.eventName ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusPill status={invoice.invoiceStatus} />
                                {invoice.overdue && (
                                  <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">{formatKsh(invoice.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Refunds ({refunds.length})</h3>
                      <p className="text-sm text-gray-500">75% cancellation refunds issued against paid invoices</p>
                    </div>
                    <button
                      type="button"
                      onClick={exportRefundsCsv}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      <Download className="h-4 w-4" /> Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-blue-50">
                        <tr>
                          {['Invoice', 'Client', 'Event', 'Amount', 'Reference', 'Date'].map((col) => (
                            <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {refunds.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No refunds recorded yet.
                            </td>
                          </tr>
                        )}
                        {refunds.map((payment) => (
                          <tr key={payment.paymentId} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-3 font-semibold text-gray-900">{payment.invoiceNumber}</td>
                            <td className="px-4 py-3 text-gray-600">{payment.clientName ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{payment.eventName ?? '—'}</td>
                            <td className="px-4 py-3 font-semibold text-indigo-700">−{formatKsh(payment.amount)}</td>
                            <td className="px-4 py-3 font-mono text-sm text-gray-700">
                              {payment.mpesaReceiptNumber ?? payment.failureReason ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(payment.completedAt ?? payment.initiatedAt ?? Date.now()).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-900">Payment records ({financial.payments.length})</h3>
                    <ExportButtons onCsv={exportFinancialCsv} onPdf={() => downloadFinancialReportPdf(financial)} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-blue-50">
                        <tr>
                          {['Invoice', 'Client', 'Amount', 'Status', 'M-Pesa Receipt', 'Date'].map((col) => (
                            <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {financial.payments.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No payments recorded yet.
                            </td>
                          </tr>
                        )}
                        {financial.payments.map((payment) => (
                          <tr key={payment.paymentId} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-3 font-semibold text-gray-900">{payment.invoiceNumber}</td>
                            <td className="px-4 py-3 text-gray-600">{payment.clientName ?? '—'}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {payment.paymentStatus === 'REFUNDED' ? '−' : ''}
                              {formatKsh(payment.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill status={payment.paymentStatus} />
                            </td>
                            <td className="px-4 py-3 font-mono text-sm text-gray-700">
                              {payment.mpesaReceiptNumber ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(payment.completedAt ?? payment.initiatedAt ?? Date.now()).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <MissingReport label="Financial" onRetry={load} />
            ))}

            {tab === 'events' &&
              (events ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Total events" value={String(events.totalEvents)} />
                  <StatCard label="Upcoming" value={String(events.upcomingCount)} hint="Excludes cancelled" />
                  <StatCard label="Confirmed" value={String(events.statusCounts.CONFIRMED ?? 0)} />
                  <StatCard label="Total guests" value={events.totalGuests.toLocaleString()} hint="Across active events" />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h3 className="mb-4 text-lg font-bold text-gray-900">Events by status</h3>
                    <ul className="space-y-3">
                      {Object.entries(events.statusCounts).map(([status, count]) => (
                        <li key={status} className="flex items-center justify-between">
                          <StatusPill status={status} />
                          <span className="font-semibold text-gray-900">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h3 className="mb-4 text-lg font-bold text-gray-900">Events per month</h3>
                    <div className="space-y-3">
                      {events.monthly.map((entry) => (
                        <div key={entry.month} className="flex items-center gap-3">
                          <span className="w-20 shrink-0 text-sm font-semibold text-gray-700">{entry.month}</span>
                          <div className="h-5 flex-1 overflow-hidden rounded bg-gray-100">
                            <div
                              className="h-full rounded bg-blue-500/80"
                              style={{ width: `${Math.min(100, (entry.count / maxMonthlyEvents) * 100)}%` }}
                            />
                          </div>
                          <span className="w-28 shrink-0 text-right text-sm text-gray-700">
                            {entry.count} · {entry.guests} guests
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-900">All events ({events.events.length})</h3>
                    <ExportButtons onCsv={exportEventsCsv} onPdf={() => downloadEventsReportPdf(events)} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-blue-50">
                        <tr>
                          {['Event', 'Client', 'Status', 'Guests', 'Venue', 'Date'].map((col) => (
                            <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {events.events.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No events recorded yet.
                            </td>
                          </tr>
                        )}
                        {events.events.map((event) => (
                          <tr key={event.eventId} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-3 font-semibold text-gray-900">{event.eventName}</td>
                            <td className="px-4 py-3 text-gray-600">{event.clientName ?? '—'}</td>
                            <td className="px-4 py-3">
                              <StatusPill status={event.eventStatus} />
                            </td>
                            <td className="px-4 py-3 text-gray-600">{event.guestCount}</td>
                            <td className="px-4 py-3 text-gray-600">{event.eventVenue ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(event.eventDateTime).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <MissingReport label="Events" onRetry={load} />
            ))}

            {tab === 'clients' &&
              (clients ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Total clients" value={String(clients.totalClients)} />
                  <StatCard label="Open feedback" value={String(clients.openFeedbackCount)} hint="Awaiting a response" />
                  <StatCard label="In progress" value={String(clients.inProgressFeedbackCount)} />
                  <StatCard label="Resolved feedback" value={String(clients.resolvedFeedbackCount)} />
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-900">Clients by value ({clients.topClients.length})</h3>
                    <ExportButtons onCsv={exportClientsCsv} onPdf={() => downloadClientsReportPdf(clients)} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-blue-50">
                        <tr>
                          {['Client', 'Company', 'Email', 'Events', 'Total Paid'].map((col) => (
                            <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {clients.topClients.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                              No clients recorded yet.
                            </td>
                          </tr>
                        )}
                        {clients.topClients.map((client) => (
                          <tr key={client.clientId} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-3 font-semibold text-gray-900">{client.clientName}</td>
                            <td className="px-4 py-3 text-gray-600">{client.companyName ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{client.clientEmail ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{client.eventCount}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900">{formatKsh(client.totalPaid)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <MissingReport label="Clients" onRetry={load} />
            ))}

            {tab === 'staff' &&
              (staff ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Total staff" value={String(staff.totalStaff)} />
                  <StatCard label="Assignments" value={String(staff.totalAssignments)} hint="Across all events" />
                  <StatCard label="Unassigned" value={String(staff.unassignedStaffCount)} hint="No event booked yet" />
                  <StatCard
                    label="Assignment cost"
                    value={formatKsh(staff.totalAssignmentCost)}
                    hint="Sum of booked rates"
                  />
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Staff by role</h3>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(staff.roleCounts).map(([role, count]) => (
                      <li key={role} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                        <span className="font-medium text-gray-700">{role}</span>
                        <span className="font-semibold text-gray-900">{count}</span>
                      </li>
                    ))}
                    {Object.keys(staff.roleCounts).length === 0 && (
                      <li className="text-sm text-gray-500">No roles recorded yet.</li>
                    )}
                  </ul>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Staff utilization ({staff.staff.length})</h3>
                      <p className="text-sm text-gray-500">Who is booked, how often, and at what cost</p>
                    </div>
                    <ExportButtons onCsv={exportStaffCsv} onPdf={() => downloadStaffReportPdf(staff)} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-blue-50">
                        <tr>
                          {['Name', 'Role', 'Rate', 'Pricing', 'Assignments', 'Earned'].map((col) => (
                            <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {staff.staff.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No staff recorded yet.
                            </td>
                          </tr>
                        )}
                        {staff.staff.map((member) => (
                          <tr key={member.staffId} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-3 font-semibold text-gray-900">{member.staffName}</td>
                            <td className="px-4 py-3 text-gray-600">{member.staffRole ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-900">{formatKsh(member.staffSalary)}</td>
                            <td className="px-4 py-3 text-gray-600">{member.pricingMethod ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{member.assignmentCount}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900">{formatKsh(member.totalEarned)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Event assignments ({staff.assignments.length})
                    </h3>
                    <p className="text-sm text-gray-500">Staff booked against upcoming and past events</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-blue-50">
                        <tr>
                          {['Staff', 'Event', 'Role', 'Event status', 'Date', 'Cost'].map((col) => (
                            <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {staff.assignments.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              No assignments recorded yet.
                            </td>
                          </tr>
                        )}
                        {staff.assignments.map((assignment) => (
                          <tr key={assignment.staffAssignmentId} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-3 font-semibold text-gray-900">{assignment.staffName ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{assignment.eventName ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {assignment.roleForEvent ?? assignment.staffRole ?? '—'}
                            </td>
                            <td className="px-4 py-3">
                              {assignment.eventStatus ? <StatusPill status={assignment.eventStatus} /> : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {assignment.eventDateTime
                                ? new Date(assignment.eventDateTime).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {formatKsh(assignment.salaryAtAssignment)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <MissingReport label="Staff" onRetry={load} />
            ))}

            {tab === 'inventory' &&
              (inventory ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Catalog items" value={String(inventory.totalItems)} />
                  <StatCard
                    label="Units allocated"
                    value={`${inventory.totalAllocatedUnits} / ${inventory.totalStockUnits}`}
                    hint="In use vs total stock"
                  />
                  <StatCard
                    label="Low / out of stock"
                    value={`${inventory.lowStockCount} / ${inventory.outOfStockCount}`}
                    hint="Available ≤ 5 counted as low"
                  />
                  <StatCard
                    label="Allocation value"
                    value={formatKsh(inventory.totalAllocationValue)}
                    hint="Active rental value"
                  />
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Stock levels ({inventory.items.length})</h3>
                      <p className="text-sm text-gray-500">Sorted by availability so shortages surface first</p>
                    </div>
                    <ExportButtons onCsv={exportInventoryCsv} onPdf={() => downloadInventoryReportPdf(inventory)} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-blue-50">
                        <tr>
                          {['Item', 'Stock', 'Allocated', 'Available', 'Utilisation', 'Unit price', 'Stock value'].map(
                            (col) => (
                              <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                {col}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.items.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                              No inventory recorded yet.
                            </td>
                          </tr>
                        )}
                        {inventory.items.map((item) => (
                          <tr key={item.inventoryId} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-3 font-semibold text-gray-900">{item.inventoryName}</td>
                            <td className="px-4 py-3 text-gray-600">{item.stockQuantity}</td>
                            <td className="px-4 py-3 text-gray-600">{item.allocatedQuantity}</td>
                            <td className="px-4 py-3">
                              <span
                                className={
                                  item.availableQuantity === 0
                                    ? 'font-semibold text-red-700'
                                    : item.availableQuantity <= 5
                                      ? 'font-semibold text-amber-700'
                                      : 'text-gray-900'
                                }
                              >
                                {item.availableQuantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{item.utilizationPercent}%</td>
                            <td className="px-4 py-3 text-gray-600">{formatKsh(item.unitPrice)}</td>
                            <td className="px-4 py-3 font-semibold text-gray-900">{formatKsh(item.stockValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Event allocations ({inventory.allocations.length})
                    </h3>
                    <p className="text-sm text-gray-500">Rentals and equipment currently tied to events</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-blue-50">
                        <tr>
                          {['Item', 'Event', 'Client', 'Qty', 'Returned', 'Status', 'Cost'].map((col) => (
                            <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.allocations.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                              No allocations recorded yet.
                            </td>
                          </tr>
                        )}
                        {inventory.allocations.map((allocation) => (
                          <tr key={allocation.allocationId} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {allocation.inventoryName ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{allocation.eventName ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{allocation.clientName ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{allocation.quantityAllocated ?? 0}</td>
                            <td className="px-4 py-3 text-gray-600">{allocation.quantityReturned ?? 0}</td>
                            <td className="px-4 py-3">
                              {allocation.eventStatus ? <StatusPill status={allocation.eventStatus} /> : '—'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {formatKsh(allocation.totalCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <MissingReport label="Inventory" onRetry={load} />
            ))}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
