'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { login as loginRequest, register as registerRequest } from '@/lib/api/auth'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/lib/api/auth'
import { clearSession, setSessionTokens, setToken, USER_KEY } from '@/lib/api/client'

type AuthUser = {
  email: string
  fullName: string
  businessName: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

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
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
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
        setUser(JSON.parse(storedUser))
      } catch {
        clearSession()
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(
    async (payload: LoginRequest) => {
      const auth = await loginRequest(payload)
      setUser(storeSession(auth))
      router.push('/dashboard')
    },
    [router]
  )

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const auth = await registerRequest(payload)
      setUser(storeSession(auth))
      router.push('/dashboard')
    },
    [router]
  )

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
