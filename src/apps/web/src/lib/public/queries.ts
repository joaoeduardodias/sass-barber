import 'server-only'
import { apiFetch } from '@/lib/api/server'
import type { PublicBarber, PublicBarbershop, Service } from '@barber/types'

export function getPublicBarbershop(slug: string) {
  return apiFetch<PublicBarbershop>(`/public/barbershops/${slug}`)
}

export function listPublicServices(slug: string) {
  return apiFetch<Service[]>(`/public/barbershops/${slug}/services`)
}

export function listPublicBarbers(slug: string) {
  return apiFetch<PublicBarber[]>(`/public/barbershops/${slug}/barbers`)
}
