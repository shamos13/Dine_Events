'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Search } from 'lucide-react'

const packages = [
  {
    id: 1,
    name: 'Swahili Feast',
    description: 'A complete coastal spread including Biryani, Pilau, and Samaki wa Kupaka.',
    price: 'KSh 2,500',
  },
  {
    id: 2,
    name: 'Nyama Choma Platter',
    description: 'Premium grilled meats served with ugali, kachumbari, and mokimo.',
    price: 'KSh 1,800',
  },
  {
    id: 3,
    name: 'Corporate Executive Lunch',
    description: 'Professional buffet with chapati, beef stew, seasonal vegetables, and fruit salad.',
    price: 'KSh 1,500',
  },
]

export default function Packages() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-6">
        {/* Page Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Packages</h1>
            <p className="text-gray-600">Manage your package offerings and pricing</p>
          </div>
          <button className="bg-[#CC2622] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#A01F1A] transition flex items-center gap-2">
            + New Package
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search packages"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
            />
          </div>
        </div>

        {/* Packages Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">PACKAGE NAME</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">DESCRIPTION</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">DEFAULT PRICE (PER GUEST)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg, idx) => (
                <tr key={pkg.id} className={idx !== packages.length - 1 ? 'border-b border-gray-200' : ''}>
                  <td className="px-6 py-4 text-gray-900 font-semibold">{pkg.name}</td>
                  <td className="px-6 py-4 text-gray-600">{pkg.description}</td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">{pkg.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
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
