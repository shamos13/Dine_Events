'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Search, MoreVertical } from 'lucide-react'
import { useState } from 'react'

const invoices = [
  {
    id: 'INV-1024',
    clientName: 'TechCorp Inc.',
    eventName: 'Acme Quarterly Lunch',
    issueDate: 'Oct 24, 2024',
    amount: 'KSh 4,500.00',
    status: 'PAID',
    statusColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'INV-1025',
    clientName: 'Global Logistics',
    eventName: 'Annual Gala Dinner',
    issueDate: 'Oct 20, 2024',
    amount: 'KSh 12,850.00',
    status: 'OVERDUE',
    statusColor: 'bg-red-100 text-red-700',
  },
  {
    id: 'INV-1026',
    clientName: 'Stark Industries',
    eventName: 'Board Retreat Catering',
    issueDate: 'Nov 01, 2024',
    amount: 'KSh 3,200.00',
    status: 'SENT',
    statusColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'INV-1027',
    clientName: 'Wayne Enterprises',
    eventName: 'Charity Banquet',
    issueDate: 'Nov 05, 2024',
    amount: 'KSh 25,000.00',
    status: 'DRAFT',
    statusColor: 'bg-gray-100 text-gray-700',
  },
]

export default function Invoices() {
  const [filter, setFilter] = useState('All Invoices')

  const filters = ['All Invoices', 'Draft', 'Sent', 'Paid', 'Overdue']

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-6">
        {/* Page Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
            <p className="text-gray-600">Manage and track your billing operations.</p>
          </div>
          <button className="bg-[#CC2622] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#A01F1A] transition flex items-center gap-2">
            + Create New Invoice
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === f
                      ? 'bg-[#CC2622] text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-[#CC2622]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="w-full lg:w-auto relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="w-full lg:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
              />
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">INVOICE ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">CLIENT NAME</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">EVENT NAME</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ISSUE DATE</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">AMOUNT</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">STATUS</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice, idx) => (
                <tr key={invoice.id} className={idx !== invoices.length - 1 ? 'border-b border-gray-200' : ''}>
                  <td className="px-6 py-4 text-[#CC2622] font-semibold">{invoice.id}</td>
                  <td className="px-6 py-4 text-gray-900">{invoice.clientName}</td>
                  <td className="px-6 py-4 text-gray-600">{invoice.eventName}</td>
                  <td className="px-6 py-4 text-gray-600">{invoice.issueDate}</td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">{invoice.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${invoice.statusColor}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <span>Showing 1 to 4 of 24 entries</span>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded">Prev</button>
              <button className="w-8 h-8 bg-[#CC2622] text-white rounded font-medium">1</button>
              <button className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded">2</button>
              <button className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded">3</button>
              <span className="text-gray-400">...</span>
              <button className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded">Next</button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
