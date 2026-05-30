import { cookies } from 'next/headers'

const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export class ApiFetchError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ApiFetchError'
    this.statusCode = statusCode
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies()
  const headers = new Headers(init?.headers)
  headers.set('cookie', cookieStore.toString())

  const activeShop = cookieStore.get('active-barbershop')?.value
  if (activeShop && !headers.has('x-barbershop-id')) headers.set('x-barbershop-id', activeShop)
  if (init?.body && !headers.has('content-type')) headers.set('content-type', 'application/json')

  const res = await fetch(`${API_URL}/api${path}`, { ...init, headers, cache: 'no-store' })
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiFetchError(res.status, json?.message ?? 'Erro na requisição')
  }
  return (json?.data ?? json) as T
}
