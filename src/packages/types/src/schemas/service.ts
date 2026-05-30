import { z } from 'zod'

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
  description: z.string().max(500).optional(),
  duration: z.coerce
    .number()
    .int('Duração inválida')
    .min(5, 'Mínimo de 5 minutos')
    .max(600, 'Máximo de 600 minutos'),
  price: z.coerce.number().positive('Preço inválido').max(100000),
})

export const updateServiceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  duration: z.coerce.number().int().min(5).max(600).optional(),
  price: z.coerce.number().positive().max(100000).optional(),
  isActive: z.boolean().optional(),
})

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>

export interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  barbershopId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
