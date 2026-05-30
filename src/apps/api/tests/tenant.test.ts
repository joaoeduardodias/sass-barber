import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildTestApp } from './helpers/app'
import { createTestUser } from './helpers/auth'
import { createBarberMembership, createBarbershop } from './helpers/db'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp(async (probe) => {
    probe.get(
      '/api/_scoped',
      { preHandler: [probe.requireAuth, probe.requireBarbershop] },
      async (request) => ({
        data: { barbershopId: request.barbershopId, role: request.membershipRole },
      }),
    )
  })
})
afterAll(async () => {
  await app.close()
})

describe('requireBarbershop', () => {
  it('returns 400 when the X-Barbershop-Id header is missing', async () => {
    const user = await createTestUser()
    const res = await app.inject({
      method: 'GET',
      url: '/api/_scoped',
      headers: { cookie: user.cookie },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 403 when the user is not a member', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const stranger = await createTestUser()
    const shop = await createBarbershop(owner.id)
    const res = await app.inject({
      method: 'GET',
      url: '/api/_scoped',
      headers: { cookie: stranger.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(403)
  })

  it('resolves OWNER membership', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const res = await app.inject({
      method: 'GET',
      url: '/api/_scoped',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({ barbershopId: shop.id, role: 'OWNER' })
  })

  it('resolves BARBER membership', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const shop = await createBarbershop(owner.id)
    await createBarberMembership(barber.id, shop.id)
    const res = await app.inject({
      method: 'GET',
      url: '/api/_scoped',
      headers: { cookie: barber.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({ role: 'BARBER' })
  })
})
