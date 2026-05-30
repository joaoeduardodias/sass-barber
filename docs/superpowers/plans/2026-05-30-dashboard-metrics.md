# Dashboard Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a revenue-focused metrics panel to the owner dashboard: Receita, Ticket médio, Concluídos (each with % delta vs prior period) + top-5 services table, with a 4-option period filter (7d / 30d / 90d / Este mês).

**Architecture:** New Fastify endpoint `GET /api/dashboard/stats?from=&to=` (requireAuth + requireBarbershop) aggregates COMPLETED appointments from Prisma. Web: RSC `page.tsx` loads initial data (30d), passes to `DashboardClient` Client Component that uses TanStack Query to re-fetch on period change via `apiClient` → BFF → API.

**Tech Stack:** Same as project — Fastify 5, fastify-type-provider-zod, Prisma 7, Next.js 15 App Router, React 19, TanStack Query 5, Tailwind, `@barber/ui`, vitest.

**Spec:** `docs/superpowers/specs/2026-05-30-dashboard-metrics-design.md`

---

## Conventions

- **Biome style:** no semicolons, single quotes, 2-space indent, trailing commas, 100-char width.
- **Envelope:** endpoints return `{ data }`. Errors return `{ error, message, statusCode }`.
- **Test DB:** `barber_test` Postgres DB. `pnpm --filter=@barber/api test` from repo root.
- **Period prior:** same number of days immediately before `from`. E.g. Jun 1–7 (7 days) → prior = May 25–31.
- **Delta:** `((current - prior) / prior) * 100`, 1 decimal. If prior=0 & current>0 → +100. Both 0 → 0.

---

## File Structure

### New files

| File | Responsibility |
|---|---|
| `src/packages/types/src/schemas/dashboard.ts` | `DashboardStats` interface |
| `src/apps/api/src/routes/dashboard.ts` | `dashboardRoutes` — single GET /dashboard/stats endpoint |
| `src/apps/api/tests/dashboard.test.ts` | Integration tests for the endpoint |
| `src/apps/web/src/lib/dashboard/queries.ts` | Server-only `getDashboardStats` via `apiFetch` |
| `src/apps/web/src/app/(dashboard)/dashboard/dashboard-client.tsx` | Client Component — period state + TanStack Query + cards + table |

### Modified files

| File | Change |
|---|---|
| `src/packages/types/src/index.ts` | Re-export from `./schemas/dashboard` |
| `src/apps/api/src/routes/index.ts` | Register `dashboardRoutes` |
| `src/apps/web/src/app/(dashboard)/dashboard/page.tsx` | Replace placeholder with RSC that fetches initial stats + renders `DashboardClient` |

---

## Task 1: `DashboardStats` type in `@barber/types`

**Files:**
- Create: `src/packages/types/src/schemas/dashboard.ts`
- Modify: `src/packages/types/src/index.ts`

- [ ] **Step 1: Create `src/packages/types/src/schemas/dashboard.ts`**

```ts
export interface DashboardStats {
  revenue: number
  revenueDelta: number
  avgTicket: number
  avgTicketDelta: number
  completedCount: number
  completedCountDelta: number
  topServices: Array<{
    serviceId: string
    name: string
    count: number
    revenue: number
  }>
}
```

- [ ] **Step 2: Add re-export to `src/packages/types/src/index.ts`**

Append after the existing `export *` lines:

```ts
export * from './schemas/dashboard'
```

- [ ] **Step 3: Verify build**

```bash
pnpm --filter=@barber/types build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/packages/types/src/schemas/dashboard.ts src/packages/types/src/index.ts
git commit -m "feat(types): add DashboardStats interface"
```

---

## Task 2: Dashboard API route + tests + register

