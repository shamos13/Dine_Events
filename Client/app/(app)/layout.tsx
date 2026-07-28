'use client'

import { useRequireAuth } from '@/lib/require-auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useRequireAuth()

  if (isLoading || !user) {
    return null
  }

  return <>{children}</>
}