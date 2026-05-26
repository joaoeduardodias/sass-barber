import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildTestApp } from './helpers/app'
import { createTestUser } from './helpers/auth'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp(async (probe) => {
    probe.get('/api/_probe', { preHandler: [probe.requireAuth] }, async (request) => ({
      data: { userId: request.user?.id, role: request.user?.role },
    }))
    probe.get(
      '/api/_owner-only',
      { preHandler: [probe.requireAuth, probe.requireRole('OWNER')] },
      async () => ({ data: 'ok' }),
    )
  })
})
afterAll(async () => {
  await app.close()
})

describe('requireAuth', () => {
  it('rejects requests without a session (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/_probe' })
    expect(res.statusCode).toBe(401)
    expect(res.json()).toMatchObject({ statusCode: 401, error: 'Unauthorized' })
  })

  it('attaches request.user for an authenticated request', async () => {
    const user = await createTestUser()
    const res = await app.inject({
      method: 'GET',
      url: '/api/_probe',
      headers: { cookie: user.cookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({ userId: user.id, role: 'CUSTOMER' })
  })
})

describe('requireRole', () => {
  it('forbids a user whose role is not allowed (403)', async () => {
    const user = await createTestUser({ role: 'CUSTOMER' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/_owner-only',
      headers: { cookie: user.cookie },
    })
    expect(res.statusCode).toBe(403)
    expect(res.json()).toMatchObject({ statusCode: 403, error: 'Forbidden' })
  })

  it('allows a user whose role is permitted', async () => {
    const user = await createTestUser({ role: 'OWNER' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/_owner-only',
      headers: { cookie: user.cookie },
    })
    expect(res.statusCode).toBe(200)
  })
})
