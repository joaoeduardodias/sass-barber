export class ApiClientError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ApiClientError'
    this.statusCode = statusCode
  }
}

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('content-type')) headers.set('content-type', 'application/json')

  const res = await fetch(`/api/bff${path}`, { ...init, headers })
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiClientError(res.status, json?.message ?? 'Erro na requisição')
  }
  return (json?.data ?? json) as T
}
