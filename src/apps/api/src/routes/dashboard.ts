import { prisma } from '@barber/database'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

const statsQuery = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
})

const MS_PER_DAY = 86_400_000

function periodDates(from: string, to: string) {
  const parseDay = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  const fromMs = parseDay(from)
  const toMs = parseDay(to)
  const durationDays = Math.round((toMs - fromMs) / MS_PER_DAY) + 1

  return {
    fromDate: new Date(fromMs),
    toDate: new Date(toMs + MS_PER_DAY - 1),
    priorFromDate: new Date(fromMs - durationDays * MS_PER_DAY),
    priorToDate: new Date(fromMs - 1),
  }
}

function calcDelta(current: number, prior: number): number {
  if (prior === 0 && current === 0) return 0
  if (prior === 0) return 100
  return Math.round(((current - prior) / prior) * 1000) / 10
}

export const dashboardRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/dashboard/stats',
    {
      preHandler: [app.requireAuth, app.requireBarbershop],
      schema: { querystring: statsQuery },
    },
    async (request) => {
      const { from, to } = request.query
      const { fromDate, toDate, priorFromDate, priorToDate } = periodDates(from, to)

      const [current, prior] = await Promise.all([
        prisma.appointment.findMany({
          where: {
            barbershopId: request.barbershopId,
            status: 'COMPLETED',
            scheduledAt: { gte: fromDate, lte: toDate },
          },
          include: { service: { select: { id: true, name: true, price: true } } },
        }),
        prisma.appointment.findMany({
          where: {
            barbershopId: request.barbershopId,
            status: 'COMPLETED',
            scheduledAt: { gte: priorFromDate, lte: priorToDate },
          },
          include: { service: { select: { id: true, name: true, price: true } } },
        }),
      ])

      const sumRevenue = (appts: typeof current) =>
        appts.reduce((sum, a) => sum + Number(a.service.price), 0)

      const curRevenue = sumRevenue(current)
      const priRevenue = sumRevenue(prior)
      const curAvg = current.length ? curRevenue / current.length : 0
      const priAvg = prior.length ? priRevenue / prior.length : 0

      const serviceMap = new Map<
        string,
        { serviceId: string; name: string; count: number; revenue: number }
      >()
      for (const appt of current) {
        const entry = serviceMap.get(appt.service.id)
        if (entry) {
          entry.count++
          entry.revenue += Number(appt.service.price)
        } else {
          serviceMap.set(appt.service.id, {
            serviceId: appt.service.id,
            name: appt.service.name,
            count: 1,
            revenue: Number(appt.service.price),
          })
        }
      }
      const topServices = [...serviceMap.values()].sort((a, b) => b.count - a.count).slice(0, 5)

      return {
        data: {
          revenue: curRevenue,
          revenueDelta: calcDelta(curRevenue, priRevenue),
          avgTicket: Math.round(curAvg * 100) / 100,
          avgTicketDelta: calcDelta(curAvg, priAvg),
          completedCount: current.length,
          completedCountDelta: calcDelta(current.length, prior.length),
          topServices,
        },
      }
    },
  )
}
