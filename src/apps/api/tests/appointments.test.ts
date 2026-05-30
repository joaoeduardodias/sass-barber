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

describe('POST /api/appointments', () => {
  it('requires authentication (401)', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/appointments', payload: {} })
    expect(res.statusCode).toBe(401)
  })

  it('validates body (400)', async () => {
    const customer = await createTestUser({ role: 'CUSTOMER' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/appointments',
      headers: { cookie: customer.cookie },
      payload: { barbershopId: '', serviceId: '', barberId: '', scheduledAt: 'not-a-date' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('creates an appointment and returns details (201)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const customer = await createTestUser({ role: 'CUSTOMER' })
    const shop = await createBarbershop(owner.id)
    const barberProfile = await createBarberMembership(barber.id, shop.id)
    const service = await createService(shop.id, { name: 'Degradê', price: 50 })

    const scheduledAt = new Date(Date.UTC(2026, 6, 15, 9, 0)).toISOString()
    const res = await app.inject({
      method: 'POST',
      url: '/api/appointments',
      headers: { cookie: customer.cookie },
      payload: {
        barbershopId: shop.id,
        serviceId: service.id,
        barberId: barberProfile.id,
        scheduledAt,
      },
    })
    expect(res.statusCode).toBe(201)
    const { data } = res.json()
    expect(data).toMatchObject({
      status: 'PENDING',
      barbershopId: shop.id,
      customerId: customer.id,
    })
    expect(data.service).toMatchObject({ name: 'Degradê', price: 50 })
    expect(data.barber.user).toBeDefined()
    expect(data.barbershop.name).toBeDefined()
  })

  it('rejects a conflicting time slot (409)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const c1 = await createTestUser({ role: 'CUSTOMER' })
    const c2 = await createTestUser({ role: 'CUSTOMER' })
    const shop = await createBarbershop(owner.id, { slug: `conflict-${Date.now()}` })
    const barberProfile = await createBarberMembership(barber.id, shop.id)
    const service = await createService(shop.id)

    const scheduledAt = new Date(Date.UTC(2026, 7, 10, 10, 0))
    await createAppointment({
      customerId: c1.id,
      barberId: barberProfile.id,
      serviceId: service.id,
      barbershopId: shop.id,
      scheduledAt,
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/appointments',
      headers: { cookie: c2.cookie },
      payload: {
        barbershopId: shop.id,
        serviceId: service.id,
        barberId: barberProfile.id,
        scheduledAt: scheduledAt.toISOString(),
      },
    })
    expect(res.statusCode).toBe(409)
  })
})

describe('GET /api/appointments/my', () => {
  it('requires authentication (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/appointments/my' })
    expect(res.statusCode).toBe(401)
  })

  it("returns only the authenticated user's appointments", async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const cA = await createTestUser({ role: 'CUSTOMER' })
    const cB = await createTestUser({ role: 'CUSTOMER' })
    const shop = await createBarbershop(owner.id, { slug: `my-appts-${Date.now()}` })
    const barberProfile = await createBarberMembership(barber.id, shop.id)
    const service = await createService(shop.id)

    await createAppointment({
      customerId: cA.id,
      barberId: barberProfile.id,
      serviceId: service.id,
      barbershopId: shop.id,
    })
    await createAppointment({
      customerId: cB.id,
      barberId: barberProfile.id,
      serviceId: service.id,
      barbershopId: shop.id,
      scheduledAt: new Date(Date.now() + 2 * 86_400_000),
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/appointments/my',
      headers: { cookie: cA.cookie },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data.every((a: { customerId: string }) => a.customerId === cA.id)).toBe(true)
    expect(data[0].service).toBeDefined()
    expect(data[0].barber.user).toBeDefined()
  })
})

describe('PATCH /api/appointments/:id/cancel', () => {
  it('cancels a PENDING appointment (200)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const customer = await createTestUser({ role: 'CUSTOMER' })
    const shop = await createBarbershop(owner.id, { slug: `cancel-ok-${Date.now()}` })
    const barberProfile = await createBarberMembership(barber.id, shop.id)
    const service = await createService(shop.id)
    const appt = await createAppointment({
      customerId: customer.id,
      barberId: barberProfile.id,
      serviceId: service.id,
      barbershopId: shop.id,
    })

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/appointments/${appt.id}/cancel`,
      headers: { cookie: customer.cookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('CANCELLED')
  })

  it('forbids a different customer from cancelling (403)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const customer = await createTestUser({ role: 'CUSTOMER' })
    const other = await createTestUser({ role: 'CUSTOMER' })
    const shop = await createBarbershop(owner.id, { slug: `cancel-403-${Date.now()}` })
    const barberProfile = await createBarberMembership(barber.id, shop.id)
    const service = await createService(shop.id)
    const appt = await createAppointment({
      customerId: customer.id,
      barberId: barberProfile.id,
      serviceId: service.id,
      barbershopId: shop.id,
    })

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/appointments/${appt.id}/cancel`,
      headers: { cookie: other.cookie },
    })
    expect(res.statusCode).toBe(403)
  })

  it('rejects cancelling a COMPLETED appointment (422)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const customer = await createTestUser({ role: 'CUSTOMER' })
    const shop = await createBarbershop(owner.id, { slug: `cancel-422-${Date.now()}` })
    const barberProfile = await createBarberMembership(barber.id, shop.id)
    const service = await createService(shop.id)
    const appt = await createAppointment({
      customerId: customer.id,
      barberId: barberProfile.id,
      serviceId: service.id,
      barbershopId: shop.id,
      status: 'COMPLETED',
    })

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/appointments/${appt.id}/cancel`,
      headers: { cookie: customer.cookie },
    })
    expect(res.statusCode).toBe(422)
  })

  it('returns 404 for non-existent appointment', async () => {
    const customer = await createTestUser({ role: 'CUSTOMER' })
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/appointments/non-existent-id/cancel',
      headers: { cookie: customer.cookie },
    })
    expect(res.statusCode).toBe(404)
  })
})
