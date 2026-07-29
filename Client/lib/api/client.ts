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
const REFRESH_TOKEN_KEY = 'dine_events_refresh_token'
export const USER_KEY = 'dine_events_user'
const AUTH_PATHS = new Set(['/auth/login', '/auth/register', '/auth/refresh'])
let refreshPromise: Promise<boolean> | null = null

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function clearToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

export function clearRefreshToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearSession() {
  if (typeof window === 'undefined') return
  clearToken()
  clearRefreshToken()
  localStorage.removeItem(USER_KEY)
}

export function setSessionTokens(token: string, refreshToken: string) {
  setToken(token)
  setRefreshToken(refreshToken)
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const isJson = response.headers.get('content-type')?.includes('application/json')
  return isJson ? await response.json() : null
}

async function fetchWithAuth(path: string, init: RequestInit = {}): Promise<{ response: Response; body: unknown }> {
  const token = getToken()
  const headers = new Headers(init.headers ?? undefined)
  headers.set('Accept', 'application/json')
  if (token && !AUTH_PATHS.has(path)) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  })
  const body = await parseJsonResponse(response)
  return { response, body }
}

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = refreshSession()
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return false
  }

  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })

  const body = await parseJsonResponse(response)
  if (!response.ok) {
    return false
  }

  if (isAuthResponsePayload(body)) {
    setSessionTokens(body.token, body.refreshToken)
    return true
  }

  return false
}

function redirectToExpiredSession() {
  if (typeof window === 'undefined') return
  clearSession()
  const message = encodeURIComponent('Session expired. Please log in again.')
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?message=${message}`
  }
}

export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!baseUrl) {
    throw new ApiError({ status: 0, error: 'Configuration Error', message: 'NEXT_PUBLIC_API_BASE_URL is not configured.' })
  }

  const { response, body } = await fetchWithAuth(path, init)
  if (!response.ok) {
    if (response.status === 401 && !AUTH_PATHS.has(path)) {
      const refreshed = await tryRefreshToken()
      if (refreshed) {
        const retryResult = await fetchWithAuth(path, init)
        if (retryResult.response.ok) {
          return retryResult.body as T
        }
        if (retryResult.response.status === 401) {
          redirectToExpiredSession()
        }
        const fallback = { status: retryResult.response.status, error: retryResult.response.statusText, message: 'The request failed.' }
        throw new ApiError(isApiErrorPayload(retryResult.body) ? retryResult.body : fallback)
      }
    }

    if (response.status === 401) {
      redirectToExpiredSession()
    }

    const fallback = { status: response.status, error: response.statusText, message: 'The request failed.' }
    throw new ApiError(isApiErrorPayload(body) ? body : fallback)
  }

  return body as T
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null && 'status' in value && 'error' in value && 'message' in value
}

function isAuthResponsePayload(value: unknown): value is { token: string; refreshToken: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { token?: unknown }).token === 'string' &&
    typeof (value as { refreshToken?: unknown }).refreshToken === 'string'
  )
}
