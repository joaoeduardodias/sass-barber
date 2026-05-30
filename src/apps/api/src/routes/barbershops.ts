import { prisma } from '@barber/database'
import { createBarbershopSchema, updateBarbershopSchema } from '@barber/types'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ApiError } from '../lib/errors'
import { generateUniqueSlug } from '../lib/slug'
import { resolveMembership } from '../plugins/tenant'

const idParams = z.object({ id: z.string() })

export const barbershopRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/barbershops', { preHandler: [app.requireAuth] }, async (request) => {
    const user = request.user
    if (!user) throw new ApiError(401, 'Unauthorized', 'Autenticação necessária')
    const shops = await prisma.barbershop.findMany({
      where: { OR: [{ ownerId: user.id }, { barbers: { some: { userId: user.id } } }] },
      orderBy: { createdAt: 'asc' },
    })
    return { data: shops }
  })

  app.post(
    '/barbershops',
    { preHandler: [app.requireAuth], schema: { body: createBarbershopSchema } },
    async (request, reply) => {
      const user = request.user
      if (!user) throw new ApiError(401, 'Unauthorized', 'Autenticação necessária')
      const input = request.body
      const slug = await generateUniqueSlug(input.name)
      const shop = await prisma.barbershop.create({
        data: { ...input, slug, ownerId: user.id },
      })
      if (user.role === 'CUSTOMER') {
        await prisma.user.update({ where: { id: user.id }, data: { role: 'OWNER' } })
      }
      return reply.status(201).send({ data: shop })
    },
  )

  app.get(
    '/barbershops/:id',
    { preHandler: [app.requireAuth], schema: { params: idParams } },
    async (request) => {
      const user = request.user
      if (!user) throw new ApiError(401, 'Unauthorized', 'Autenticação necessária')
      const { id } = request.params
      const role = await resolveMembership(user.id, id)
      if (!role) throw new ApiError(403, 'Forbidden', 'Você não tem acesso a esta barbearia')
      const shop = await prisma.barbershop.findUnique({ where: { id } })
      if (!shop) throw new ApiError(404, 'Not Found', 'Barbearia não encontrada')
      return { data: shop }
    },
  )

  app.patch(
    '/barbershops/:id',
    { preHandler: [app.requireAuth], schema: { params: idParams, body: updateBarbershopSchema } },
    async (request) => {
      const user = request.user
      if (!user) throw new ApiError(401, 'Unauthorized', 'Autenticação necessária')
      const { id } = request.params
      const role = await resolveMembership(user.id, id)
      if (role !== 'OWNER') {
        throw new ApiError(403, 'Forbidden', 'Apenas o dono pode editar a barbearia')
      }
      const data = request.body
      if (data.slug) {
        const existing = await prisma.barbershop.findUnique({
          where: { slug: data.slug },
          select: { id: true },
        })
        if (existing && existing.id !== id) {
          throw new ApiError(409, 'Conflict', 'Este slug já está em uso')
        }
      }
      const shop = await prisma.barbershop.update({ where: { id }, data })
      return { data: shop }
    },
  )
}