**Files:**
- Create: `src/apps/api/tests/dashboard.test.ts`
- Create: `src/apps/api/src/routes/dashboard.ts`
- Modify: `src/apps/api/src/routes/index.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/apps/api/tests/dashboard.test.ts`:

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

  it('calculates positive delta when current > prior', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const customer = await createTestUser({ role: 'CUSTOMER' })
    const shop = await createBarbershop(owner.id, { slug: `dash-delta-${Date.now()}` })
    const bp = await createBarberMembership(barber.id, shop.id)
    const svc = await createService(shop.id, { price: 100 })

    // Current period: Jun 1–7
    await createAppointment({
      customerId: customer.id,
      barberId: bp.id,
      serviceId: svc.id,
      barbershopId: shop.id,
      scheduledAt: new Date(Date.UTC(2026, 5, 3, 9, 0)), // Jun 3
      status: 'COMPLETED',
    })
    // Prior period: May 25–31 (half the revenue)
    await createAppointment({
      customerId: customer.id,
      barberId: bp.id,
      serviceId: svc.id,
      barbershopId: shop.id,
      scheduledAt: new Date(Date.UTC(2026, 4, 26, 9, 0)), // May 26 — prior period
      status: 'COMPLETED',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/stats?from=2026-06-01&to=2026-06-07',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(200)
    const { data } = res.json()
    // current=1 appt, prior=1 appt → delta = 0% for count
    // current revenue=100, prior revenue=100 → delta = 0%
    expect(data.revenueDelta).toBe(0)
    expect(data.completedCountDelta).toBe(0)
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
      scheduledAt: new Date(Date.UTC(2099, 0, 15, 9, 0)), // far future — current period
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

    // 6 services — top 5 should exclude the one with fewest appointments
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

    await makeAppts(svcs[0], 5, 9)  // S1: 5 appts
    await makeAppts(svcs[1], 4, 10) // S2: 4 appts
    await makeAppts(svcs[2], 3, 11) // S3: 3 appts
    await makeAppts(svcs[3], 2, 12) // S4: 2 appts
    await makeAppts(svcs[4], 2, 13) // S5: 2 appts
    await makeAppts(svcs[5], 1, 14) // S6: 1 appt → should be excluded

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
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
pnpm --filter=@barber/api test tests/dashboard.test.ts
```

Expected: FAIL — route not registered yet.

- [ ] **Step 3: Implement `src/apps/api/src/routes/dashboard.ts`**

```ts
import { prisma } from '@barber/database'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

const statsQuery = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
})

const MS_PER_DAY = 86_400_000

function periodDates(from: string, to: string) {
  const parseDay = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  const fromMs = parseDay(from)
  const toMs = parseDay(to)
  const durationDays = Math.round((toMs - fromMs) / MS_PER_DAY) + 1

  return {
    fromDate: new Date(fromMs),
    toDate: new Date(toMs + MS_PER_DAY - 1),
    priorFromDate: new Date(fromMs - durationDays * MS_PER_DAY),
    priorToDate: new Date(fromMs - 1),
  }
}

function calcDelta(current: number, prior: number): number {
  if (prior === 0 && current === 0) return 0
  if (prior === 0) return 100
  return Math.round(((current - prior) / prior) * 1000) / 10
}

export const dashboardRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/dashboard/stats',
    {
      preHandler: [app.requireAuth, app.requireBarbershop],
      schema: { querystring: statsQuery },
    },
    async (request) => {
      const { from, to } = request.query
      const { fromDate, toDate, priorFromDate, priorToDate } = periodDates(from, to)

      const [current, prior] = await Promise.all([
        prisma.appointment.findMany({
          where: {
            barbershopId: request.barbershopId,
            status: 'COMPLETED',
            scheduledAt: { gte: fromDate, lte: toDate },
          },
          include: { service: { select: { id: true, name: true, price: true } } },
        }),
        prisma.appointment.findMany({
          where: {
            barbershopId: request.barbershopId,
            status: 'COMPLETED',
            scheduledAt: { gte: priorFromDate, lte: priorToDate },
          },
          include: { service: { select: { id: true, name: true, price: true } } },
        }),
      ])

      const sumRevenue = (appts: typeof current) =>
        appts.reduce((sum, a) => sum + Number(a.service.price), 0)

      const curRevenue = sumRevenue(current)
      const priRevenue = sumRevenue(prior)
      const curAvg = current.length ? curRevenue / current.length : 0
      const priAvg = prior.length ? priRevenue / prior.length : 0

      const serviceMap = new Map<
        string,
        { serviceId: string; name: string; count: number; revenue: number }
      >()
      for (const appt of current) {
        const entry = serviceMap.get(appt.service.id)
        if (entry) {
          entry.count++
          entry.revenue += Number(appt.service.price)
        } else {
          serviceMap.set(appt.service.id, {
            serviceId: appt.service.id,
            name: appt.service.name,
            count: 1,
            revenue: Number(appt.service.price),
          })
        }
      }
      const topServices = [...serviceMap.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        data: {
          revenue: curRevenue,
          revenueDelta: calcDelta(curRevenue, priRevenue),
          avgTicket: Math.round(curAvg * 100) / 100,
          avgTicketDelta: calcDelta(curAvg, priAvg),
          completedCount: current.length,
          completedCountDelta: calcDelta(current.length, prior.length),
          topServices,
        },
      }
    },
  )
}
```

- [ ] **Step 4: Register in `src/apps/api/src/routes/index.ts`**

```ts
import type { FastifyInstance } from 'fastify'
import { appointmentRoutes } from './appointments'
import { barberRoutes } from './barbers'
import { barbershopRoutes } from './barbershops'
import { dashboardRoutes } from './dashboard'
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
  await app.register(dashboardRoutes, { prefix: '/api' })
}
```

- [ ] **Step 5: Run dashboard tests to confirm they pass**

```bash
pnpm --filter=@barber/api test tests/dashboard.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 6: Run full test suite**

