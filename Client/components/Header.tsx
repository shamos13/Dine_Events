'use client'

import { Bell, ChevronDown, LogOut, Package, Settings, User, UtensilsCrossed } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

type NavLink = {
  href: string
  label: string
  match?: (pathname: string) => boolean
}

const mainLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', match: (pathname) => pathname === '/dashboard' },
  { href: '/events', label: 'Events', match: (pathname) => pathname.startsWith('/events') },
  { href: '/calendar', label: 'Calendar', match: (pathname) => pathname.startsWith('/calendar') },
  { href: '/reports', label: 'Reports', match: (pathname) => pathname.startsWith('/reports') },
  { href: '/invoices', label: 'Invoices', match: (pathname) => pathname.startsWith('/invoices') },
  { href: '/crm', label: 'CRM', match: (pathname) => pathname.startsWith('/crm') },
]

const catalogLinks = [
  {
    href: '/catalog/packages',
    label: 'Packages',
    description: 'Package offerings and pricing',
    icon: Package,
    match: (pathname: string) => pathname.startsWith('/catalog/packages'),
  },
  {
    href: '/catalog/menu',
    label: 'Menu Items',
    description: 'Individual dishes and categories',
    icon: UtensilsCrossed,
    match: (pathname: string) => pathname.startsWith('/catalog/menu'),
  },
]

function navLinkClass(active: boolean) {
  return cn(
    'relative pb-1 text-sm font-medium transition-colors',
    active
      ? 'text-[#CC2622] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-[#CC2622]'
      : 'text-gray-700 hover:text-[#CC2622]'
  )
}

export default function Header() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const catalogActive = pathname.startsWith('/catalog')

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
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

          <nav className="hidden items-center gap-8 lg:flex">
            {mainLinks.map((link) => {
              const active = link.match ? link.match(pathname) : pathname.startsWith(link.href)
              return (
                <Link key={link.href} href={link.href} className={navLinkClass(active)}>
                  {link.label}
                </Link>
              )
            })}

            <div className="group relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={catalogActive}
                className={cn(
                  'flex items-center gap-1 pb-1 text-sm font-medium transition-colors',
                  catalogActive
                    ? 'text-[#CC2622] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-[calc(100%-1rem)] after:rounded-full after:bg-[#CC2622]'
                    : 'text-gray-700 hover:text-[#CC2622]'
                )}
              >
                Catalog
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>

              <div className="invisible absolute left-0 top-full z-50 w-64 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#CC2622]">Catalog</p>
                    <p className="mt-0.5 text-xs text-gray-500">Manage your menu offerings</p>
                  </div>
                  <div className="p-2">
                    {catalogLinks.map((link) => {
                      const active = link.match(pathname)
                      const Icon = link.icon
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            'flex items-start gap-3 rounded-lg px-3 py-3 transition',
                            active
                              ? 'bg-red-50 text-[#CC2622]'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-[#CC2622]'
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              active ? 'bg-[#CC2622]/10 text-[#CC2622]' : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">{link.label}</span>
                            <span className="mt-0.5 block text-xs text-gray-500">{link.description}</span>
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 pb-1 text-sm font-medium text-gray-700 transition-colors hover:text-[#CC2622]"
              >
                Kitchen
                <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
              </button>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <button type="button" className="p-2 text-gray-600 transition hover:text-[#CC2622]">
            <Bell size={20} />
          </button>
          <button type="button" className="p-2 text-gray-600 transition hover:text-[#CC2622]">
            <Settings size={20} />
          </button>
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 p-2 text-gray-600 transition hover:text-[#CC2622]"
              title={user?.fullName}
            >
              <User size={20} />
            </button>
            <div className="invisible absolute right-0 top-full z-50 w-56 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                {user && (
                  <div className="border-b border-gray-200 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50 hover:text-[#CC2622]"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
