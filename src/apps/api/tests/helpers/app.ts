import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { createApp } from '../../src/app'

export async function buildTestApp(setup?: FastifyPluginAsync): Promise<FastifyInstance> {
  const app = await createApp()
  if (setup) await app.register(setup)
  await app.ready()
  return app
}
