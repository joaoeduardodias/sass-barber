import type { FastifyInstance } from 'fastify'
import { createApp } from '../../src/app'

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = await createApp()
  await app.ready()
  return app
}
