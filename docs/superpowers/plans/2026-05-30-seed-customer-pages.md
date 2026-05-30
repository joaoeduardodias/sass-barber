# Seed Data + Customer Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add realistic seed data and build the customer-facing experience: public barbershop page, multi-step booking flow, and a logged-in customer area (`/minha-conta`).

**Architecture:** Route group `(public)` for unauthenticated pages (`/b/[slug]`, `/b/[slug]/agendar`) with a minimal header layout; route group `(customer)` for the authenticated customer area (`/minha-conta`). New Fastify route files: `public.ts` (no auth) and `appointments.ts` (requireAuth). Booking flow is a multi-step Client Component; the customer area is RSC + a client cancel button. Seed uses `better-auth`'s `api.signUpEmail` directly.

**Tech Stack:** Same as existing — Fastify 5, fastify-type-provider-zod, better-auth, Prisma 7, Next.js 15 App Router, React 19, Tailwind, shadcn/ui (`@barber/ui`), TanStack Query, server actions, vitest.

**Spec:** `docs/superpowers/specs/2026-05-30-seed-customer-pages-design.md`

---

## Conventions used in this plan

- **Biome style:** no semicolons, single quotes, 2-space indent, trailing commas, 100-char width. Pre-commit hook runs `biome check --write` automatically.
- **Envelope:** all domain endpoints return `{ data }`. Errors return `{ error, message, statusCode }`.
- **Test DB:** same `barber_test` Postgres DB from slice 1 — truncated `beforeEach`. Re-run `pnpm db:push` with `DATABASE_URL` pointing to test DB if schema changes.
- **Run from repo root** unless noted. Use `pnpm --filter=@barber/<pkg> <script>` to target a workspace.

---

## File Structure

### New files

| File | Responsibility |
|---|---|
| `src/packages/types/src/schemas/appointment.ts` | `createAppointmentSchema`, `AppointmentWithDetails`, `PublicBarbershop`, `PublicBarber` |
| `src/apps/api/src/lib/slots.ts` | `generateSlots` — testable pure function |
| `src/apps/api/src/routes/public.ts` | Public endpoints (no auth): barbershop info, services, barbers, slots |
| `src/apps/api/src/routes/appointments.ts` | Appointment endpoints: create, list-my, cancel |
| `src/apps/api/tests/slots.test.ts` | Unit tests for `generateSlots` |
| `src/apps/api/tests/public.test.ts` | Integration tests for public routes |
| `src/apps/api/tests/appointments.test.ts` | Integration tests for appointment routes |
| `src/apps/web/src/lib/public/queries.ts` | Server-only `apiFetch` wrappers for public endpoints (RSC use) |
| `src/apps/web/src/app/(public)/layout.tsx` | Minimal public layout (logo + "Entrar" link) |
| `src/apps/web/src/app/(public)/b/[slug]/page.tsx` | Barbershop public page (RSC) |
| `src/apps/web/src/app/(public)/b/[slug]/agendar/page.tsx` | RSC wrapper — fetches initial data, renders `BookingFlow` |
| `src/apps/web/src/app/(public)/b/[slug]/agendar/booking-flow.tsx` | Multi-step booking Client Component |
| `src/apps/web/src/lib/appointments/queries.ts` | Server-only `listMyAppointments` (RSC use) |
| `src/apps/web/src/lib/appointments/actions.ts` | `cancelAppointmentAction` server action |
| `src/apps/web/src/app/(customer)/layout.tsx` | Customer layout — requires auth |
| `src/apps/web/src/app/(customer)/minha-conta/page.tsx` | Appointment list — RSC |
| `src/apps/web/src/app/(customer)/minha-conta/cancel-button.tsx` | Cancel button — Client Component with Dialog confirm |

### Modified files

| File | Change |
|---|---|
| `src/packages/types/src/index.ts` | Re-export appointment schema + new types |
| `src/apps/api/tests/helpers/db.ts` | Add `createAppointment` helper |
| `src/apps/api/src/routes/index.ts` | Register `publicRoutes` + `appointmentRoutes` |
| `src/apps/web/src/middleware.ts` | Allow `/b/` prefix as public path |
| `src/packages/database/package.json` | Add `better-auth` dependency for seed |
| `src/packages/database/prisma/seed.ts` | Full seed implementation |

---

## Task 1: Appointment schema + types in `@barber/types`

**Files:**
- Create: `src/packages/types/src/schemas/appointment.ts`
- Modify: `src/packages/types/src/index.ts`

- [ ] **Step 1: Create `src/packages/types/src/schemas/appointment.ts`**

```ts
import { z } from 'zod'

export const createAppointmentSchema = z.object({
  barbershopId: z.string().min(1),
  serviceId: z.string().min(1),
  barberId: z.string().min(1),
  scheduledAt: z.string().datetime({ message: 'Data inválida' }),
  notes: z.string().max(500).optional(),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

export interface PublicBarbershop {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  phone: string
  logoUrl: string | null
}

export interface PublicBarber {
  id: string
  bio: string | null
  avatarUrl: string | null
  user: { name: string }
}

export interface AppointmentWithDetails {
  id: string
  customerId: string
  barberId: string
  serviceId: string
  barbershopId: string
  scheduledAt: string
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes: string | null
  createdAt: string
  updatedAt: string
  service: { id: string; name: string; duration: number; price: number }
  barber: { id: string; user: { name: string } }
  barbershop: { id: string; name: string }
}
```

- [ ] **Step 2: Add re-export to `src/packages/types/src/index.ts`**

Append after the last `export *` line:

```ts
export * from './schemas/appointment'
```

- [ ] **Step 3: Verify types build**

