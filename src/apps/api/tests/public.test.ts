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

describe('GET /api/public/barbershops/:slug', () => {
  it('returns barbershop info for a valid slug', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    await createBarbershop(owner.id, { name: 'Barbearia Pub', slug: 'barbearia-pub' })

    const res = await app.inject({ method: 'GET', url: '/api/public/barbershops/barbearia-pub' })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data).toMatchObject({ name: 'Barbearia Pub', slug: 'barbearia-pub' })
    expect(data).not.toHaveProperty('ownerId')
  })

  it('returns 404 for an unknown slug', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/public/barbershops/no-such-shop' })
    expect(res.statusCode).toBe(404)
  })
})

describe('GET /api/public/barbershops/:slug/services', () => {
  it('lists active services for the shop', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id, { slug: 'pub-svc-shop' })
    await createService(shop.id, { name: 'Corte VIP', price: 80 })

    const res = await app.inject({
      method: 'GET',
      url: `/api/public/barbershops/${shop.slug}/services`,
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({ name: 'Corte VIP' })
    expect(typeof data[0].price).toBe('number')
  })

  it('returns 404 for an unknown slug', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/public/barbershops/ghost-shop/services',
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('GET /api/public/barbershops/:slug/barbers', () => {
  it('lists active barbers for the shop', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER', name: 'Pub Barber' })
    const shop = await createBarbershop(owner.id, { slug: 'pub-barbers-shop' })
    await createBarberMembership(barber.id, shop.id)

    const res = await app.inject({
      method: 'GET',
      url: `/api/public/barbershops/${shop.slug}/barbers`,
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data).toHaveLength(1)
    expect(data[0].user.name).toBe('Pub Barber')
  })
})

describe('GET /api/public/barbershops/:slug/slots', () => {
  it('returns available time slots for a date', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const shop = await createBarbershop(owner.id, { slug: 'pub-slots-shop' })
    const barberProfile = await createBarberMembership(barber.id, shop.id)
    const service = await createService(shop.id, { duration: 60 })

    const res = await app.inject({
      method: 'GET',
      url: `/api/public/barbershops/${shop.slug}/slots?barberId=${barberProfile.id}&serviceId=${service.id}&date=2026-08-01`,
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data).toContain('09:00')
    expect(data).toHaveLength(9)
  })

  it('excludes already-booked slots', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const customer = await createTestUser({ role: 'CUSTOMER' })
    const shop = await createBarbershop(owner.id, { slug: 'pub-slots-booked' })
    const barberProfile = await createBarberMembership(barber.id, shop.id)
    const service = await createService(shop.id, { duration: 60 })

    await createAppointment({
      customerId: customer.id,
      barberId: barberProfile.id,
      serviceId: service.id,
      barbershopId: shop.id,
      scheduledAt: new Date(Date.UTC(2026, 8, 1, 9, 0)),
    })

    const res = await app.inject({
      method: 'GET',
      url: `/api/public/barbershops/${shop.slug}/slots?barberId=${barberProfile.id}&serviceId=${service.id}&date=2026-09-01`,
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).not.toContain('09:00')
    expect(res.json().data).toContain('10:00')
  })

  it('returns 400 when date format is invalid', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const shop = await createBarbershop(owner.id, { slug: 'pub-slots-bad-date' })
    const barberProfile = await createBarberMembership(barber.id, shop.id)
    const service = await createService(shop.id)

    const res = await app.inject({
      method: 'GET',
      url: `/api/public/barbershops/${shop.slug}/slots?barberId=${barberProfile.id}&serviceId=${service.id}&date=not-a-date`,
    })
    expect(res.statusCode).toBe(400)
  })
})
