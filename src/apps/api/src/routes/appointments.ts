import { prisma } from '@barber/database'
import { createAppointmentSchema } from '@barber/types'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ApiError } from '../lib/errors'

const idParams = z.object({ id: z.string() })

export const appointmentRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post('/appointments', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const parsed = createAppointmentSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      throw new ApiError(400, 'Bad Request', message)
    }
    const { barbershopId, serviceId, barberId, scheduledAt, notes } = parsed.data

    const shop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { id: true },
    })
    if (!shop) throw new ApiError(404, 'Not Found', 'Barbearia não encontrada')

    const service = await prisma.service.findFirst({
      where: { id: serviceId, barbershopId, isActive: true },
      select: { id: true },
    })
    if (!service) throw new ApiError(404, 'Not Found', 'Serviço não encontrado')

    const barber = await prisma.barberProfile.findFirst({
      where: { id: barberId, barbershopId, isActive: true },
      select: { id: true },
    })
    if (!barber) throw new ApiError(404, 'Not Found', 'Barbeiro não encontrado')

    const scheduledDate = new Date(scheduledAt)
    const conflict = await prisma.appointment.findFirst({
      where: {
        barberId,
        scheduledAt: scheduledDate,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      select: { id: true },
    })
    if (conflict) throw new ApiError(409, 'Conflict', 'Horário já reservado')

    const appointment = await prisma.appointment.create({
      data: {
        customerId: request.user.id,
        barberId,
        serviceId,
        barbershopId,
        scheduledAt: scheduledDate,
        notes,
      },
      include: {
        service: { select: { id: true, name: true, duration: true, price: true } },
        barber: { select: { id: true, user: { select: { name: true } } } },
        barbershop: { select: { id: true, name: true } },
      },
    })

    return reply.status(201).send({
      data: {
        ...appointment,
        scheduledAt: appointment.scheduledAt.toISOString(),
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString(),
        service: { ...appointment.service, price: Number(appointment.service.price) },
      },
    })
  })

  app.get('/appointments/my', { preHandler: [app.requireAuth] }, async (request) => {
    const appointments = await prisma.appointment.findMany({
      where: { customerId: request.user.id },
      include: {
        service: { select: { id: true, name: true, duration: true, price: true } },
        barber: { select: { id: true, user: { select: { name: true } } } },
        barbershop: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    })

    return {
      data: appointments.map((a) => ({
        ...a,
        scheduledAt: a.scheduledAt.toISOString(),
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        service: { ...a.service, price: Number(a.service.price) },
      })),
    }
  })

  app.patch(
    '/appointments/:id/cancel',
    { preHandler: [app.requireAuth], schema: { params: idParams } },
    async (request) => {
      const appointment = await prisma.appointment.findUnique({
        where: { id: request.params.id },
        select: { id: true, customerId: true, status: true },
      })
      if (!appointment) throw new ApiError(404, 'Not Found', 'Agendamento não encontrado')
      if (appointment.customerId !== request.user.id) {
        throw new ApiError(403, 'Forbidden', 'Não autorizado')
      }
      if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
        throw new ApiError(422, 'Unprocessable', 'Agendamento não pode ser cancelado')
      }

      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CANCELLED' },
        include: {
          service: { select: { id: true, name: true, duration: true, price: true } },
          barber: { select: { id: true, user: { select: { name: true } } } },
          barbershop: { select: { id: true, name: true } },
        },
      })

      return {
        data: {
          ...updated,
          scheduledAt: updated.scheduledAt.toISOString(),
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
          service: { ...updated.service, price: Number(updated.service.price) },
        },
      }
    },
  )
}