```bash
pnpm --filter=@barber/types build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/packages/types/src/schemas/appointment.ts src/packages/types/src/index.ts
git commit -m "feat(types): add appointment schema and public/customer types"
```

---

## Task 2: `generateSlots` utility + unit tests (TDD)

**Files:**
- Create: `src/apps/api/tests/slots.test.ts`
- Create: `src/apps/api/src/lib/slots.ts`

- [ ] **Step 1: Write the failing test**

Create `src/apps/api/tests/slots.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { generateSlots } from '../src/lib/slots'

const DATE = '2026-06-01'

describe('generateSlots', () => {
  it('generates 9 slots from 09:00 to 17:00 with 60-min duration', () => {
    const slots = generateSlots(DATE, 60, [])
    expect(slots).toHaveLength(9)
    expect(slots[0]).toBe('09:00')
    expect(slots[8]).toBe('17:00')
  })

  it('generates 18 slots with 30-min duration', () => {
    const slots = generateSlots(DATE, 30, [])
    expect(slots).toHaveLength(18)
    expect(slots[0]).toBe('09:00')
    expect(slots[1]).toBe('09:30')
  })

  it('generates 12 slots with 45-min duration', () => {
    const slots = generateSlots(DATE, 45, [])
    expect(slots).toHaveLength(12)
    expect(slots[1]).toBe('09:45')
  })

  it('excludes a booked slot', () => {
    const booked = [new Date(Date.UTC(2026, 5, 1, 9, 0))]
    const slots = generateSlots(DATE, 60, booked)
    expect(slots).not.toContain('09:00')
    expect(slots).toContain('10:00')
    expect(slots).toHaveLength(8)
  })

  it('returns all slots when no appointments', () => {
    const slots = generateSlots(DATE, 45, [])
    expect(slots[0]).toBe('09:00')
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```bash
pnpm --filter=@barber/api test tests/slots.test.ts
```

Expected: FAIL — `generateSlots` is not defined.

- [ ] **Step 3: Implement `src/apps/api/src/lib/slots.ts`**

```ts
/**
 * Generates available HH:mm time slots for a barber on a given date (UTC).
 * Slots run 09:00–17:xx based on duration, stopping before 18:00.
 */
