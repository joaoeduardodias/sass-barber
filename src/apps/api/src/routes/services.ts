import { type Service as PrismaService, prisma } from '@barber/database'
import { createServiceSchema, updateServiceSchema } from '@barber/types'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ApiError } from '../lib/errors'

const idParams = z.object({ id: z.string() })

function serialize(service: PrismaService) {
  return { ...service, price: Number(service.price) }
}

export const serviceRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/services',
    { preHandler: [app.requireAuth, app.requireBarbershop] },
    async (request) => {
      const services = await prisma.service.findMany({
        where: { barbershopId: request.barbershopId },
        orderBy: { createdAt: 'asc' },
      })
      return { data: services.map(serialize) }
    },
  )

  app.post(
    '/services',
    {
      preHandler: [app.requireAuth, app.requireBarbershop],
      schema: { body: createServiceSchema },
    },
    async (request, reply) => {
      if (request.membershipRole !== 'OWNER') {
        throw new ApiError(403, 'Forbidden', 'Apenas o dono pode criar serviços')
      }
      const service = await prisma.service.create({
        data: { ...request.body, barbershopId: request.barbershopId },
      })
      return reply.status(201).send({ data: serialize(service) })
    },
  )

  app.get(
    '/services/:id',
    {
      preHandler: [app.requireAuth, app.requireBarbershop],
      schema: { params: idParams },
    },
    async (request) => {
      const service = await prisma.service.findFirst({
        where: { id: request.params.id, barbershopId: request.barbershopId },
      })
      if (!service) throw new ApiError(404, 'Not Found', 'Serviço não encontrado')
      return { data: serialize(service) }
    },
  )

  app.patch(
    '/services/:id',
    {
      preHandler: [app.requireAuth, app.requireBarbershop],
      schema: { params: idParams, body: updateServiceSchema },
    },
    async (request) => {
      if (request.membershipRole !== 'OWNER') {
        throw new ApiError(403, 'Forbidden', 'Apenas o dono pode editar serviços')
      }
      const existing = await prisma.service.findFirst({
        where: { id: request.params.id, barbershopId: request.barbershopId },
        select: { id: true },
      })
      if (!existing) throw new ApiError(404, 'Not Found', 'Serviço não encontrado')
      const service = await prisma.service.update({
        where: { id: request.params.id },
        data: request.body,
      })
      return { data: serialize(service) }
    },
  )

  app.delete(
    '/services/:id',
    {
      preHandler: [app.requireAuth, app.requireBarbershop],
      schema: { params: idParams },
    },
    async (request, reply) => {
      if (request.membershipRole !== 'OWNER') {
        throw new ApiError(403, 'Forbidden', 'Apenas o dono pode remover serviços')
      }
      const existing = await prisma.service.findFirst({
        where: { id: request.params.id, barbershopId: request.barbershopId },
        select: { id: true },
      })
      if (!existing) throw new ApiError(404, 'Not Found', 'Serviço não encontrado')
      const appointments = await prisma.appointment.count({
        where: { serviceId: request.params.id },
      })
      if (appointments > 0) {
        throw new ApiError(409, 'Conflict', 'Serviço possui agendamentos e não pode ser removido')
      }
      await prisma.service.delete({ where: { id: request.params.id } })
      return reply.status(204).send()
    },
  )
}
