import { prisma } from '@barber/database'
import { inviteBarberSchema, updateBarberSchema } from '@barber/types'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../auth'
import { ApiError } from '../lib/errors'

const idParams = z.object({ id: z.string() })

const userSelect = { id: true, name: true, email: true, image: true } as const

function generateTempPassword(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

export const barberRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/barbers', { preHandler: [app.requireAuth, app.requireBarbershop] }, async (request) => {
    const barbers = await prisma.barberProfile.findMany({
      where: { barbershopId: request.barbershopId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: userSelect } },
    })
    return { data: barbers }
  })

  app.post(
    '/barbers',
    {
      preHandler: [app.requireAuth, app.requireBarbershop],
      schema: { body: inviteBarberSchema },
    },
    async (request, reply) => {
      if (request.membershipRole !== 'OWNER') {
        throw new ApiError(403, 'Forbidden', 'Apenas o dono pode convidar barbeiros')
      }
      const { name, email, bio } = request.body
      const barbershopId = request.barbershopId

      let userId: string
      let tempPassword: string | null = null

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        const profile = await prisma.barberProfile.findUnique({
          where: { userId: existing.id },
          select: { id: true },
        })
        if (profile) {
          throw new ApiError(409, 'Conflict', 'Este usuário já é barbeiro em uma barbearia')
        }
        userId = existing.id
        if (existing.role === 'CUSTOMER') {
          await prisma.user.update({ where: { id: existing.id }, data: { role: 'BARBER' } })
        }
      } else {
        tempPassword = generateTempPassword()
        await auth.api.signUpEmail({ body: { name, email, password: tempPassword } })
        const created = await prisma.user.findUniqueOrThrow({ where: { email } })
        userId = created.id
        await prisma.user.update({ where: { id: userId }, data: { role: 'BARBER' } })
      }

      const barber = await prisma.barberProfile.create({
        data: { userId, barbershopId, bio: bio ?? null },
        include: { user: { select: userSelect } },
      })

      return reply.status(201).send({ data: { ...barber, tempPassword } })
    },
  )

  app.patch(
    '/barbers/:id',
    {
      preHandler: [app.requireAuth, app.requireBarbershop],
      schema: { params: idParams, body: updateBarberSchema },
    },
    async (request) => {
      if (request.membershipRole !== 'OWNER') {
        throw new ApiError(403, 'Forbidden', 'Apenas o dono pode editar barbeiros')
      }
      const existing = await prisma.barberProfile.findFirst({
        where: { id: request.params.id, barbershopId: request.barbershopId },
        select: { id: true },
      })
      if (!existing) throw new ApiError(404, 'Not Found', 'Barbeiro não encontrado')
      const barber = await prisma.barberProfile.update({
        where: { id: request.params.id },
        data: request.body,
        include: { user: { select: userSelect } },
      })
      return { data: barber }
    },
  )

  app.delete(
    '/barbers/:id',
    {
      preHandler: [app.requireAuth, app.requireBarbershop],
      schema: { params: idParams },
    },
    async (request, reply) => {
      if (request.membershipRole !== 'OWNER') {
        throw new ApiError(403, 'Forbidden', 'Apenas o dono pode remover barbeiros')
      }
      const existing = await prisma.barberProfile.findFirst({
        where: { id: request.params.id, barbershopId: request.barbershopId },
        select: { id: true, userId: true },
      })
      if (!existing) throw new ApiError(404, 'Not Found', 'Barbeiro não encontrado')
      const appointments = await prisma.appointment.count({
        where: { barberId: request.params.id },
      })
      if (appointments > 0) {
        throw new ApiError(409, 'Conflict', 'Barbeiro possui agendamentos e não pode ser removido')
      }
      await prisma.barberProfile.delete({ where: { id: request.params.id } })
      const user = await prisma.user.findUnique({ where: { id: existing.userId } })
      if (user?.role === 'BARBER') {
        await prisma.user.update({ where: { id: user.id }, data: { role: 'CUSTOMER' } })
      }
      return reply.status(204).send()
    },
  )
}