export function generateSlots(
  date: string,
  durationMinutes: number,
  bookedAt: Date[],
): string[] {
  const [year, month, day] = date.split('-').map(Number)
  const slots: string[] = []

  for (let totalMinutes = 9 * 60; totalMinutes < 18 * 60; totalMinutes += durationMinutes) {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    const slotMs = Date.UTC(year, month - 1, day, h, m)
    const isBooked = bookedAt.some((b) => Math.abs(b.getTime() - slotMs) < 60_000)
    if (!isBooked) slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  return slots
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm --filter=@barber/api test tests/slots.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/apps/api/src/lib/slots.ts src/apps/api/tests/slots.test.ts
git commit -m "feat(api): add generateSlots utility with unit tests"
```

---

## Task 3: Add `createAppointment` test helper

**Files:**
- Modify: `src/apps/api/tests/helpers/db.ts`

- [ ] **Step 1: Append `createAppointment` to `tests/helpers/db.ts`**

```ts
export function createAppointment(data: {
  customerId: string
  barberId: string
  serviceId: string
  barbershopId: string
  scheduledAt?: Date
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
}) {
  return prisma.appointment.create({
    data: {
      customerId: data.customerId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      barbershopId: data.barbershopId,
      scheduledAt: data.scheduledAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: data.status ?? 'PENDING',
    },
  })
}
```

- [ ] **Step 2: Verify existing tests still pass**

```bash
pnpm --filter=@barber/api test
```

Expected: all existing tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/apps/api/tests/helpers/db.ts
git commit -m "test(api): add createAppointment test helper"
```

---

## Task 4: Public API routes (TDD)

**Files:**
- Create: `src/apps/api/tests/public.test.ts`
- Create: `src/apps/api/src/routes/public.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/apps/api/tests/public.test.ts`:

```ts
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildTestApp } from './helpers/app'
import { createTestUser } from './helpers/auth'
import { createAppointment, createBarberMembership, createBarbershop, createService } from './helpers/db'

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
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
pnpm --filter=@barber/api test tests/public.test.ts
```

Expected: FAIL — routes not registered yet.

- [ ] **Step 3: Implement `src/apps/api/src/routes/public.ts`**

```ts
import { prisma } from '@barber/database'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ApiError } from '../lib/errors'
import { generateSlots } from '../lib/slots'

const slugParams = z.object({ slug: z.string() })
const slotsQuery = z.object({
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
})

export const publicRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/public/barbershops/:slug',
    { schema: { params: slugParams } },
    async (request) => {
      const shop = await prisma.barbershop.findUnique({
        where: { slug: request.params.slug, isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          address: true,
          phone: true,
          logoUrl: true,
        },
      })
      if (!shop) throw new ApiError(404, 'Not Found', 'Barbearia não encontrada')
      return { data: shop }
    },
  )

  app.get(
    '/public/barbershops/:slug/services',
    { schema: { params: slugParams } },
    async (request) => {
      const shop = await prisma.barbershop.findUnique({
        where: { slug: request.params.slug, isActive: true },
        select: { id: true },
      })
      if (!shop) throw new ApiError(404, 'Not Found', 'Barbearia não encontrada')

      const services = await prisma.service.findMany({
        where: { barbershopId: shop.id, isActive: true },
        select: { id: true, name: true, description: true, price: true, duration: true },
        orderBy: { createdAt: 'asc' },
      })
      return { data: services.map((s) => ({ ...s, price: Number(s.price) })) }
    },
  )

  app.get(
    '/public/barbershops/:slug/barbers',
    { schema: { params: slugParams } },
    async (request) => {
      const shop = await prisma.barbershop.findUnique({
        where: { slug: request.params.slug, isActive: true },
        select: { id: true },
      })
      if (!shop) throw new ApiError(404, 'Not Found', 'Barbearia não encontrada')

      const barbers = await prisma.barberProfile.findMany({
        where: { barbershopId: shop.id, isActive: true },
        select: {
          id: true,
          bio: true,
          avatarUrl: true,
          user: { select: { name: true } },
        },
      })
      return { data: barbers }
    },
  )

  app.get(
    '/public/barbershops/:slug/slots',
    { schema: { params: slugParams, querystring: slotsQuery } },
    async (request) => {
      const { barberId, serviceId, date } = request.query

      const shop = await prisma.barbershop.findUnique({
        where: { slug: request.params.slug, isActive: true },
        select: { id: true },
      })
      if (!shop) throw new ApiError(404, 'Not Found', 'Barbearia não encontrada')

      const service = await prisma.service.findFirst({
        where: { id: serviceId, barbershopId: shop.id, isActive: true },
        select: { duration: true },
      })
      if (!service) throw new ApiError(404, 'Not Found', 'Serviço não encontrado')

      const [year, month, day] = date.split('-').map(Number)
      const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
      const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59))

      const booked = await prisma.appointment.findMany({
        where: {
          barberId,
          barbershopId: shop.id,
          scheduledAt: { gte: dayStart, lte: dayEnd },
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        },
        select: { scheduledAt: true },
      })

      const slots = generateSlots(
        date,
        service.duration,
        booked.map((a) => a.scheduledAt),
      )
      return { data: slots }
    },
  )
}
```

- [ ] **Step 4: Register the route temporarily to run tests** (full registration is Task 6)

Open `src/apps/api/src/routes/index.ts` and add **both** imports and registrations:

```ts
import type { FastifyInstance } from 'fastify'
import { barberRoutes } from './barbers'
import { barbershopRoutes } from './barbershops'
import { healthRoute } from './health'
import { publicRoutes } from './public'
import { serviceRoutes } from './services'

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoute, { prefix: '/api' })
  await app.register(barbershopRoutes, { prefix: '/api' })
  await app.register(serviceRoutes, { prefix: '/api' })
  await app.register(barberRoutes, { prefix: '/api' })
  await app.register(publicRoutes, { prefix: '/api' })
}
```

- [ ] **Step 5: Run public tests to confirm they pass**

```bash
pnpm --filter=@barber/api test tests/public.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 6: Run full test suite to confirm no regressions**

```bash
pnpm --filter=@barber/api test
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/apps/api/src/routes/public.ts src/apps/api/src/routes/index.ts src/apps/api/tests/public.test.ts
git commit -m "feat(api): add public barbershop routes (no auth)"
```

---

## Task 5: Appointment API routes (TDD)

**Files:**
- Create: `src/apps/api/tests/appointments.test.ts`
- Create: `src/apps/api/src/routes/appointments.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/apps/api/tests/appointments.test.ts`:

```ts
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

  it('returns only the authenticated user\'s appointments', async () => {
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
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
pnpm --filter=@barber/api test tests/appointments.test.ts
```

Expected: FAIL — routes not registered yet.

- [ ] **Step 3: Implement `src/apps/api/src/routes/appointments.ts`**

```ts
import { prisma } from '@barber/database'
import { createAppointmentSchema } from '@barber/types'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ApiError } from '../lib/errors'

const idParams = z.object({ id: z.string() })

export const appointmentRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/appointments',
    { preHandler: [app.requireAuth], schema: { body: createAppointmentSchema } },
    async (request, reply) => {
      const { barbershopId, serviceId, barberId, scheduledAt, notes } = request.body

      const shop = await prisma.barbershop.findUnique({
        where: { id: barbershopId },
        select: { id: true },
      })
      if (!shop) throw new ApiError(404, 'Not Found', 'Barbearia não encontrada')

      const service = await prisma.service.findFirst({
        where: { id: serviceId, barbershopId, isActive: true },
        select: { id: true },
      })
      if (!service) throw new ApiError(404, 'Not Found', 'Serviço não encontrado')

      const barber = await prisma.barberProfile.findFirst({
        where: { id: barberId, barbershopId, isActive: true },
        select: { id: true },
      })
      if (!barber) throw new ApiError(404, 'Not Found', 'Barbeiro não encontrado')

      const scheduledDate = new Date(scheduledAt)
      const conflict = await prisma.appointment.findFirst({
        where: {
          barberId,
          scheduledAt: scheduledDate,
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        },
        select: { id: true },
      })
      if (conflict) throw new ApiError(409, 'Conflict', 'Horário já reservado')

      const appointment = await prisma.appointment.create({
        data: {
          customerId: request.user.id,
          barberId,
          serviceId,
          barbershopId,
          scheduledAt: scheduledDate,
          notes,
        },
        include: {
          service: { select: { id: true, name: true, duration: true, price: true } },
          barber: { select: { id: true, user: { select: { name: true } } } },
          barbershop: { select: { id: true, name: true } },
        },
      })

      return reply.status(201).send({
        data: {
          ...appointment,
          scheduledAt: appointment.scheduledAt.toISOString(),
          createdAt: appointment.createdAt.toISOString(),
          updatedAt: appointment.updatedAt.toISOString(),
          service: { ...appointment.service, price: Number(appointment.service.price) },
        },
      })
    },
  )

  app.get(
    '/appointments/my',
    { preHandler: [app.requireAuth] },
    async (request) => {
      const appointments = await prisma.appointment.findMany({
        where: { customerId: request.user.id },
        include: {
          service: { select: { id: true, name: true, duration: true, price: true } },
          barber: { select: { id: true, user: { select: { name: true } } } },
          barbershop: { select: { id: true, name: true } },
        },
        orderBy: { scheduledAt: 'desc' },
      })

      return {
        data: appointments.map((a) => ({
          ...a,
          scheduledAt: a.scheduledAt.toISOString(),
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
          service: { ...a.service, price: Number(a.service.price) },
        })),
      }
    },
  )

  app.patch(
    '/appointments/:id/cancel',
    { preHandler: [app.requireAuth], schema: { params: idParams } },
    async (request) => {
      const appointment = await prisma.appointment.findUnique({
        where: { id: request.params.id },
        select: { id: true, customerId: true, status: true },
      })
      if (!appointment) throw new ApiError(404, 'Not Found', 'Agendamento não encontrado')
      if (appointment.customerId !== request.user.id) {
        throw new ApiError(403, 'Forbidden', 'Não autorizado')
      }
      if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
        throw new ApiError(422, 'Unprocessable', 'Agendamento não pode ser cancelado')
      }

      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CANCELLED' },
        include: {
          service: { select: { id: true, name: true, duration: true, price: true } },
          barber: { select: { id: true, user: { select: { name: true } } } },
          barbershop: { select: { id: true, name: true } },
        },
      })

      return {
        data: {
          ...updated,
          scheduledAt: updated.scheduledAt.toISOString(),
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
          service: { ...updated.service, price: Number(updated.service.price) },
        },
      }
    },
  )
}
```

- [ ] **Step 4: Register `appointmentRoutes` in `src/apps/api/src/routes/index.ts`**

```ts
import type { FastifyInstance } from 'fastify'
import { appointmentRoutes } from './appointments'
import { barberRoutes } from './barbers'
import { barbershopRoutes } from './barbershops'
import { healthRoute } from './health'
import { publicRoutes } from './public'
import { serviceRoutes } from './services'

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoute, { prefix: '/api' })
  await app.register(barbershopRoutes, { prefix: '/api' })
  await app.register(serviceRoutes, { prefix: '/api' })
  await app.register(barberRoutes, { prefix: '/api' })
  await app.register(publicRoutes, { prefix: '/api' })
  await app.register(appointmentRoutes, { prefix: '/api' })
}
```

- [ ] **Step 5: Run appointment tests to confirm they pass**

```bash
pnpm --filter=@barber/api test tests/appointments.test.ts
```

Expected: all 7 tests PASS.

- [ ] **Step 6: Run full test suite**

```bash
pnpm --filter=@barber/api test
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/apps/api/src/routes/appointments.ts src/apps/api/tests/appointments.test.ts
git commit -m "feat(api): add appointment routes (create, list-my, cancel)"
```

---

## Task 6: Update Next.js middleware for public routes

**Files:**
- Modify: `src/apps/web/src/middleware.ts`

- [ ] **Step 1: Update `middleware.ts` to allow `/b/` prefix**

Replace the current file with:

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register']
const PUBLIC_PREFIXES = ['/b/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie =
    request.cookies.get('better-auth.session_token') ??
    request.cookies.get('__Secure-better-auth.session_token')

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isAuthenticated = Boolean(sessionCookie?.value)

  if (!isPublic && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: Verify existing web tests still pass**

```bash
pnpm --filter=@barber/web test
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/apps/web/src/middleware.ts
git commit -m "feat(web): allow /b/ prefix as public path in middleware"
```

---

## Task 7: Seed data

**Files:**
- Modify: `src/packages/database/package.json`
- Modify: `src/packages/database/prisma/seed.ts`

- [ ] **Step 1: Add `better-auth` to database package dependencies**

In `src/packages/database/package.json`, add to `"dependencies"`:

```json
"better-auth": "*"
```

Then run:

```bash
pnpm install
```

Expected: `better-auth` linked in `@barber/database`.

- [ ] **Step 2: Write the complete seed**

Replace `src/packages/database/prisma/seed.ts` with:

```ts
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
})

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET ?? 'seed-secret-key-minimum-32-characters',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
  emailAndPassword: { enabled: true },
})

