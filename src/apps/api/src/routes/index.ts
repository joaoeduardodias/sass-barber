import type { FastifyInstance } from 'fastify'
import { healthRoute } from './health'

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoute, { prefix: '/api' })
}
