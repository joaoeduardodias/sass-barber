import { z } from 'zod'

export const inviteBarberSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
  email: z.email('E-mail inválido'),
  bio: z.string().max(500).optional(),
})

export const updateBarberSchema = z.object({
  bio: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
})

export type InviteBarberInput = z.infer<typeof inviteBarberSchema>
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>

export interface BarberUser {
  id: string
  name: string
  email: string
  image: string | null
}

export interface Barber {
  id: string
  userId: string
  barbershopId: string
  bio: string | null
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  user: BarberUser
}

export interface InviteBarberResult extends Barber {
  tempPassword: string | null
}