async function createUser(
  name: string,
  email: string,
  role: 'OWNER' | 'BARBER' | 'CUSTOMER',
) {
  const result = await auth.api.signUpEmail({ body: { name, email, password: 'password123' } })
  if (result.user.role !== role) {
    await prisma.user.update({ where: { id: result.user.id }, data: { role } })
  }
  return result.user
}

async function main() {
  console.info('Limpando banco...')
  await prisma.appointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.barberProfile.deleteMany()
  await prisma.barbershop.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verification.deleteMany()
  await prisma.user.deleteMany()

  console.info('Criando usuários...')
  const owner = await createUser('Dono da Barbearia', 'dono@barbearia.com', 'OWNER')
  const joao = await createUser('João Silva', 'joao@barber.com', 'BARBER')
  const pedro = await createUser('Pedro Costa', 'pedro@barber.com', 'BARBER')
  const cliente = await createUser('Carlos Cliente', 'cliente@example.com', 'CUSTOMER')

  console.info('Criando barbearia...')
  const shop = await prisma.barbershop.create({
    data: {
      name: 'Barbearia Vintage',
      slug: 'barbearia-vintage',
      description:
        'Tradição e estilo desde 2010. Cortes clássicos e modernos para homens que se cuidam.',
      address: 'Rua Augusta, 1200 — São Paulo, SP',
      phone: '(11) 91234-5678',
      ownerId: owner.id,
    },
  })

  console.info('Criando perfis de barbeiro...')
  const joaoProfile = await prisma.barberProfile.create({
    data: {
      userId: joao.id,
      barbershopId: shop.id,
      bio: 'Especialista em degradê e barba',
    },
  })
  const pedroProfile = await prisma.barberProfile.create({
    data: {
      userId: pedro.id,
      barbershopId: shop.id,
      bio: 'Expert em cortes clássicos e platinado',
    },
  })

  console.info('Criando serviços...')
  const [corteSimples, degrade, corteBarbaSvc, barbaSvc, , sobrancelha] =
    await Promise.all([
      prisma.service.create({
        data: { name: 'Corte simples', price: 35, duration: 30, barbershopId: shop.id },
      }),
      prisma.service.create({
        data: { name: 'Degradê', price: 50, duration: 45, barbershopId: shop.id },
      }),
      prisma.service.create({
        data: { name: 'Corte + Barba', price: 60, duration: 60, barbershopId: shop.id },
      }),
      prisma.service.create({
        data: { name: 'Barba', price: 30, duration: 30, barbershopId: shop.id },
      }),
      prisma.service.create({
        data: { name: 'Corte infantil', price: 30, duration: 30, barbershopId: shop.id },
      }),
      prisma.service.create({
        data: { name: 'Sobrancelha', price: 15, duration: 15, barbershopId: shop.id },
      }),
      prisma.service.create({
        data: { name: 'Platinado', price: 150, duration: 120, barbershopId: shop.id },
      }),
    ])

  console.info('Criando agendamentos...')
  const now = new Date()
  const utcDate = (offsetDays: number, hour = 10) =>
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + offsetDays,
        hour,
        0,
      ),
    )

  await prisma.appointment.createMany({
    data: [
      {
        customerId: cliente.id,
        barberId: joaoProfile.id,
        serviceId: corteSimples.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(-30),
        status: 'COMPLETED',
      },
      {
        customerId: cliente.id,
        barberId: pedroProfile.id,
        serviceId: barbaSvc.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(-15),
        status: 'COMPLETED',
      },
      {
        customerId: cliente.id,
        barberId: joaoProfile.id,
        serviceId: degrade.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(-7),
        status: 'COMPLETED',
      },
      {
        customerId: cliente.id,
        barberId: pedroProfile.id,
        serviceId: corteBarbaSvc.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(1),
        status: 'PENDING',
      },
      {
        customerId: cliente.id,
        barberId: joaoProfile.id,
        serviceId: corteSimples.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(7, 14),
        status: 'CONFIRMED',
      },
      {
        customerId: cliente.id,
        barberId: pedroProfile.id,
        serviceId: barbaSvc.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(9, 11),
        status: 'CONFIRMED',
      },
      {
        customerId: cliente.id,
        barberId: joaoProfile.id,
        serviceId: sobrancelha.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(-20),
        status: 'CANCELLED',
      },
    ],
  })

  console.info(`
✓ Seed completo!

Usuários:
  dono@barbearia.com / password123  (OWNER)
  joao@barber.com   / password123  (BARBER)
  pedro@barber.com  / password123  (BARBER)
  cliente@example.com / password123 (CUSTOMER)

Barbearia: Barbearia Vintage  (slug: barbearia-vintage)
Página pública: http://localhost:3000/b/barbearia-vintage
Área do cliente: http://localhost:3000/minha-conta
  `)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 3: Run the seed**

