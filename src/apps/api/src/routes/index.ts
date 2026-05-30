import type { FastifyInstance } from 'fastify'
import { barberRoutes } from './barbers'
import { barbershopRoutes } from './barbershops'
import { healthRoute } from './health'
import { publicRoutes } from './public'
import { serviceRoutes } from './services'

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoute, { prefix: '/api' })
  await app.register(barbershopRoutes, { prefix: '/api' })
  await app.register(serviceRoutes, { prefix: '/api' })
  await app.register(barberRoutes, { prefix: '/api' })
  await app.register(publicRoutes, { prefix: '/api' })
}
