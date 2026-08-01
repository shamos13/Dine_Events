'use client'

import { useRequireRole } from '@/lib/require-auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useRequireRole('ADMIN')

  if (isLoading || !user) {
    return null
  }

  return <>{children}</>
}