```bash
pnpm db:seed
```

Expected: output with `✓ Seed completo!` and the user list printed.

- [ ] **Step 4: Commit**

```bash
git add src/packages/database/package.json src/packages/database/prisma/seed.ts pnpm-lock.yaml
git commit -m "feat(database): add realistic seed data with customer user and appointments"
```

---

## Task 8: Public layout + barbershop public page

**Files:**
- Create: `src/apps/web/src/lib/public/queries.ts`
- Create: `src/apps/web/src/app/(public)/layout.tsx`
- Create: `src/apps/web/src/app/(public)/b/[slug]/page.tsx`

- [ ] **Step 1: Create `src/apps/web/src/lib/public/queries.ts`**

```ts
import 'server-only'
import { apiFetch } from '@/lib/api/server'
import type { PublicBarbershop, PublicBarber, Service } from '@barber/types'

export function getPublicBarbershop(slug: string) {
  return apiFetch<PublicBarbershop>(`/public/barbershops/${slug}`)
}

export function listPublicServices(slug: string) {
  return apiFetch<Service[]>(`/public/barbershops/${slug}/services`)
}

export function listPublicBarbers(slug: string) {
  return apiFetch<PublicBarber[]>(`/public/barbershops/${slug}/barbers`)
}
```

- [ ] **Step 2: Create `src/apps/web/src/app/(public)/layout.tsx`**

```tsx
import { Scissors } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/80 px-6 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-600">
            <Scissors className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">BarberSaaS</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            Cadastrar
          </Link>
        </nav>
      </header>
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/apps/web/src/app/(public)/b/[slug]/page.tsx`**

