import { apiClient } from './client'

export type AuthResponse = {
  token: string
  email: string
  fullName: string
  businessName: string | null
  role: 'ADMIN'
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  fullName: string
  businessName?: string
  email: string
  password: string
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