import { prisma } from '@barber/database'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildTestApp } from './helpers/app'
import { createTestUser } from './helpers/auth'
import { createBarbershop } from './helpers/db'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})
afterAll(async () => {
  await app.close()
})

const validBody = {
  name: 'Barbearia do Zé',
  address: 'Rua das Flores, 123',
  phone: '11999999999',
}

describe('POST /api/barbershops', () => {
  it('requires authentication', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/barbershops', payload: validBody })
    expect(res.statusCode).toBe(401)
  })

  it('validates the body (400)', async () => {
    const user = await createTestUser()
    const res = await app.inject({
      method: 'POST',
      url: '/api/barbershops',
      headers: { cookie: user.cookie },
      payload: { name: 'x' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({ statusCode: 400, error: 'Bad Request' })
  })

  it('creates a shop, generates a slug, and promotes CUSTOMER to OWNER', async () => {
    const user = await createTestUser({ role: 'CUSTOMER' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/barbershops',
      headers: { cookie: user.cookie },
      payload: validBody,
    })
    expect(res.statusCode).toBe(201)
    const { data } = res.json()
    expect(data).toMatchObject({ name: validBody.name, slug: 'barbearia-do-ze', ownerId: user.id })

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(updated.role).toBe('OWNER')
  })
})

describe('GET /api/barbershops', () => {
  it('lists owned and barber-member shops only', async () => {
    const user = await createTestUser({ role: 'OWNER' })
    const other = await createTestUser({ role: 'OWNER' })
    await createBarbershop(user.id, { name: 'Mine', slug: 'mine' })
    await createBarbershop(other.id, { name: 'Theirs', slug: 'theirs' })

    const res = await app.inject({
      method: 'GET',
      url: '/api/barbershops',
      headers: { cookie: user.cookie },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({ slug: 'mine' })
  })
})

describe('GET /api/barbershops/:id', () => {
  it('returns 403 for a non-member', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const stranger = await createTestUser()
    const shop = await createBarbershop(owner.id)
    const res = await app.inject({
      method: 'GET',
      url: `/api/barbershops/${shop.id}`,
      headers: { cookie: stranger.cookie },
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns the shop for a member', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const res = await app.inject({
      method: 'GET',
      url: `/api/barbershops/${shop.id}`,
      headers: { cookie: owner.cookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({ id: shop.id })
  })
})

describe('PATCH /api/barbershops/:id', () => {
  it('forbids non-owners (403)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const stranger = await createTestUser()
    const shop = await createBarbershop(owner.id)
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/barbershops/${shop.id}`,
      headers: { cookie: stranger.cookie },
      payload: { name: 'Hacked' },
    })
    expect(res.statusCode).toBe(403)
  })

  it('updates profile fields for the owner', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/barbershops/${shop.id}`,
      headers: { cookie: owner.cookie },
      payload: { name: 'Novo Nome', description: 'Atualizada' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({ name: 'Novo Nome', description: 'Atualizada' })
  })

  it('rejects a slug already taken by another shop (409)', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    await createBarbershop(owner.id, { name: 'A', slug: 'taken-slug' })
    const shop = await createBarbershop(owner.id, { name: 'B', slug: 'b-shop' })
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/barbershops/${shop.id}`,
      headers: { cookie: owner.cookie },
      payload: { slug: 'taken-slug' },
    })
    expect(res.statusCode).toBe(409)
  })
})
