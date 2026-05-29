import { cookies } from 'next/headers'

export const ACTIVE_BARBERSHOP_COOKIE = 'active-barbershop'

export async function getActiveBarbershopId(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACTIVE_BARBERSHOP_COOKIE)?.value ?? null
}

export async function setActiveBarbershopId(id: string): Promise<void> {
  const store = await cookies()
  store.set(ACTIVE_BARBERSHOP_COOKIE, id, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
}
