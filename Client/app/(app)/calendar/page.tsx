'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getEvents, type EventResponse, type EventStatus } from '@/lib/api/events'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type CalendarDay = {
  date: Date
  key: string
  isCurrentMonth: boolean
}

const statusStyles: Record<EventStatus, string> = {
  INQUIRY: 'bg-purple-100 border-purple-200',
  TENTATIVE: 'bg-orange-100 border-orange-200',
  CONFIRMED: 'bg-blue-100 border-blue-200',
  COMPLETED: 'bg-green-100 border-green-200',
  CANCELLED: 'bg-red-100 border-red-200',
}

const dateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getEventDateKey = (event: EventResponse) => dateKey(new Date(event.eventDateTime))

const getCalendarDays = (monthDate: Date): CalendarDay[] => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const start = new Date(year, month, 1 - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      date,
      key: dateKey(date),
      isCurrentMonth: date.getMonth() === month,
    }
  })
}

const formatEventTime = (event: EventResponse) => {
  const start = new Date(event.eventDateTime)
  const startTime = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  if (!event.eventEndDateTime) return startTime

  const end = new Date(event.eventEndDateTime)
  const endTime = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return `${startTime} - ${endTime}`
}

export default function Calendar() {
  const today = useMemo(() => new Date(), [])
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState<EventResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getEvents()
      .then((data) => {
        if (!active) return
        setEvents(data.filter((event) => event.eventDateTime))
        setError(null)
      })
      .catch(() => {
        if (!active) return
        setError('Unable to load calendar events.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth])

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, EventResponse[]>>((groups, event) => {
      const key = getEventDateKey(event)
      groups[key] = [...(groups[key] ?? []), event]
      return groups
    }, {})
  }, [events])

  const monthLabel = visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const moveMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  const showToday = () => {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Calendar</h1>
          <p className="text-gray-600">View and manage your catering events in calendar format</p>
        </div>

        {/* Legend */}
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-600"></div>
            <span>Inquiry</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-600"></div>
            <span>Tentative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-600"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-600"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-600"></div>
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-600"></div>
            <span>Note</span>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{monthLabel}</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => moveMonth(-1)} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button onClick={showToday} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Today
              </button>
              <button onClick={() => moveMonth(1)} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loading && <p className="mb-4 text-sm text-gray-600">Loading calendar events...</p>}
          {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <div key={day} className="text-center py-3 font-semibold text-gray-700 text-sm border-b border-gray-200">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((item) => (
              <div key={item.key} className={`border border-gray-200 min-h-32 p-2 transition ${item.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}`}>
                <div className={`text-sm font-semibold mb-2 ${item.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>{item.date.getDate()}</div>
                <div className="space-y-2">
                  {(eventsByDate[item.key] ?? []).map((event) => (
                    <Link key={event.eventId} href={`/events/${event.eventId}`} className={`${statusStyles[event.eventStatus]} block rounded border p-2 text-xs hover:ring-1 hover:ring-gray-300`}>
                      <p className="font-semibold text-gray-900">{formatEventTime(event)}</p>
                      <p className="font-semibold text-gray-900 line-clamp-2">{event.eventName}</p>
                      {event.clientName && <p className="text-gray-700 line-clamp-1">{event.clientName}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
