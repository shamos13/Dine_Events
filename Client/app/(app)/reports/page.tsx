'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Banknote, CalendarRange, Download, RefreshCw, Users } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { StatusPill } from '@/components/ui/status-pill'
import { ApiError } from '@/lib/api/client'
import { formatKsh } from '@/lib/api/menu'
import {
  getClientsReport,
  getEventsReport,
  getFinancialReport,
  type ClientsReport,
  type EventsReport,
  type FinancialReport,
} from '@/lib/api/reports'

type TabKey = 'financial' | 'events' | 'clients'

const TABS: { key: TabKey; label: string; icon: typeof Banknote }[] = [
  { key: 'financial', label: 'Financial', icon: Banknote },
  { key: 'events', label: 'Events', icon: CalendarRange },
  { key: 'clients', label: 'Clients', icon: Users },
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

export default function Reports() {
  const [tab, setTab] = useState<TabKey>('financial')
  const [financial, setFinancial] = useState<FinancialReport | null>(null)
  const [events, setEvents] = useState<EventsReport | null>(null)
  const [clients, setClients] = useState<ClientsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([getFinancialReport(), getEventsReport(), getClientsReport()])
      .then(([financialReport, eventsReport, clientsReport]) => {
        setFinancial(financialReport)
        setEvents(eventsReport)
        setClients(clientsReport)
      })
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to generate reports.')
      )
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

  const exportFinancial = () => {
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

  const exportEvents = () => {
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

  const exportClients = () => {
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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">Live operational and financial reports generated from your records</p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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
            {tab === 'financial' && financial && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Net revenue" value={formatKsh(financial.totalRevenue)} hint="Collected minus refunds" />
                  <StatCard label="Outstanding" value={formatKsh(financial.totalOutstanding)} hint="Unpaid invoice balances" />
                  <StatCard label="Refunded" value={formatKsh(financial.totalRefunded)} hint="75% cancellation policy" />
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
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-900">Payment records ({financial.payments.length})</h3>
                    <button
                      type="button"
                      onClick={exportFinancial}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-4 py-2 text-sm font-semibold text-white hover:bg-[#A01F1A]"
                    >
                      <Download className="h-4 w-4" /> Export CSV
                    </button>
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
            )}

            {tab === 'events' && events && (
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
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-900">All events ({events.events.length})</h3>
                    <button
                      type="button"
                      onClick={exportEvents}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-4 py-2 text-sm font-semibold text-white hover:bg-[#A01F1A]"
                    >
                      <Download className="h-4 w-4" /> Export CSV
                    </button>
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
            )}

            {tab === 'clients' && clients && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Total clients" value={String(clients.totalClients)} />
                  <StatCard label="Open feedback" value={String(clients.openFeedbackCount)} hint="Awaiting a response" />
                  <StatCard label="In progress" value={String(clients.inProgressFeedbackCount)} />
                  <StatCard label="Resolved feedback" value={String(clients.resolvedFeedbackCount)} />
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-900">Clients by value ({clients.topClients.length})</h3>
                    <button
                      type="button"
                      onClick={exportClients}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#CC2622] px-4 py-2 text-sm font-semibold text-white hover:bg-[#A01F1A]"
                    >
                      <Download className="h-4 w-4" /> Export CSV
                    </button>
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
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