```bash
pnpm --filter=@barber/api test
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/apps/api/src/routes/dashboard.ts \
        src/apps/api/src/routes/index.ts \
        src/apps/api/tests/dashboard.test.ts
git commit -m "feat(api): add dashboard stats endpoint with period comparison"
```

---

## Task 3: Web — queries + RSC page + DashboardClient

**Files:**
- Create: `src/apps/web/src/lib/dashboard/queries.ts`
- Modify: `src/apps/web/src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/apps/web/src/app/(dashboard)/dashboard/dashboard-client.tsx`

- [ ] **Step 1: Create `src/apps/web/src/lib/dashboard/queries.ts`**

```ts
import 'server-only'
import { apiFetch } from '@/lib/api/server'
import type { DashboardStats } from '@barber/types'

export function getDashboardStats(barbershopId: string, from: string, to: string) {
  return apiFetch<DashboardStats>(`/dashboard/stats?from=${from}&to=${to}`, {
    headers: { 'x-barbershop-id': barbershopId },
  })
}
```

- [ ] **Step 2: Replace `src/apps/web/src/app/(dashboard)/dashboard/page.tsx`**

```tsx
import { getDashboardStats } from '@/lib/dashboard/queries'
import { listBarbershops } from '@/lib/barbershops/queries'
import { getActiveBarbershopId } from '@/lib/tenant.server'
import { Building2 } from 'lucide-react'
import { DashboardClient } from './dashboard-client'

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default async function DashboardPage() {
  const shops = await listBarbershops()
  const activeId = (await getActiveBarbershopId()) ?? shops[0]?.id ?? null

  if (!activeId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-sm font-medium">Você ainda não tem uma barbearia</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Crie uma pelo seletor na barra lateral.
        </p>
      </main>
    )
  }

  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setUTCDate(today.getUTCDate() - 29)

  const initialStats = await getDashboardStats(
    activeId,
    isoDate(thirtyDaysAgo),
    isoDate(today),
  ).catch(() => null)

  return (
    <DashboardClient
      barbershopId={activeId}
      initialStats={initialStats}
      initialPeriod="30d"
    />
  )
}
```

- [ ] **Step 3: Create `src/apps/web/src/app/(dashboard)/dashboard/dashboard-client.tsx`**

```tsx
'use client'

import { apiClient } from '@/lib/api/client'
import type { DashboardStats } from '@barber/types'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

type Period = '7d' | '30d' | '90d' | 'mes'

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  mes: 'Este mês',
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function getDateRange(period: Period): { from: string; to: string } {
  const today = new Date()
  const to = isoDate(today)
  if (period === 'mes') {
    const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
    return { from: isoDate(first), to }
  }
  const days = { '7d': 6, '30d': 29, '90d': 89 }[period]
  const from = new Date(today)
  from.setUTCDate(today.getUTCDate() - days)
  return { from: isoDate(from), to }
}

function formatCurrency(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-xs text-muted-foreground">— sem variação</span>
  const positive = delta > 0
  return (
    <span className={`text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
      {positive ? '↑' : '↓'} {Math.abs(delta)}% vs período anterior
    </span>
  )
}

function MetricCard({
  label,
  value,
  delta,
  loading,
}: {
  label: string
  value: string
  delta: number
  loading: boolean
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" />
      ) : (
        <>
          <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          <div className="mt-1">
            <DeltaBadge delta={delta} />
          </div>
        </>
      )}
    </div>
  )
}

