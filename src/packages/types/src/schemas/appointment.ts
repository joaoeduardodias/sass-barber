import { z } from 'zod'

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export const createAppointmentSchema = z.object({
  barbershopId: z.string().min(1),
  serviceId: z.string().min(1),
  barberId: z.string().min(1),
  scheduledAt: z.string().datetime({ message: 'Data inválida' }),
  notes: z.string().max(500).optional(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

/** Intentional public projection of Barbershop — exposes only fields safe for unauthenticated consumers. */
export interface PublicBarbershop {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  phone: string
  logoUrl: string | null
}

/** Intentional public projection of Barber — exposes only fields safe for unauthenticated consumers. */
export interface PublicBarber {
  id: string
  bio: string | null
  avatarUrl: string | null
  user: { name: string }
}

export interface AppointmentWithDetails {
  id: string
  customerId: string
  barberId: string
  serviceId: string
  barbershopId: string
  scheduledAt: string
  status: AppointmentStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  service: { id: string; name: string; duration: number; price: number }
  barber: { id: string; user: { name: string } }
  barbershop: { id: string; name: string; slug: string }
}
