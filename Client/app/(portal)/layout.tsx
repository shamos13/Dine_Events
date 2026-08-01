'use client'

import PortalHeader from '@/components/PortalHeader'
import { useRequireRole } from '@/lib/require-auth'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useRequireRole('CLIENT')

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] text-sm text-gray-600">
        Loading your portal…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FB]">
      <PortalHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Dine Events · Client Portal
      </footer>
    </div>
  )
}
