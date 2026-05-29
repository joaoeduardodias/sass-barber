import { prisma } from '@barber/database'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildTestApp } from './helpers/app'
import { createTestUser } from './helpers/auth'
import { createBarberMembership, createBarbershop } from './helpers/db'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})
afterAll(async () => {
  await app.close()
})

describe('POST /api/barbers (invite)', () => {
  it('requires authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/barbers',
      payload: { name: 'Zé', email: 'ze@test.com' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('forbids a barber from inviting (403)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const shop = await createBarbershop(owner.id)
    await createBarberMembership(barber.id, shop.id)
    const res = await app.inject({
      method: 'POST',
      url: '/api/barbers',
      headers: { cookie: barber.cookie, 'x-barbershop-id': shop.id },
      payload: { name: 'Novo', email: 'novo@test.com' },
    })
    expect(res.statusCode).toBe(403)
  })

  it('links an existing user and promotes CUSTOMER to BARBER', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const guest = await createTestUser({ role: 'CUSTOMER', email: 'guest@test.com' })

    const res = await app.inject({
      method: 'POST',
      url: '/api/barbers',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
      payload: { name: 'Ignored', email: 'guest@test.com', bio: 'Especialista em barba' },
    })
    expect(res.statusCode).toBe(201)
    const { data } = res.json()
    expect(data).toMatchObject({
      userId: guest.id,
      barbershopId: shop.id,
      bio: 'Especialista em barba',
      tempPassword: null,
    })
    expect(data.user).toMatchObject({ email: 'guest@test.com' })

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: guest.id } })
    expect(updated.role).toBe('BARBER')
  })

  it('creates a new account with a temp password when the email is unknown', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)

    const res = await app.inject({
      method: 'POST',
      url: '/api/barbers',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
      payload: { name: 'Barbeiro Novo', email: 'fresh@test.com' },
    })
    expect(res.statusCode).toBe(201)
    const { data } = res.json()
    expect(typeof data.tempPassword).toBe('string')
    expect(data.tempPassword.length).toBeGreaterThanOrEqual(8)
    expect(data.user).toMatchObject({ name: 'Barbeiro Novo', email: 'fresh@test.com' })

    const created = await prisma.user.findUniqueOrThrow({ where: { email: 'fresh@test.com' } })
    expect(created.role).toBe('BARBER')
  })

  it('returns 409 when the user is already a barber somewhere', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const otherShop = await createBarbershop(owner.id, { slug: 'other-bs' })
    const barber = await createTestUser({ role: 'BARBER', email: 'dup@test.com' })
    await createBarberMembership(barber.id, otherShop.id)

    const res = await app.inject({
      method: 'POST',
      url: '/api/barbers',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
      payload: { name: 'Dup', email: 'dup@test.com' },
    })
    expect(res.statusCode).toBe(409)
  })
})

describe('GET /api/barbers', () => {
  it('lists barbers of the active barbershop with user info', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const barber = await createTestUser({ role: 'BARBER', email: 'list@test.com', name: 'Listado' })
    await createBarberMembership(barber.id, shop.id)

    const res = await app.inject({
      method: 'GET',
      url: '/api/barbers',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data).toHaveLength(1)
    expect(data[0].user).toMatchObject({ name: 'Listado', email: 'list@test.com' })
  })
})

describe('PATCH /api/barbers/:id', () => {
  it('updates bio and isActive for the owner', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const barber = await createTestUser({ role: 'BARBER', email: 'patch@test.com' })
    const profile = await createBarberMembership(barber.id, shop.id)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/barbers/${profile.id}`,
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
      payload: { bio: 'Atualizada', isActive: false },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({ bio: 'Atualizada', isActive: false })
  })
})

describe('DELETE /api/barbers/:id', () => {
  it('removes the profile and demotes the barber to CUSTOMER (204)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const barber = await createTestUser({ role: 'BARBER', email: 'del@test.com' })
    const profile = await createBarberMembership(barber.id, shop.id)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/barbers/${profile.id}`,
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(204)

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: barber.id } })
    expect(updated.role).toBe('CUSTOMER')
  })
})
