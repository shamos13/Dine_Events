'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Reports() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600 mb-8">Generate operational and financial reports for your catering business</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition cursor-pointer">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Financial Reports</h3>
            <p className="text-gray-600 text-sm">Revenue, expenses, and profitability analysis</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition cursor-pointer">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Event Reports</h3>
            <p className="text-gray-600 text-sm">Event statistics, bookings, and guest counts</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition cursor-pointer">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Staff Reports</h3>
            <p className="text-gray-600 text-sm">Staff assignments and performance metrics</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition cursor-pointer">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Inventory Reports</h3>
            <p className="text-gray-600 text-sm">Stock levels and equipment utilization</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
