'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Search, Plus } from 'lucide-react'

const clients = [
  { id: 1, name: 'Acme Corporation', email: 'contact@acmecorp.com', phone: '+254 712 345 678', events: 5 },
  { id: 2, name: 'Gari Zetu Motors', email: 'events@garizetu.com', phone: '+254 723 456 789', events: 3 },
  { id: 3, name: 'David & Emily Johnson', email: 'family@johnson.com', phone: '+254 734 567 890', events: 1 },
  { id: 4, name: 'Global Logistics Inc', email: 'admin@globallogistics.com', phone: '+254 745 678 901', events: 4 },
]

export default function CRM() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-6">
        {/* Page Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CRM</h1>
            <p className="text-gray-600">Manage your client relationships and contact information</p>
          </div>
          <button className="bg-[#CC2622] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#A01F1A] transition flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
            />
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">CLIENT NAME</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">EMAIL</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">PHONE</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">EVENTS</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, idx) => (
                <tr key={client.id} className={idx !== clients.length - 1 ? 'border-b border-gray-200' : ''}>
                  <td className="px-6 py-4 text-gray-900 font-semibold">{client.name}</td>
                  <td className="px-6 py-4 text-gray-600">{client.email}</td>
                  <td className="px-6 py-4 text-gray-600">{client.phone}</td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">{client.events}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</button>
                      <button className="text-gray-400">|</button>
                      <button className="text-[#CC2622] hover:text-[#A01F1A] text-sm font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  )
}
