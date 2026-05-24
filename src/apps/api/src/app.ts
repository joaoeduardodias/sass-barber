import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { auth } from './auth'
import { env } from './env'
import { errorHandler, notFoundHandler } from './lib/errors'
import { registerRoutes } from './routes'

export async function createApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : env.NODE_ENV === 'test' ? 'silent' : 'debug',
    },
  })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.setErrorHandler(errorHandler)
  app.setNotFoundHandler(notFoundHandler)

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
  app.all('/api/auth/*', async (request, reply) => {
    const req = new Request(`${env.BETTER_AUTH_URL}${request.url}`, {
      method: request.method,
      headers: request.headers as Record<string, string>,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : JSON.stringify(request.body),
    })
    const res = await auth.handler(req)
    res.headers.forEach((value, key) => reply.header(key, value))
    const body = await res.text()
    return reply.status(res.status).send(body)
  })

  await registerRoutes(app)

  return app
}
