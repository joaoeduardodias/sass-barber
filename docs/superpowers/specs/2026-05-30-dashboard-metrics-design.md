# Dashboard Metrics — Design Spec

**Date:** 2026-05-30
**Status:** Approved
**Sub-project:** #6 (Dashboard stats) of 7 in the web/API rebuild

## Context

Slices 1–5 and 7 (customer pages) are complete. The dashboard page currently shows a placeholder. This spec covers the revenue-focused metrics panel for the barbershop owner.

## Locked decisions

- **Focus:** Revenue — receita, ticket médio, serviços populares.
- **Comparativo:** variação em % vs período anterior equivalente (↑/↓).
- **Período:** configurável via 4 opções rápidas (7d, 30d, 90d, este mês). Default: 30 dias. Sem intervalo customizado (YAGNI).
- **Approach:** single API endpoint + RSC initial load + TanStack Query re-fetch on period change.

## API endpoint

`GET /api/dashboard/stats?from=YYYY-MM-DD&to=YYYY-MM-DD`

Guards: `requireAuth` + `requireBarbershop`.

### Response shape

```ts
{
  data: {
    revenue: number           // sum of Service.price for COMPLETED appointments in range
    revenueDelta: number      // % change vs equivalent prior period (e.g. +23.4, -5.0)
    avgTicket: number         // revenue / completedCount (0 if completedCount === 0)
    avgTicketDelta: number
    completedCount: number    // count of COMPLETED appointments in range
    completedCountDelta: number
    topServices: Array<{
      serviceId: string
      name: string
      count: number
      revenue: number
    }>                        // top 5 by count desc
  }
}
```

### Period calculation

- Current period: `[from 00:00:00 UTC, to 23:59:59 UTC]`
- Prior period: same number of days immediately before `from`.
  - `priorTo = from - 1 day`
  - `priorFrom = priorTo - (to - from)`
- Delta: `((current - prior) / prior) * 100`, rounded to 1 decimal. If `prior === 0` and `current > 0`: `+100`. If both 0: `0`.

### Prisma query approach

One `findMany` per period (current + prior), each with:

```ts
prisma.appointment.findMany({
  where: {
    barbershopId,
    status: 'COMPLETED',
    scheduledAt: { gte: periodStart, lte: periodEnd },
  },
  include: { service: { select: { id: true, name: true, price: true } } },
})
```

Aggregate in TypeScript (no raw SQL).

## Web pages

### Files

| File | Role |
|---|---|
| `src/apps/api/src/routes/dashboard.ts` | New route file with `dashboardRoutes` |
| `src/apps/api/tests/dashboard.test.ts` | Integration tests |
| `src/apps/web/src/lib/dashboard/queries.ts` | `getDashboardStats(from, to)` via `apiFetch` (server) |
| `src/apps/web/src/app/(dashboard)/dashboard/page.tsx` | RSC — initial fetch + renders `DashboardClient` |
| `src/apps/web/src/app/(dashboard)/dashboard/dashboard-client.tsx` | Client Component — period state + TanStack Query + renders cards/table |

### Period filter

Client Component within `DashboardClient`. Four buttons:

| Key | Label | Date range (relative to today) |
|---|---|---|
| `7d` | Últimos 7 dias | today-6 → today |
| `30d` | Últimos 30 dias | today-29 → today |
| `90d` | Últimos 90 dias | today-89 → today |
| `mes` | Este mês | 1st of current month → today |

Default: `30d`. On change: update state → TanStack Query re-fetches `/api/bff/dashboard/stats?from=&to=`.

### Metric cards

3 cards at the top:

- **Receita** — `R$ {revenue}` + delta badge
- **Ticket médio** — `R$ {avgTicket}` + delta badge
- **Concluídos** — `{completedCount}` + delta badge

Delta badge: green `↑ X%` for positive, red `↓ X%` for negative, gray `—` for zero.

### Top services table

Below cards. Columns: Serviço | Agendamentos | Receita. Sorted by count desc. Max 5 rows. Empty state if no data.

### Data flow

- **Initial render (RSC):** `page.tsx` computes today's date + 30d range → calls `getDashboardStats(from, to)` via `apiFetch` → passes result + active barbershop ID as props to `DashboardClient`.
- **Period change (browser):** `DashboardClient` calls `apiClient('/dashboard/stats?from=&to=')` → BFF → API.

## Testing

### API tests (`dashboard.test.ts`)

- Happy path: 2 COMPLETED appointments with known service prices in range → `revenue`, `avgTicket`, `completedCount` match.
- COMPLETED outside range → not counted.
- PENDING/CANCELLED appointments → not counted.
- No COMPLETED in current period → all zeros, no division by zero.
- Delta calculation: prior period has data → correct % shown.
- Prior period empty, current has data → delta = +100.
- `topServices` limited to 5, ordered by count desc.
- 401 without auth, 400 without `X-Barbershop-Id`.

### Web tests

- `PeriodFilter` clicking `90d` triggers query with correct `from`/`to` params.
- Positive delta renders green `↑`, negative renders red `↓`, zero renders `—`.

## Out of scope

- Date range picker / custom period.
- Per-barber breakdown.
- Charts / graphs.
- CSV export.
- Real-time updates (polling or WebSocket).
