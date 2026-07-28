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

export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!baseUrl) {
    throw new ApiError({ status: 0, error: 'Configuration Error', message: 'NEXT_PUBLIC_API_BASE_URL is not configured.' })
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...init.headers },
  })
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const body: unknown = isJson ? await response.json() : null

  if (!response.ok) {
    const fallback = { status: response.status, error: response.statusText, message: 'The request failed.' }
    throw new ApiError(isApiErrorPayload(body) ? body : fallback)
  }
  return body as T
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null && 'status' in value && 'error' in value && 'message' in value
}
