'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Search, Edit, Trash2 } from 'lucide-react'

const menuItems = [
  {
    id: 1,
    name: 'Nyama Choma',
    category: 'Entrees',
    description: 'Grilled goat meat seasoned with local spices',
    price: 'Ksh 800',
  },
  {
    id: 2,
    name: 'Ugali & Sukuma Wiki',
    category: 'Sides',
    description: 'Traditional maize meal served with sautéed collard greens',
    price: 'KSh 100',
  },
  {
    id: 3,
    name: 'Pilau',
    category: 'Entrees',
    description: 'Fragrant spiced rice with beef or chicken',
    price: 'KSh 200',
  },
  {
    id: 4,
    name: 'Samosas',
    category: 'Appetizers',
    description: 'Hand-crafted crispy pastries filled with minced meat or vegetables',
    price: 'KSh 20',
  },
  {
    id: 5,
    name: 'Kachumbari',
    category: 'Salads',
    description: 'Fresh tomato and onion salad with cilantro and lemon',
    price: 'KSh 50',
  },
  {
    id: 6,
    name: 'Chapati',
    category: 'Sides',
    description: 'Soft, layered Kenyan flatbread',
    price: 'KSh 20',
  },
]

export default function MenuItems() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-6">
        {/* Page Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Items</h1>
            <p className="text-gray-600">Manage your menu offerings and pricing</p>
          </div>
          <button className="bg-[#CC2622] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#A01F1A] transition flex items-center gap-2">
            + ADD MENU ITEM
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items by name or description"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#CC2622] focus:ring-1 focus:ring-[#CC2622]"
            />
          </div>
        </div>

        {/* Menu Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">NAME</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">CATEGORY</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">DESCRIPTION</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">DEFAULT PRICE</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item, idx) => (
                <tr key={item.id} className={idx !== menuItems.length - 1 ? 'border-b border-gray-200' : ''}>
                  <td className="px-6 py-4 text-gray-900 font-semibold">{item.name}</td>
                  <td className="px-6 py-4 text-gray-600">{item.category}</td>
                  <td className="px-6 py-4 text-gray-600">{item.description}</td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">{item.price}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <Trash2 className="w-4 h-4 text-gray-600" />
                    </button>
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
