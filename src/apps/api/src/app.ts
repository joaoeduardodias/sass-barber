import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import Fastify from 'fastify'
import { auth } from './auth'
import { env } from './env'
import { registerRoutes } from './routes'

export async function createApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  })

  await app.register(sensible)
  await app.register(helmet)
  await app.register(cors, {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    credentials: true,
  })
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
  })

  // Delegate all /api/auth/* routes to better-auth
  app.all('/api/auth/*', (request, reply) => {
    return auth.handler(request.raw, reply.raw)
  })

  await registerRoutes(app)

  return app
}
