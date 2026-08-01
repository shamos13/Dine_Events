'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Eye,
  FileText,
  MapPin,
  MessageCircle,
  Plus,
  Wallet,
} from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import { formatKsh } from '@/lib/api/menu'
import { getPortalDashboard, type PortalDashboard } from '@/lib/api/portal'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function countdown(targetIso: string | undefined | null) {
  if (!targetIso) return { days: 0, hours: 0 }
  const diff = new Date(targetIso).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0 }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return { days, hours }
}

function formatWhen(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function PortalDashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<PortalDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPortalDashboard()
      .then(setData)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load dashboard.')
      )
      .finally(() => setLoading(false))
  }, [])

  const clock = useMemo(() => countdown(data?.nextEvent?.eventDateTime), [data?.nextEvent?.eventDateTime])
  const paidPct = useMemo(() => {
    if (!data || !data.totalBudget) return 0
    return Math.min(100, Math.round((Number(data.totalPaid) / Number(data.totalBudget)) * 100))
  }, [data])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    )
  }

  if (error) {
    return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
  }

  if (!data) return null

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#eef4ff] via-[#f6f0ff] to-[#fde8e8] p-6 sm:p-8">
        <div className="pointer-events-none absolute -left-3 top-1/2 -translate-y-1/2 space-y-2">
          <span className="block h-2.5 w-2.5 rounded-full bg-brand/30" />
          <span className="block h-2.5 w-2.5 rounded-full bg-brand/20" />
          <span className="block h-2.5 w-2.5 rounded-full bg-brand/10" />
        </div>
        <div className="pointer-events-none absolute -right-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-white/30 blur-2xl" />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
              <span className="h-px w-6 bg-brand" />
              Client Portal
            </div>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Welcome back, {data.clientName || user?.fullName}.
            </h1>
            <p className="mt-2 max-w-xl text-gray-600">
              Your next event is approaching. Here&apos;s a snapshot of where everything stands.
            </p>
          </div>

          {data.nextEvent ? (
            <Card className="border-0 shadow-md">
              <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
                Upcoming
              </span>
              <h2 className="mt-3 text-lg font-bold text-gray-900">{data.nextEvent.eventName}</h2>
              <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-brand" />
                  {new Date(data.nextEvent.eventDateTime).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand" />
                  {data.nextEvent.eventVenue}
                </p>
              </div>
              <div className="mt-4 flex items-end gap-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{String(clock.days).padStart(2, '0')}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Days</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{String(clock.hours).padStart(2, '0')}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Hrs</p>
                </div>
              </div>
              <Link
                href={`/portal/bookings/${data.nextEvent.eventId}`}
                className="mt-5 inline-flex items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                View Details →
              </Link>
            </Card>
          ) : (
            <Card className="border-0 shadow-md">
              <h2 className="text-lg font-bold text-gray-900">No upcoming events</h2>
              <p className="mt-2 text-sm text-gray-600">Start planning your next occasion with our guided builder.</p>
              <Link
                href="/portal/build"
                className="mt-5 inline-flex items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Build Your Event →
              </Link>
            </Card>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-brand" />
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: data.nextEvent ? `/portal/bookings/${data.nextEvent.eventId}` : '/portal/bookings',
              title: 'Current Booking',
              subtitle: 'Review itinerary & details',
              icon: Eye,
              iconBg: 'bg-blue-100',
              iconColor: 'text-blue-600',
            },
            {
              href: '/portal/invoices',
              title: 'Pay Invoice',
              subtitle:
                data.pendingInvoiceCount > 0
                  ? `${data.pendingInvoiceCount} Pending Invoice${data.pendingInvoiceCount === 1 ? '' : 's'}`
                  : 'No pending invoices',
              icon: FileText,
              iconBg: 'bg-brand-soft',
              iconColor: 'text-brand',
              accent: data.pendingInvoiceCount > 0,
            },
            {
              href: '/portal/build',
              title: 'Build New Event',
              subtitle: 'Start planning your next occasion',
              icon: Plus,
              iconBg: 'bg-brand-soft',
              iconColor: 'text-brand',
            },
            {
              href: '/portal/help',
              title: 'Contact Manager',
              subtitle: 'Message your dedicated planner',
              icon: MessageCircle,
              iconBg: 'bg-purple-100',
              iconColor: 'text-purple-600',
            },
          ].map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="relative h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                <action.icon className="pointer-events-none absolute -bottom-3 -right-3 h-20 w-20 text-brand/5" />
                <div className={`relative flex h-10 w-10 items-center justify-center rounded-full ${action.iconBg}`}>
                  <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                <h3 className="relative mt-3 text-base font-bold text-gray-900">{action.title}</h3>
                <p className={`relative mt-1 text-sm ${action.accent ? 'font-semibold text-brand' : 'text-gray-600'}`}>
                  {action.subtitle}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-brand" />
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          </div>
          <ol className="space-y-4">
            {data.activity.length === 0 && (
              <li className="text-sm text-gray-500">No recent activity yet. Create an event to get started.</li>
            )}
            {data.activity.map((item, index) => (
              <li key={`${item.type}-${index}`} className="flex gap-3">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                    index === 0 ? 'bg-brand' : 'bg-gray-300'
                  }`}
                />
                <div className={`flex-1 ${index === 0 ? 'rounded-lg bg-blue-50 px-3 py-2.5' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="whitespace-nowrap text-xs text-gray-400">{formatWhen(item.occurredAt)}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/portal/bookings" className="mt-6 inline-flex text-sm font-semibold text-brand hover:text-brand-dark">
            VIEW ALL ACTIVITY →
          </Link>
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-brand" />
            <h2 className="text-lg font-bold text-gray-900">Financials</h2>
          </div>

          <p className="mb-4 text-sm font-bold text-gray-900">Payment Status</p>

          <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border-[12px] border-brand/20"
            style={{
              background: `conic-gradient(#CC2622 0% ${paidPct}%, #dbeafe ${paidPct}% 100%)`,
            }}
          >
            <div className="flex h-[7.5rem] w-[7.5rem] flex-col items-center justify-center rounded-full bg-white text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Budget</p>
              <p className="text-lg font-bold text-gray-900">{formatKsh(data.totalBudget)}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="h-2 w-2 rounded-full bg-brand" />
                Paid
              </span>
              <p className="text-base font-bold text-gray-900">{formatKsh(data.totalPaid)}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="h-2 w-2 rounded-full bg-blue-200" />
                Outstanding
              </span>
              <p className="text-base font-bold text-brand">{formatKsh(data.totalOutstanding)}</p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-gray-900 p-4">
            <div>
              <p className="text-xs font-medium text-gray-400">Pay via Mobile Money</p>
              <p className="text-base font-bold text-white">M-PESA</p>
            </div>
            <Link
              href="/portal/invoices"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <Wallet className="h-4 w-4" />
              Pay Now
            </Link>
          </div>
        </Card>
      </section>
    </div>
  )
}