```tsx
import { listPublicBarbers, listPublicServices, getPublicBarbershop } from '@/lib/public/queries'
import { Button } from '@barber/ui'
import { Clock, MapPin, Phone, Scissors } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function BarbershopPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [barbershop, services, barbers] = await Promise.all([
    getPublicBarbershop(slug).catch(() => null),
    listPublicServices(slug).catch(() => []),
    listPublicBarbers(slug).catch(() => []),
  ])

  if (!barbershop) notFound()

  return (
    <main>
      {/* Hero */}
      <section className="border-b bg-muted/30 px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-600">
            <Scissors className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{barbershop.name}</h1>
          {barbershop.description && (
            <p className="mt-3 text-muted-foreground">{barbershop.description}</p>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {barbershop.address}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {barbershop.phone}
            </span>
          </div>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700">
              <Link href={`/b/${slug}/agendar`}>Agendar agora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="mb-8 text-lg font-semibold">Nossos serviços</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.id} className="rounded-lg border bg-card p-4">
              <p className="font-medium">{s.name}</p>
              {s.description && (
                <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {s.duration} min
                </span>
                <span className="font-semibold text-amber-600">
                  R${Number(s.price).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Barbers */}
      {barbers.length > 0 && (
        <section className="border-t bg-muted/30 px-6 py-14">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-lg font-semibold">Nossa equipe</h2>
            <div className="flex flex-wrap gap-4">
              {barbers.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border bg-card p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                    {b.user.name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{b.user.name}</p>
                    {b.bio && <p className="text-xs text-muted-foreground">{b.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <p className="mb-4 text-muted-foreground">Pronto para marcar seu horário?</p>
        <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700">
          <Link href={`/b/${slug}/agendar`}>Agendar agora</Link>
        </Button>
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Start the dev server and open `http://localhost:3000/b/barbearia-vintage`**

```bash
pnpm dev
```

Expected: barbershop page renders with name "Barbearia Vintage," services grid, and team section.

- [ ] **Step 5: Commit**

```bash
git add src/apps/web/src/lib/public/queries.ts \
        src/apps/web/src/app/\(public\)/layout.tsx \
        src/apps/web/src/app/\(public\)/b/\[slug\]/page.tsx
git commit -m "feat(web): add public barbershop page at /b/[slug]"
```

---

## Task 9: Booking flow (multi-step client component)

**Files:**
- Create: `src/apps/web/src/app/(public)/b/[slug]/agendar/page.tsx`
- Create: `src/apps/web/src/app/(public)/b/[slug]/agendar/booking-flow.tsx`

- [ ] **Step 1: Create the RSC wrapper `agendar/page.tsx`**

```tsx
import { listPublicBarbers, listPublicServices, getPublicBarbershop } from '@/lib/public/queries'
import { notFound } from 'next/navigation'
import { BookingFlow } from './booking-flow'

export default async function AgendarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [barbershop, services, barbers] = await Promise.all([
    getPublicBarbershop(slug).catch(() => null),
    listPublicServices(slug).catch(() => []),
    listPublicBarbers(slug).catch(() => []),
  ])

  if (!barbershop) notFound()

  return <BookingFlow barbershop={barbershop} services={services} barbers={barbers} />
}
```

- [ ] **Step 2: Create `agendar/booking-flow.tsx`**

