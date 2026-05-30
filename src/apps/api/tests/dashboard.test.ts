import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildTestApp } from './helpers/app'
import { createTestUser } from './helpers/auth'
import {
  createAppointment,
  createBarberMembership,
  createBarbershop,
  createService,
} from './helpers/db'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})
afterAll(async () => {
  await app.close()
})

describe('GET /api/dashboard/stats', () => {
  it('requires authentication (401)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/stats?from=2026-05-01&to=2026-05-31',
    })
    expect(res.statusCode).toBe(401)
  })

  it('requires X-Barbershop-Id header (400)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/stats?from=2026-05-01&to=2026-05-31',
      headers: { cookie: owner.cookie },
    })
    expect(res.statusCode).toBe(400)
  })

  it('validates date format (400)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/stats?from=not-a-date&to=2026-05-31',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns zeros when no COMPLETED appointments in range', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id, { slug: `dash-empty-${Date.now()}` })

    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/stats?from=2026-05-01&to=2026-05-31',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data.revenue).toBe(0)
    expect(data.avgTicket).toBe(0)
    expect(data.completedCount).toBe(0)
    expect(data.revenueDelta).toBe(0)
    expect(data.topServices).toHaveLength(0)
  })

  it('counts only COMPLETED appointments in range', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const customer = await createTestUser({ role: 'CUSTOMER' })
    const shop = await createBarbershop(owner.id, { slug: `dash-count-${Date.now()}` })
    const bp = await createBarberMembership(barber.id, shop.id)
    const svc = await createService(shop.id, { price: 50 })

    // COMPLETED in range → counted
    await createAppointment({
      customerId: customer.id,
      barberId: bp.id,
      serviceId: svc.id,
      barbershopId: shop.id,
      scheduledAt: new Date(Date.UTC(2026, 4, 15, 10, 0)), // May 15
      status: 'COMPLETED',
    })
    // PENDING in range → not counted
    await createAppointment({
      customerId: customer.id,
      barberId: bp.id,
      serviceId: svc.id,
      barbershopId: shop.id,
      scheduledAt: new Date(Date.UTC(2026, 4, 20, 10, 0)), // May 20
      status: 'PENDING',
    })
    // COMPLETED outside range → not counted
    await createAppointment({
      customerId: customer.id,
      barberId: bp.id,
      serviceId: svc.id,
      barbershopId: shop.id,
      scheduledAt: new Date(Date.UTC(2026, 5, 5, 10, 0)), // Jun 5
      status: 'COMPLETED',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/stats?from=2026-05-01&to=2026-05-31',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data.completedCount).toBe(1)
    expect(data.revenue).toBe(50)
    expect(data.avgTicket).toBe(50)
  })

  it('calculates revenue and avgTicket correctly for multiple appointments', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const customer = await createTestUser({ role: 'CUSTOMER' })
    const shop = await createBarbershop(owner.id, { slug: `dash-multi-${Date.now()}` })
    const bp = await createBarberMembership(barber.id, shop.id)
    const svc1 = await createService(shop.id, { name: 'A', price: 60 })
    const svc2 = await createService(shop.id, { name: 'B', price: 40 })

    await createAppointment({
      customerId: customer.id,
      barberId: bp.id,
      serviceId: svc1.id,
      barbershopId: shop.id,
      scheduledAt: new Date(Date.UTC(2026, 4, 10, 9, 0)),
      status: 'COMPLETED',
    })
    await createAppointment({
      customerId: customer.id,
      barberId: bp.id,
      serviceId: svc2.id,
      barbershopId: shop.id,
      scheduledAt: new Date(Date.UTC(2026, 4, 11, 9, 0)),
      status: 'COMPLETED',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/stats?from=2026-05-01&to=2026-05-31',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data.completedCount).toBe(2)
    expect(data.revenue).toBe(100)
    expect(data.avgTicket).toBe(50)
  })

  it('returns delta +100 when prior has no data but current does', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const customer = await createTestUser({ role: 'CUSTOMER' })
    const shop = await createBarbershop(owner.id, { slug: `dash-nodelta-${Date.now()}` })
    const bp = await createBarberMembership(barber.id, shop.id)
    const svc = await createService(shop.id, { price: 80 })

    await createAppointment({
      customerId: customer.id,
      barberId: bp.id,
      serviceId: svc.id,
      barbershopId: shop.id,
      scheduledAt: new Date(Date.UTC(2099, 0, 15, 9, 0)), // far future current period
      status: 'COMPLETED',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/stats?from=2099-01-01&to=2099-01-31',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data.completedCount).toBe(1)
    expect(data.revenueDelta).toBe(100)
    expect(data.completedCountDelta).toBe(100)
  })

  it('returns topServices ordered by count desc, limited to 5', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const customer = await createTestUser({ role: 'CUSTOMER' })
    const shop = await createBarbershop(owner.id, { slug: `dash-top-${Date.now()}` })
    const bp = await createBarberMembership(barber.id, shop.id)

    const svcs = await Promise.all([
      createService(shop.id, { name: 'S1', price: 30 }),
      createService(shop.id, { name: 'S2', price: 30 }),
      createService(shop.id, { name: 'S3', price: 30 }),
      createService(shop.id, { name: 'S4', price: 30 }),
      createService(shop.id, { name: 'S5', price: 30 }),
      createService(shop.id, { name: 'S6-last', price: 30 }),
    ])

    const makeAppts = async (svc: (typeof svcs)[0], n: number, baseHour: number) => {
      for (let i = 0; i < n; i++) {
        await createAppointment({
          customerId: customer.id,
          barberId: bp.id,
          serviceId: svc.id,
          barbershopId: shop.id,
          scheduledAt: new Date(Date.UTC(2098, 0, i + 1, baseHour, 0)),
          status: 'COMPLETED',
        })
      }
    }

    await makeAppts(svcs[0], 5, 9) // S1: 5 appts
    await makeAppts(svcs[1], 4, 10) // S2: 4 appts
    await makeAppts(svcs[2], 3, 11) // S3: 3 appts
    await makeAppts(svcs[3], 2, 12) // S4: 2 appts
    await makeAppts(svcs[4], 2, 13) // S5: 2 appts
    await makeAppts(svcs[5], 1, 14) // S6: 1 appt → excluded

    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/stats?from=2098-01-01&to=2098-01-31',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data.topServices).toHaveLength(5)
    expect(data.topServices[0].name).toBe('S1')
    expect(data.topServices[0].count).toBe(5)
    expect(data.topServices.map((s: { name: string }) => s.name)).not.toContain('S6-last')
  })
})
