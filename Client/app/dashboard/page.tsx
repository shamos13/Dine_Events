'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Calendar, Users, AlertCircle, Clock, TrendingUp, Zap } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-6">
        {/* Welcome Banner */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800">Welcome to Dine Events Operations</p>
            <p className="text-gray-600 text-sm mt-1">
              Your bookings, clients, menu costing, invoices, stock, and team assignments are connected here so the catering day stays calm from first inquiry to final payment.
            </p>
          </div>
        </div>

        {/* Dashboard Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your catering business.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Events this week</p>
                <p className="text-3xl font-bold text-gray-900">5</p>
                <p className="text-xs text-gray-500 mt-2">1,275 guests scheduled</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#CC2622]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Confirmed next 30d</p>
                <p className="text-3xl font-bold text-gray-900">2</p>
                <p className="text-xs text-gray-500 mt-2">720 guests total</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Open leads</p>
                <p className="text-3xl font-bold text-gray-900">2</p>
                <p className="text-xs text-gray-500 mt-2">Drafts and sent quotations</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Overdue invoices</p>
                <p className="text-3xl font-bold text-[#CC2622]">1</p>
                <p className="text-xs text-[#CC2622] font-semibold mt-2">Ksh 410,000 due</p>
                <p className="text-xs text-gray-500">2 inventory alerts</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#CC2622]" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Events</h2>
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-200">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-gray-900">Amani Corporate Group</p>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">Confirmed</span>
                </div>
                <p className="text-sm text-gray-600">Corporate Dinner - Karen Country Club - 180 guests</p>
                <p className="text-sm font-semibold text-gray-900 mt-2">8 Jul 2026, 18:00</p>
              </div>

              <div className="pb-4 border-b border-gray-200">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-gray-900">Wanjiru & Maina</p>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">Pending</span>
                </div>
                <p className="text-sm text-gray-600">Wedding - Limuru Gardens - 320 guests</p>
                <p className="text-sm font-semibold text-gray-900 mt-2">11 Jul 2026, 12:30</p>
              </div>

              <div className="pb-4 border-b border-gray-200">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-gray-900">Nairobi FinTech Week</p>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">Confirmed</span>
                </div>
                <p className="text-sm text-gray-600">Conference - KICC Tsavo Hall - 540 guests</p>
                <p className="text-sm font-semibold text-gray-900 mt-2">16 Jul 2026, 09:00</p>
              </div>

              <div>
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-gray-900">Muthoni Residence</p>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">Draft</span>
                </div>
                <p className="text-sm text-gray-600">Private Party - Runda Estate - 85 guests</p>
                <p className="text-sm font-semibold text-gray-900 mt-2">21 Jul 2026, 17:30</p>
              </div>
            </div>
            <a href="/events" className="text-[#CC2622] font-medium text-sm mt-4 inline-block hover:underline">
              View all →
            </a>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Payments</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  📋
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Ksh 685,000 for invoice INV-1201</p>
                  <p className="text-sm text-gray-600">Amani Corporate Group - Paid</p>
                  <p className="text-xs text-gray-500 mt-1">updated today</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  📋
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Ksh 990,000 for invoice INV-1202</p>
                  <p className="text-sm text-gray-600">Nairobi FinTech Week - Partial</p>
                  <p className="text-xs text-gray-500 mt-1">updated today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
