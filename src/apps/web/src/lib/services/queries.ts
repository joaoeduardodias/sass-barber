import 'server-only'
import { apiFetch } from '@/lib/api/server'
import type { Service } from '@barber/types'

export function listServices(barbershopId: string) {
  return apiFetch<Service[]>('/services', { headers: { 'x-barbershop-id': barbershopId } })
}
