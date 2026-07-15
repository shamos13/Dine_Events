'use client'

import { Bell, Settings, User, Menu } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex shrink-0 items-center">
            <Image
              src="/dine-events-logo.png"
              alt="Dine Events"
              width={156}
              height={52}
              priority
              className="h-12 w-[156px] object-contain"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-[#CC2622] text-sm font-medium transition"
            >
              Dashboard
            </Link>
            <Link
              href="/events"
              className="text-gray-700 hover:text-[#CC2622] text-sm font-medium transition"
            >
              Events
            </Link>
            <Link
              href="/calendar"
              className="text-gray-700 hover:text-[#CC2622] text-sm font-medium transition"
            >
              Calendar
            </Link>
            <Link
              href="/reports"
              className="text-gray-700 hover:text-[#CC2622] text-sm font-medium transition"
            >
              Reports
            </Link>
            <Link
              href="/invoices"
              className="text-gray-700 hover:text-[#CC2622] text-sm font-medium transition"
            >
              Invoices
            </Link>
            <Link
              href="/crm"
              className="text-gray-700 hover:text-[#CC2622] text-sm font-medium transition"
            >
              CRM
            </Link>
            <div className="relative group">
              <button className="text-[#CC2622] hover:text-[#A01F1A] text-sm font-medium transition flex items-center gap-1">
                Catalog <span>▼</span>
              </button>
              <div className="absolute top-full left-0 mt-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                <Link
                  href="/catalog/packages"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#CC2622]"
                >
                  Packages
                </Link>
                <Link
                  href="/catalog/menu"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#CC2622] border-t border-gray-200"
                >
                  Menu Items
                </Link>
              </div>
            </div>
            <div className="relative group">
              <button className="text-gray-700 hover:text-[#CC2622] text-sm font-medium transition flex items-center gap-1">
                Kitchen <span>▼</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-gray-600 hover:text-[#CC2622] transition p-2">
            <Bell size={20} />
          </button>
          <button className="text-gray-600 hover:text-[#CC2622] transition p-2">
            <Settings size={20} />
          </button>
          <button className="text-gray-600 hover:text-[#CC2622] transition p-2">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
