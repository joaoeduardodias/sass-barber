import 'server-only'
import { apiFetch } from '@/lib/api/server'
import type { Barbershop } from '@barber/types'

export function listBarbershops() {
  return apiFetch<Barbershop[]>('/barbershops')
}

export function getBarbershop(id: string) {
  return apiFetch<Barbershop>(`/barbershops/${id}`)
}
