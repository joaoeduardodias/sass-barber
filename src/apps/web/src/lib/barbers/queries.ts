import 'server-only'
import { apiFetch } from '@/lib/api/server'
import type { Barber } from '@barber/types'

export function listBarbers(barbershopId: string) {
  return apiFetch<Barber[]>('/barbers', { headers: { 'x-barbershop-id': barbershopId } })
}
