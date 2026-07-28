export type ApiErrorPayload = {
  status: number
  error: string
  message: string
  fieldErrors?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number
  readonly error: string
  readonly fieldErrors?: Record<string, string>

  constructor(payload: ApiErrorPayload) {
    super(payload.message)
    this.name = 'ApiError'
    this.status = payload.status
    this.error = payload.error
    this.fieldErrors = payload.fieldErrors
  }
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
const TOKEN_KEY = 'dine_events_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY)
}

export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!baseUrl) {
    throw new ApiError({ status: 0, error: 'Configuration Error', message: 'NEXT_PUBLIC_API_BASE_URL is not configured.' })
  }

  const token = getToken()

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const body: unknown = isJson ? await response.json() : null

  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
    }
    const fallback = { status: response.status, error: response.statusText, message: 'The request failed.' }
    throw new ApiError(isApiErrorPayload(body) ? body : fallback)
  }
  return body as T
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null && 'status' in value && 'error' in value && 'message' in value
}