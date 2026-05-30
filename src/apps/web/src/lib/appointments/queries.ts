import 'server-only'
import { apiFetch } from '@/lib/api/server'
import type { AppointmentWithDetails } from '@barber/types'

export function listMyAppointments() {
  return apiFetch<AppointmentWithDetails[]>('/appointments/my')
}
