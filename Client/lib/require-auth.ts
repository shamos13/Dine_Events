'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { UserRole } from '@/lib/api/auth'

export function useRequireAuth() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  return { user, isLoading }
}

export function useRequireRole(role: UserRole) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== role) {
      router.push(user.role === 'CLIENT' ? '/portal' : '/dashboard')
    }
  }, [isLoading, user, role, router])

  return {
    user: user?.role === role ? user : null,
    isLoading: isLoading || !user || user.role !== role,
  }
}
