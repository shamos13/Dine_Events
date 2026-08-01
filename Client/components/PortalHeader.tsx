'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChevronDown, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getPortalProfile } from '@/lib/api/portal'
import { cn } from '@/lib/utils'

const links = [
  { href: '/portal', label: 'Dashboard', exact: true },
  { href: '/portal/build', label: 'Build Your Event' },
  { href: '/portal/bookings', label: 'My Bookings' },
  { href: '/portal/invoices', label: 'Invoices' },
  { href: '/portal/help', label: 'Help' },
]

function initialsFromName(fullName?: string | null) {
  if (!fullName?.trim()) return '?'
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function navLinkClass(active: boolean) {
  return cn(
    'relative pb-1 text-sm font-medium transition-colors',
    active
      ? 'text-[#CC2622] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-[#CC2622]'
      : 'text-gray-700 hover:text-[#CC2622]'
  )
}

export default function PortalHeader() {
  const pathname = usePathname()
  const { user, logout, updateUser } = useAuth()
  const initials = initialsFromName(user?.fullName)

  useEffect(() => {
    getPortalProfile()
      .then((profile) => {
        updateUser({
          fullName: profile.fullName,
          profileImageUrl: profile.profileImageUrl,
        })
      })
      .catch(() => {
        /* keep cached session user */
      })
  }, [updateUser])

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/portal" className="flex shrink-0 items-center">
            <Image
              src="/dine-events-logo.png"
              alt="Dine Events"
              width={156}
              height={52}
              priority
              className="h-12 w-[156px] object-contain"
            />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {links.map((link) => {
              const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
              return (
                <Link key={link.href} href={link.href} className={navLinkClass(active)}>
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-[#CC2622]"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>

          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full p-1 transition hover:bg-gray-100"
              title={user?.fullName}
            >
              <AvatarCircle initials={initials} imageUrl={user?.profileImageUrl} size="sm" />
              <ChevronDown className="hidden h-4 w-4 text-gray-500 sm:block" />
            </button>
            <div className="invisible absolute right-0 top-full z-50 w-56 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                {user && (
                  <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
                    <AvatarCircle initials={initials} imageUrl={user.profileImageUrl} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{user.fullName}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                )}
                <Link
                  href="/portal/profile"
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50 hover:text-[#CC2622]"
                >
                  <UserRound size={16} />
                  Profile & photo
                </Link>
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

      <nav className="flex gap-4 overflow-x-auto border-t border-gray-100 px-6 py-2 md:hidden">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn('whitespace-nowrap text-xs font-semibold', active ? 'text-[#CC2622]' : 'text-gray-600')}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

function AvatarCircle({
  initials,
  imageUrl,
  size,
}: {
  initials: string
  imageUrl?: string | null
  size: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 'h-9 w-9 text-xs' : 'h-10 w-10 text-sm'
  if (imageUrl) {
    return (
      <span className={cn('relative shrink-0 overflow-hidden rounded-full', dim)}>
        <Image src={imageUrl} alt="" fill sizes="40px" className="object-cover" unoptimized />
      </span>
    )
  }
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-[#CC2622] font-bold text-white', dim)}>
      {initials}
    </span>
  )
}
