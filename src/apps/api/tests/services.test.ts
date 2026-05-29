import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildTestApp } from './helpers/app'
import { createTestUser } from './helpers/auth'
import { createBarberMembership, createBarbershop, createService } from './helpers/db'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})
afterAll(async () => {
  await app.close()
})

const validBody = { name: 'Barba', duration: 20, price: 25 }

describe('POST /api/services', () => {
  it('requires authentication', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/services', payload: validBody })
    expect(res.statusCode).toBe(401)
  })

  it('requires the X-Barbershop-Id header (400)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/services',
      headers: { cookie: owner.cookie },
      payload: validBody,
    })
    expect(res.statusCode).toBe(400)
  })

  it('validates the body (400)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const res = await app.inject({
      method: 'POST',
      url: '/api/services',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
      payload: { name: 'x', duration: 1, price: -5 },
    })
    expect(res.statusCode).toBe(400)
  })

  it('forbids a barber from creating (403)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const shop = await createBarbershop(owner.id)
    await createBarberMembership(barber.id, shop.id)
    const res = await app.inject({
      method: 'POST',
      url: '/api/services',
      headers: { cookie: barber.cookie, 'x-barbershop-id': shop.id },
      payload: validBody,
    })
    expect(res.statusCode).toBe(403)
  })

  it('creates a service for the owner (price as number)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const res = await app.inject({
      method: 'POST',
      url: '/api/services',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
      payload: validBody,
    })
    expect(res.statusCode).toBe(201)
    const { data } = res.json()
    expect(data).toMatchObject({ name: 'Barba', duration: 20, price: 25, barbershopId: shop.id })
    expect(typeof data.price).toBe('number')
  })
})

describe('GET /api/services', () => {
  it('lists only the active barbershop services', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shopA = await createBarbershop(owner.id, { name: 'A', slug: 'shop-a' })
    const shopB = await createBarbershop(owner.id, { name: 'B', slug: 'shop-b' })
    await createService(shopA.id, { name: 'Corte A' })
    await createService(shopB.id, { name: 'Corte B' })

    const res = await app.inject({
      method: 'GET',
      url: '/api/services',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shopA.id },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({ name: 'Corte A' })
  })

  it('lets a barber member view the list', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const shop = await createBarbershop(owner.id)
    await createBarberMembership(barber.id, shop.id)
    await createService(shop.id)
    const res = await app.inject({
      method: 'GET',
      url: '/api/services',
      headers: { cookie: barber.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })
})

describe('PATCH /api/services/:id', () => {
  it('updates fields for the owner', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const service = await createService(shop.id)
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/services/${service.id}`,
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
      payload: { price: 49.9, isActive: false },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({ price: 49.9, isActive: false })
  })

  it('returns 404 for a service from another shop', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id, { slug: 'mine-shop' })
    const otherShop = await createBarbershop(owner.id, { slug: 'other-shop' })
    const service = await createService(otherShop.id)
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/services/${service.id}`,
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
      payload: { price: 10 },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /api/services/:id', () => {
  it('deletes a service for the owner (204)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const service = await createService(shop.id)
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/services/${service.id}`,
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(204)
  })
})