```tsx
'use client'

import { apiClient } from '@/lib/api/client'
import { authClient } from '@/lib/auth-client'
import type { PublicBarbershop, PublicBarber, Service } from '@barber/types'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@barber/ui'
import { CheckCircle, ChevronLeft, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

type Step = 'service' | 'barber-slot' | 'confirm' | 'success'

interface Selected {
  service?: Service
  barber?: PublicBarber
  date?: string
  slot?: string
}

function formatDate(d: string) {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function nextDays(n: number): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = 1; i <= n; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export function BookingFlow({
  barbershop,
  services,
  barbers,
}: {
  barbershop: PublicBarbershop
  services: Service[]
  barbers: PublicBarber[]
}) {
  const { data: session } = authClient.useSession()
  const [step, setStep] = useState<Step>('service')
  const [selected, setSelected] = useState<Selected>({})
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authError, setAuthError] = useState('')
  const [booking, startBooking] = useTransition()

  async function fetchSlots(barberId: string, date: string) {
    if (!selected.service) return
    setLoadingSlots(true)
    setSlots([])
    try {
      const data = await apiClient<string[]>(
        `/public/barbershops/${barbershop.slug}/slots?barberId=${barberId}&serviceId=${selected.service.id}&date=${date}`,
      )
      setSlots(data)
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  function selectBarber(barber: PublicBarber) {
    setSelected((s) => ({ ...s, barber, slot: undefined }))
    setSlots([])
    if (selected.date) fetchSlots(barber.id, selected.date)
  }

  function selectDate(date: string) {
    setSelected((s) => ({ ...s, date, slot: undefined }))
    setSlots([])
    if (selected.barber) fetchSlots(selected.barber.id, date)
  }

  async function handleAuth() {
    setAuthError('')
    if (authTab === 'login') {
      const { error } = await authClient.signIn.email({
        email: authEmail,
        password: authPassword,
      })
      if (error) {
        setAuthError(error.message ?? 'Credenciais inválidas')
        return
      }
    } else {
      const { error } = await authClient.signUp.email({
        name: authName,
        email: authEmail,
        password: authPassword,
      })
      if (error) {
        setAuthError(error.message ?? 'Erro no cadastro')
        return
      }
    }
    // Session will update via authClient.useSession(); submit booking
    submitBooking()
  }

  function submitBooking() {
    if (!selected.service || !selected.barber || !selected.date || !selected.slot) return
    const scheduledAt = `${selected.date}T${selected.slot}:00.000Z`
    startBooking(async () => {
      await apiClient('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          barbershopId: barbershop.id,
          serviceId: selected.service!.id,
          barberId: selected.barber!.id,
          scheduledAt,
        }),
      })
      setStep('success')
    })
  }

  // ── Step: success ──────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <div>
          <h2 className="text-xl font-semibold">Agendamento confirmado!</h2>
          <p className="mt-1 text-muted-foreground">
            {selected.service?.name} com {selected.barber?.user.name} em{' '}
            {selected.date && formatDate(selected.date)} às {selected.slot}
          </p>
        </div>
        <Button asChild className="bg-amber-600 hover:bg-amber-700">
          <Link href="/minha-conta">Ver meus agendamentos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      {/* Back link */}
      <Link
        href={`/b/${barbershop.slug}`}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {barbershop.name}
      </Link>

      {/* ── Step 1: Select service ── */}
      {step === 'service' && (
        <div>
          <h2 className="mb-6 text-lg font-semibold">Escolha um serviço</h2>
          <div className="flex flex-col gap-3">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelected({ service: s })
                  setStep('barber-slot')
                }}
                className="flex items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {s.duration} min
                  </p>
                </div>
                <span className="font-semibold text-amber-600">
                  R${Number(s.price).toFixed(2).replace('.', ',')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Select barber, date, slot ── */}
      {step === 'barber-slot' && (
        <div className="flex flex-col gap-8">
          <div>
            <button
              type="button"
              onClick={() => setStep('service')}
              className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
            <h2 className="mb-4 text-lg font-semibold">Escolha o barbeiro</h2>
            <div className="flex flex-wrap gap-3">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => selectBarber(b)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors hover:border-amber-400 ${
                    selected.barber?.id === b.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950'
                      : 'bg-card'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                    {b.user.name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{b.user.name}</p>
                    {b.bio && <p className="text-xs text-muted-foreground">{b.bio}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">Escolha a data</h2>
            <div className="flex flex-wrap gap-2">
              {nextDays(14).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => selectDate(d)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors hover:border-amber-400 ${
                    selected.date === d
                      ? 'border-amber-500 bg-amber-50 font-medium text-amber-700 dark:bg-amber-950'
                      : 'bg-card'
                  }`}
                >
                  {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </button>
              ))}
            </div>
          </div>

          {(loadingSlots || slots.length > 0) && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">Escolha o horário</h2>
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando disponibilidade...
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelected((s) => ({ ...s, slot }))}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:border-amber-400 ${
                        selected.slot === slot
                          ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950'
                          : 'bg-card'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selected.barber && selected.date && selected.slot && (
            <Button
              onClick={() => setStep('confirm')}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Continuar
            </Button>
          )}
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 'confirm' && (
        <div>
          <button
            type="button"
            onClick={() => setStep('barber-slot')}
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>
          <h2 className="mb-6 text-lg font-semibold">Confirmar agendamento</h2>

          {/* Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviço</span>
                <span className="font-medium">{selected.service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Barbeiro</span>
                <span className="font-medium">{selected.barber?.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium">
                  {selected.date && formatDate(selected.date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horário</span>
                <span className="font-medium">{selected.slot}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Total</span>
                <span className="font-semibold text-amber-600">
                  R$
                  {Number(selected.service?.price ?? 0)
                    .toFixed(2)
                    .replace('.', ',')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Auth or confirm */}
          {session ? (
            <Button
              onClick={submitBooking}
              disabled={booking}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {booking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar agendamento'
              )}
            </Button>
          ) : (
            <div className="rounded-lg border p-5">
              <p className="mb-4 text-sm text-muted-foreground">
                Faça login ou crie uma conta para confirmar seu agendamento.
              </p>
              {/* Tab toggle */}
              <div className="mb-4 flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setAuthTab('login')}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    authTab === 'login' ? 'bg-background shadow' : 'text-muted-foreground'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('register')}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    authTab === 'register' ? 'bg-background shadow' : 'text-muted-foreground'
                  }`}
                >
                  Cadastrar
                </button>
              </div>

              <div className="space-y-3">
                {authTab === 'register' && (
                  <Input
                    placeholder="Seu nome"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                )}
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Senha"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
                {authError && <p className="text-xs text-destructive">{authError}</p>}
                <Button onClick={handleAuth} className="w-full bg-amber-600 hover:bg-amber-700">
                  {authTab === 'login' ? 'Entrar e confirmar' : 'Cadastrar e confirmar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Open `http://localhost:3000/b/barbearia-vintage/agendar` and walk through the 3-step flow**

Expected:
- Step 1: service cards render with price/duration.
- Step 2: barber cards appear, date buttons appear, slots load after selecting barber + date.
- Step 3: summary card shows; if not logged in, auth form appears with tab toggle.
- After login/register: booking submits and success state shows.

- [ ] **Step 4: Commit**

```bash
git add src/apps/web/src/app/\(public\)/b/\[slug\]/agendar/page.tsx \
        src/apps/web/src/app/\(public\)/b/\[slug\]/agendar/booking-flow.tsx
git commit -m "feat(web): add multi-step booking flow at /b/[slug]/agendar"
```

---

## Task 10: Appointment queries/actions + customer layout + minha-conta page

**Files:**
- Create: `src/apps/web/src/lib/appointments/queries.ts`
- Create: `src/apps/web/src/lib/appointments/actions.ts`
- Create: `src/apps/web/src/app/(customer)/layout.tsx`
- Create: `src/apps/web/src/app/(customer)/minha-conta/page.tsx`
- Create: `src/apps/web/src/app/(customer)/minha-conta/cancel-button.tsx`

- [ ] **Step 1: Create `src/apps/web/src/lib/appointments/queries.ts`**

```ts
import 'server-only'
import { apiFetch } from '@/lib/api/server'
import type { AppointmentWithDetails } from '@barber/types'

export function listMyAppointments() {
  return apiFetch<AppointmentWithDetails[]>('/appointments/my')
}
```

- [ ] **Step 2: Create `src/apps/web/src/lib/appointments/actions.ts`**

```ts
'use server'

import { apiFetch } from '@/lib/api/server'
import { revalidatePath } from 'next/cache'

export async function cancelAppointmentAction(id: string): Promise<void> {
  await apiFetch(`/appointments/${id}/cancel`, { method: 'PATCH' })
  revalidatePath('/minha-conta')
}
```

- [ ] **Step 3: Create `src/apps/web/src/app/(customer)/layout.tsx`**

```tsx
import { getServerSession } from '@/lib/session'
import { Scissors } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/login?callbackUrl=/minha-conta')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/80 px-6 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-600">
            <Scissors className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">BarberSaaS</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{session.user.name}</span>
          <form
            action={async () => {
              'use server'
              const { cookies } = await import('next/headers')
              const jar = await cookies()
              jar.delete('better-auth.session_token')
              jar.delete('__Secure-better-auth.session_token')
              redirect('/login')
            }}
          >
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/apps/web/src/app/(customer)/minha-conta/cancel-button.tsx`**

```tsx
'use client'

import { cancelAppointmentAction } from '@/lib/appointments/actions'
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@barber/ui'
import { useState, useTransition } from 'react'

export function CancelButton({ appointmentId }: { appointmentId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleCancel() {
    startTransition(async () => {
      await cancelAppointmentAction(appointmentId)
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar agendamento?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Esta ação não pode ser desfeita.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Manter
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={pending}>
            {pending ? 'Cancelando...' : 'Sim, cancelar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 5: Create `src/apps/web/src/app/(customer)/minha-conta/page.tsx`**

```tsx
import { listMyAppointments } from '@/lib/appointments/queries'
import { Calendar, Clock, Scissors } from 'lucide-react'
import { CancelButton } from './cancel-button'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-zinc-100 text-zinc-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-orange-100 text-orange-700',
}

