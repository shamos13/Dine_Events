'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const calendarDays = [
  { day: 28, event: null },
  { day: 29, event: null },
  { day: 30, event: null },
  { day: 1, event: null },
  { day: 2, event: { name: 'Event #7', time: '12:00 PM', client: 'Douglas Andanje', color: 'bg-purple-100' } },
  { day: 3, event: null },
  { day: 4, event: { name: 'Acme Quarterly Lunch', time: '4:00 PM - 8:00 PM', client: 'Acme Corp', color: 'bg-blue-100' } },
  { day: 5, event: null },
  { day: 6, event: { name: 'Ruracia', time: '12:00 PM', client: 'Gari Zetu', color: 'bg-purple-100' } },
  { day: 7, event: null },
  { day: 8, event: null },
  { day: 9, event: null },
  { day: 10, event: null },
  { day: 11, event: { name: 'Johnson Wedding Reception', time: '5:00 PM - 10:00 PM', client: 'David & Emily Johnson', color: 'bg-orange-100' } },
  { day: 12, event: null },
  { day: 13, event: null },
  { day: 14, event: null },
  { day: 15, event: null },
  { day: 16, event: null },
  { day: 17, event: null },
  { day: 18, event: null },
  { day: 19, event: null },
  { day: 20, event: null },
  { day: 21, event: null },
  { day: 22, event: null },
  { day: 23, event: { name: 'Acme Annual Conference', time: '12:00 PM - 8:00 PM', client: 'Acme Corp', color: 'bg-purple-100' } },
  { day: 24, event: null },
  { day: 25, event: null },
  { day: 26, event: null },
  { day: 27, event: null },
  { day: 28, event: null },
  { day: 29, event: null },
  { day: 30, event: null },
  { day: 31, event: null },
  { day: 1, event: null },
]

export default function Calendar() {
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
            <h2 className="text-2xl font-bold text-gray-900">July 2026</h2>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Today
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <div key={day} className="text-center py-3 font-semibold text-gray-700 text-sm border-b border-gray-200">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((item, idx) => (
              <div key={idx} className="border border-gray-200 min-h-32 p-2 bg-white hover:bg-gray-50 transition">
                <div className="text-sm font-semibold text-gray-900 mb-2">{item.day}</div>
                {item.event && (
                  <div className={`${item.event.color} rounded p-2 text-xs`}>
                    <p className="font-semibold text-gray-900">{item.event.time}</p>
                    <p className="font-semibold text-gray-900 line-clamp-2">{item.event.name}</p>
                    <p className="text-gray-700 line-clamp-1">{item.event.client}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
