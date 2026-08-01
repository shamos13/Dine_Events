import { apiClient } from './client'

export type UserRole = 'ADMIN' | 'CLIENT'

export type AuthResponse = {
  token: string
  refreshToken?: string
  email: string
  fullName: string
  businessName: string | null
  role: UserRole
  clientId?: number | null
  profileImageUrl?: string | null
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  fullName: string
  email: string
  password: string
  phone: string
  companyName?: string
}

export const login = (payload: LoginRequest) =>
  apiClient<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export const register = (payload: RegisterRequest) =>
  apiClient<AuthResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