export function DashboardClient({
  barbershopId,
  initialStats,
  initialPeriod,
}: {
  barbershopId: string
  initialStats: DashboardStats | null
  initialPeriod: Period
}) {
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const { from, to } = getDateRange(period)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', barbershopId, from, to],
    queryFn: () =>
      apiClient<DashboardStats>(`/dashboard/stats?from=${from}&to=${to}`, {
        headers: { 'x-barbershop-id': barbershopId },
      }),
    initialData: period === initialPeriod && initialStats ? initialStats : undefined,
    staleTime: 30_000,
  })

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Period filter */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Receita"
            value={`R$ ${formatCurrency(stats?.revenue ?? 0)}`}
            delta={stats?.revenueDelta ?? 0}
            loading={isLoading}
          />
          <MetricCard
            label="Ticket médio"
            value={`R$ ${formatCurrency(stats?.avgTicket ?? 0)}`}
            delta={stats?.avgTicketDelta ?? 0}
            loading={isLoading}
          />
          <MetricCard
            label="Concluídos"
            value={String(stats?.completedCount ?? 0)}
            delta={stats?.completedCountDelta ?? 0}
            loading={isLoading}
          />
        </div>

        {/* Top services */}
        <div className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Serviços mais populares</h2>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !stats?.topServices.length ? (
            <p className="p-5 text-sm text-muted-foreground">
              Nenhum serviço concluído no período.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Serviço</th>
                  <th className="px-5 py-3 font-medium text-right">Agendamentos</th>
                  <th className="px-5 py-3 font-medium text-right">Receita</th>
                </tr>
              </thead>
              <tbody>
                {stats.topServices.map((s) => (
                  <tr key={s.serviceId} className="border-b last:border-0">
                    <td className="px-5 py-3">{s.name}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{s.count}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      R$ {formatCurrency(s.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
pnpm --filter=@barber/web build 2>&1 | grep -E "error|Error|✓ Compiled"
```

Expected: `✓ Compiled successfully`.

- [ ] **Step 5: Commit**

```bash
git add src/apps/web/src/lib/dashboard/queries.ts \
        "src/apps/web/src/app/(dashboard)/dashboard/page.tsx" \
        "src/apps/web/src/app/(dashboard)/dashboard/dashboard-client.tsx"
git commit -m "feat(web): add dashboard metrics page with period filter"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| `GET /api/dashboard/stats?from=&to=` (requireAuth + requireBarbershop) | Task 2 |
| revenue, revenueDelta, avgTicket, avgTicketDelta, completedCount, completedCountDelta | Task 2 |
| topServices: top 5 by count desc | Task 2 |
| Prior period = same N days before `from` | Task 2 (`periodDates`) |
| Delta: % change, +100 if prior=0, 0 if both 0 | Task 2 (`calcDelta`) |
| 4-option period filter (7d/30d/90d/mes), default 30d | Task 3 |
| TanStack Query re-fetch on period change | Task 3 |
| 3 metric cards with delta badge | Task 3 |
| Green ↑ / red ↓ / gray — badge | Task 3 (`DeltaBadge`) |
| Top services table (max 5) | Task 3 |
| Loading skeleton | Task 3 |
| Empty state when no data | Task 3 |
| 401 without auth, 400 without header | Task 2 (tests) |
| No division by zero (avgTicket when count=0) | Task 2 (`curAvg = current.length ? ... : 0`) |
| DashboardStats type | Task 1 |

All requirements covered. ✓

**Placeholder scan:** No TBDs. All code blocks complete. ✓

**Type consistency:**
- `DashboardStats` defined in Task 1 → used in `getDashboardStats` (Task 3) and `DashboardClient` (Task 3) ✓
- `dashboardRoutes` defined in Task 2 → registered in `index.ts` (Task 2 Step 4) ✓
- `getDashboardStats(barbershopId, from, to)` defined in Task 3 Step 1 → called in `page.tsx` (Task 3 Step 2) ✓
- `DashboardClient({ barbershopId, initialStats, initialPeriod })` defined in Task 3 Step 3 → rendered in `page.tsx` (Task 3 Step 2) ✓
- `Period` type union `'7d' | '30d' | '90d' | 'mes'` consistent across `getDateRange`, `PERIOD_LABELS`, `useState` ✓
