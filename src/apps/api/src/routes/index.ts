import type { FastifyInstance } from 'fastify'
import { barbershopRoutes } from './barbershops'
import { healthRoute } from './health'

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoute, { prefix: '/api' })
  await app.register(barbershopRoutes, { prefix: '/api' })
}
