'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { login as loginRequest, register as registerRequest } from '@/lib/api/auth'
import type { AuthResponse, LoginRequest, RegisterRequest, UserRole } from '@/lib/api/auth'
import { clearSession, setSessionTokens, setToken, USER_KEY } from '@/lib/api/client'

export type AuthUser = {
  email: string
  fullName: string
  businessName: string | null
  role: UserRole
  clientId?: number | null
  profileImageUrl?: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
  updateUser: (patch: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function homeForRole(role: UserRole) {
  return role === 'CLIENT' ? '/portal' : '/dashboard'
}

function persistUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function storeSession(auth: AuthResponse): AuthUser {
  if (auth.refreshToken) {
    setSessionTokens(auth.token, auth.refreshToken)
  } else {
    setToken(auth.token)
  }

  const user: AuthUser = {
    email: auth.email,
    fullName: auth.fullName,
    businessName: auth.businessName,
    role: auth.role,
    clientId: auth.clientId ?? null,
    profileImageUrl: auth.profileImageUrl ?? null,
  }
  persistUser(user)
  return user
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY)
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser
        if (!parsed.role) {
          clearSession()
        } else {
          setUser(parsed)
        }
      } catch {
        clearSession()
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (payload: LoginRequest) => {
    const auth = await loginRequest(payload)
    const nextUser = storeSession(auth)
    setUser(nextUser)
    // Full navigation so the browser can offer to save the password.
    // Soft client routing (router.push) often suppresses that prompt.
    window.location.assign(homeForRole(nextUser.role))
  }, [])

  const register = useCallback(async (payload: RegisterRequest) => {
    const auth = await registerRequest(payload)
    const nextUser = storeSession(auth)
    setUser(nextUser)
    window.location.assign(homeForRole(nextUser.role))
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    router.push('/login')
  }, [router])

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((current) => {
      if (!current) return current
      const next = { ...current, ...patch }
      persistUser(next)
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
