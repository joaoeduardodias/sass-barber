import { z } from 'zod'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const createBarbershopSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
  description: z.string().max(500).optional(),
  address: z.string().min(5, 'Endereço inválido').max(200),
  phone: z.string().min(8, 'Telefone inválido').max(20),
  logoUrl: z.url('URL inválida').optional(),
})

export const updateBarbershopSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(slugRegex, 'Slug inválido').optional(),
  description: z.string().max(500).nullable().optional(),
  address: z.string().min(5).max(200).optional(),
  phone: z.string().min(8).max(20).optional(),
  logoUrl: z.url('URL inválida').nullable().optional(),
})

export type CreateBarbershopInput = z.infer<typeof createBarbershopSchema>
export type UpdateBarbershopInput = z.infer<typeof updateBarbershopSchema>