function AppointmentCard({
  appointment,
  showCancel,
}: {
  appointment: Awaited<ReturnType<typeof listMyAppointments>>[number]
  showCancel: boolean
}) {
  const date = new Date(appointment.scheduledAt)
  return (
    <div className="flex items-start justify-between rounded-lg border bg-card p-4">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Scissors className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <p className="font-medium">{appointment.service.name}</p>
          <p className="text-sm text-muted-foreground">com {appointment.barber.user.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {date.toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[appointment.status] ?? 'bg-zinc-100 text-zinc-700'}`}
            >
              {STATUS_LABELS[appointment.status] ?? appointment.status}
            </span>
          </div>
        </div>
      </div>
      {showCancel && <CancelButton appointmentId={appointment.id} />}
    </div>
  )
}

export const metadata = { title: 'Meus Agendamentos' }

export default async function MinhaContaPage() {
  const appointments = await listMyAppointments()

  const upcoming = appointments.filter((a) =>
    ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status),
  )
  const history = appointments.filter((a) =>
    ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status),
  )

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-xl font-semibold">Meus Agendamentos</h1>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Próximos
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            Nenhum agendamento próximo.{' '}
            <a href="/" className="text-amber-600 underline">
              Agendar agora
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((a) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                showCancel={['PENDING', 'CONFIRMED'].includes(a.status)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Histórico
        </h2>
        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            Nenhum histórico ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((a) => (
              <AppointmentCard key={a.id} appointment={a} showCancel={false} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
```

- [ ] **Step 6: Open `http://localhost:3000/minha-conta` logged in as `cliente@example.com`**

Expected:
- Header shows client's name + "Sair" button.
- "Próximos" section: 3 cards (1 PENDING + 2 CONFIRMED) with amber status badges and "Cancelar" button.
- "Histórico" section: 4 cards (3 COMPLETED + 1 CANCELLED) without cancel button.
- Click "Cancelar" on PENDING card → dialog opens → confirm → card moves/disappears on revalidation.

- [ ] **Step 7: Commit**

```bash
git add src/apps/web/src/lib/appointments/queries.ts \
        src/apps/web/src/lib/appointments/actions.ts \
        src/apps/web/src/app/\(customer\)/layout.tsx \
        src/apps/web/src/app/\(customer\)/minha-conta/page.tsx \
        src/apps/web/src/app/\(customer\)/minha-conta/cancel-button.tsx
git commit -m "feat(web): add customer area at /minha-conta with appointment list and cancel"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Seed: 4 users (OWNER, BARBER×2, CUSTOMER) | Task 7 |
| Seed: 1 barbershop, 2 barber profiles, 7 services | Task 7 |
| Seed: ~10 appointments in varied statuses | Task 7 |
| `GET /api/public/barbershops/:slug` (no auth) | Task 4 |
| `GET /api/public/barbershops/:slug/services` (no auth) | Task 4 |
| `GET /api/public/barbershops/:slug/barbers` (no auth) | Task 4 |
| `GET /api/public/barbershops/:slug/slots` (no auth) | Task 4 |
| `POST /api/appointments` (requireAuth, conflict check) | Task 5 |
| `GET /api/appointments/my` (requireAuth) | Task 5 |
| `PATCH /api/appointments/:id/cancel` (auth + ownership) | Task 5 |
| Route group `(public)` with minimal layout | Task 8 |
| `/b/[slug]` barbershop public page | Task 8 |
| `/b/[slug]/agendar` multi-step booking | Task 9 |
| Inline login/register at step 3 | Task 9 |
| `(customer)` layout requiring auth | Task 10 |
| `/minha-conta` with upcoming + history | Task 10 |
| Cancel button with confirm dialog | Task 10 |
| Middleware updated for `/b/` prefix | Task 6 |
| Slot generation tested | Task 2 |

All requirements covered. ✓

**Placeholder scan:** No TBDs or incomplete steps. ✓

**Type consistency:**
- `AppointmentWithDetails` defined in Task 1 → used in `listMyAppointments` (Task 10) ✓
- `PublicBarbershop`, `PublicBarber` defined in Task 1 → used in public queries (Task 8) and booking flow (Task 9) ✓
- `generateSlots(date, duration, bookedAt: Date[])` defined in Task 2 → called in `public.ts` (Task 4) ✓
- `cancelAppointmentAction(id: string)` defined in Task 10 → called in `CancelButton` (Task 10) ✓
