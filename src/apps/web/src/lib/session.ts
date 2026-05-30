import { cookies } from 'next/headers'

const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface SessionUser {
  id: string
  name: string
  email: string
}

export async function getServerSession(): Promise<{ user: SessionUser } | null> {
  const cookieStore = await cookies()
  const res = await fetch(`${API_URL}/api/auth/get-session`, {
    headers: { cookie: cookieStore.toString() },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  return data?.user ? { user: data.user } : null
}
