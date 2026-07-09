export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

interface DuffelErrorEnvelope {
  errors?: { title?: string; message?: string }[]
}

function fallbackMessage(status: number): string {
  if (status === 401) return 'The server is not authorized with Duffel — check the access token.'
  if (status === 429) return 'Too many requests — please wait a few seconds and try again.'
  if (status >= 500) return 'The flight search service is temporarily unavailable.'
  return `Request failed with status ${status}.`
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new ApiError(0, 'Network error — check your connection and try again.')
  }

  if (!response.ok) {
    let message = fallbackMessage(response.status)
    try {
      const body = (await response.json()) as DuffelErrorEnvelope
      const first = body.errors?.[0]
      if (response.status !== 429 && first?.message) message = first.message
    } catch {
      // Non-JSON error body — keep the fallback message.
    }
    throw new ApiError(response.status, message)
  }

  return (await response.json()) as T
}
