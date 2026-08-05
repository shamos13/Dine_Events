'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import { getPortalEvents } from '@/lib/api/portal'
import type { EventResponse } from '@/lib/api/events'
import { Card } from '@/components/ui/card'
import { StatusPill } from '@/components/ui/status-pill'
import { Skeleton } from '@/components/ui/skeleton'

export default function PortalBookingsPage() {
  const [events, setEvents] = useState<EventResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPortalEvents()
      .then(setEvents)
      .catch((reason: unknown) =>
        setError(reason instanceof ApiError ? reason.message : 'Unable to load bookings.')
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-1 text-gray-600">Track every inquiry, confirmation, and completed event.</p>
        </div>
        <Link
          href="/portal/build"
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"
        >
          Build new event
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <Card className="text-center">
          <h2 className="text-xl font-bold text-gray-900">No bookings yet</h2>
          <p className="mt-2 text-sm text-gray-600">Start with the event builder and we&apos;ll take it from there.</p>
          <Link href="/portal/build" className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">
            Build Your Event
          </Link>
        </Card>
      )}

      <div className="space-y-3">
        {events.map((event) => (
          <Link key={event.eventId} href={`/portal/bookings/${event.eventId}`}>
            <Card className="transition hover:border-brand/40 hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{event.eventName}</h2>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-brand" />
                      {new Date(event.eventDateTime).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-brand" />
                      {event.eventVenue}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-brand" />
                      {event.guestCount} guests
                    </span>
                  </div>
                </div>
                <StatusPill status={event.eventStatus} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
