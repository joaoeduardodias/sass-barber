import { prisma } from '@barber/database'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ApiError } from '../lib/errors'
import { generateSlots } from '../lib/slots'

const slugParams = z.object({ slug: z.string() })
const slotsQuery = z.object({
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
})

export const publicRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/public/barbershops/:slug', { schema: { params: slugParams } }, async (request) => {
    const shop = await prisma.barbershop.findUnique({
      where: { slug: request.params.slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        address: true,
        phone: true,
        logoUrl: true,
      },
    })
    if (!shop) throw new ApiError(404, 'Not Found', 'Barbearia não encontrada')
    return { data: shop }
  })

  app.get(
    '/public/barbershops/:slug/services',
    { schema: { params: slugParams } },
    async (request) => {
      const shop = await prisma.barbershop.findUnique({
        where: { slug: request.params.slug, isActive: true },
        select: { id: true },
      })
      if (!shop) throw new ApiError(404, 'Not Found', 'Barbearia não encontrada')

      const services = await prisma.service.findMany({
        where: { barbershopId: shop.id, isActive: true },
        select: { id: true, name: true, description: true, price: true, duration: true },
        orderBy: { createdAt: 'asc' },
      })
      return { data: services.map((s) => ({ ...s, price: Number(s.price) })) }
    },
  )

  app.get(
    '/public/barbershops/:slug/barbers',
    { schema: { params: slugParams } },
    async (request) => {
      const shop = await prisma.barbershop.findUnique({
        where: { slug: request.params.slug, isActive: true },
        select: { id: true },
      })
      if (!shop) throw new ApiError(404, 'Not Found', 'Barbearia não encontrada')

      const barbers = await prisma.barberProfile.findMany({
        where: { barbershopId: shop.id, isActive: true },
        select: {
          id: true,
          bio: true,
          avatarUrl: true,
          user: { select: { name: true } },
        },
      })
      return { data: barbers }
    },
  )

  app.get(
    '/public/barbershops/:slug/slots',
    { schema: { params: slugParams, querystring: slotsQuery } },
    async (request) => {
      const { barberId, serviceId, date } = request.query

      const shop = await prisma.barbershop.findUnique({
        where: { slug: request.params.slug, isActive: true },
        select: { id: true },
      })
      if (!shop) throw new ApiError(404, 'Not Found', 'Barbearia não encontrada')

      const service = await prisma.service.findFirst({
        where: { id: serviceId, barbershopId: shop.id, isActive: true },
        select: { duration: true },
      })
      if (!service) throw new ApiError(404, 'Not Found', 'Serviço não encontrado')

      const [year, month, day] = date.split('-').map(Number)
      const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
      const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59))

      const booked = await prisma.appointment.findMany({
        where: {
          barberId,
          barbershopId: shop.id,
          scheduledAt: { gte: dayStart, lte: dayEnd },
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        },
        select: { scheduledAt: true },
      })

      const slots = generateSlots(
        date,
        service.duration,
        booked.map((a) => a.scheduledAt),
      )
      return { data: slots }
    },
  )
}
