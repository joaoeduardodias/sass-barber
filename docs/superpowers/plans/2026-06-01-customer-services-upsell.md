# Customer Services Upsell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir os serviços da barbearia mais recente do cliente ao lado dos agendamentos em `/minha-conta`, incentivando novos agendamentos com um layout de duas colunas.

**Architecture:** Três mudanças encadeadas: (1) adicionar `slug` ao tipo `AppointmentWithDetails.barbershop` e ao select Prisma do endpoint; (2) atualizar a página do cliente para layout 2 colunas, buscando serviços via `listPublicServices()` já existente, usando o `slug` do appointment mais recente. Sem novas rotas, sem estado client-side.

**Tech Stack:** Next.js 15 Server Components, Prisma, `@barber/types`, Vitest + Testing Library

---

## File Map

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Modificar | `src/packages/types/src/schemas/appointment.ts` | Adicionar `slug` a `AppointmentWithDetails.barbershop` |
| Modificar | `src/apps/api/src/routes/appointments.ts` | Incluir `slug` no select Prisma de `GET /appointments/my` |
| Modificar | `src/apps/api/tests/appointments.test.ts` | Verificar que `barbershop.slug` está na resposta |
| Modificar | `src/apps/web/src/app/(customer)/minha-conta/page.tsx` | Layout 2 colunas + seção de serviços |
| Criar | `src/apps/web/src/__tests__/minha-conta.test.tsx` | Testes de render da página |

---

### Task 1: Adicionar `slug` ao tipo e ao endpoint da API

**Files:**
- Modify: `src/packages/types/src/schemas/appointment.ts:53`
- Modify: `src/apps/api/src/routes/appointments.ts:80`
- Modify: `src/apps/api/tests/appointments.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

No arquivo `src/apps/api/tests/appointments.test.ts`, adicionar dentro do `describe('GET /api/appointments/my')` existente (após o último `it`):

```ts
it('includes barbershop slug in the response', async () => {
  const owner = await createTestUser({ role: 'OWNER' })
  const barber = await createTestUser({ role: 'BARBER' })
  const customer = await createTestUser({ role: 'CUSTOMER' })
  const shop = await createBarbershop(owner.id, { slug: `slug-in-my-${Date.now()}` })
  const barberProfile = await createBarberMembership(barber.id, shop.id)
  const service = await createService(shop.id)

  await createAppointment({
    customerId: customer.id,
    barberId: barberProfile.id,
    serviceId: service.id,
    barbershopId: shop.id,
  })

  const res = await app.inject({
    method: 'GET',
    url: '/api/appointments/my',
    headers: { cookie: customer.cookie },
  })
  expect(res.statusCode).toBe(200)
  const { data } = res.json()
  expect(data[0].barbershop.slug).toBe(shop.slug)
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
pnpm --filter=@barber/api test tests/appointments.test.ts
```

Esperado: FAIL — `data[0].barbershop.slug` é `undefined`

- [ ] **Step 3: Atualizar o tipo `AppointmentWithDetails`**

Em `src/packages/types/src/schemas/appointment.ts`, linha 53, alterar:

```ts
  barbershop: { id: string; name: string }
```

para:

```ts
  barbershop: { id: string; name: string; slug: string }
```

- [ ] **Step 4: Atualizar o select Prisma em `GET /appointments/my`**

Em `src/apps/api/src/routes/appointments.ts`, linha 80, alterar:

```ts
        barbershop: { select: { id: true, name: true } },
```

para:

```ts
        barbershop: { select: { id: true, name: true, slug: true } },
```

- [ ] **Step 5: Rodar os testes da API e confirmar que passam**

```bash
pnpm --filter=@barber/api test tests/appointments.test.ts
```

Esperado: todos os testes PASS incluindo o novo

- [ ] **Step 6: Commit**

```bash
git add src/packages/types/src/schemas/appointment.ts src/apps/api/src/routes/appointments.ts src/apps/api/tests/appointments.test.ts
git commit -m "feat(api): include barbershop slug in GET /appointments/my response"
```

---

### Task 2: Atualizar página do cliente com layout 2 colunas e seção de serviços

**Files:**
- Modify: `src/apps/web/src/app/(customer)/minha-conta/page.tsx`
- Create: `src/apps/web/src/__tests__/minha-conta.test.tsx`

- [ ] **Step 1: Criar o arquivo de teste**

Criar `src/apps/web/src/__tests__/minha-conta.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/appointments/queries', () => ({ listMyAppointments: vi.fn() }))
vi.mock('@/lib/public/queries', () => ({ listPublicServices: vi.fn() }))
vi.mock('@/lib/appointments/actions', () => ({ cancelAppointmentAction: vi.fn() }))

import { listMyAppointments } from '@/lib/appointments/queries'
import { listPublicServices } from '@/lib/public/queries'
import MinhaContaPage from '../app/(customer)/minha-conta/page'

const makeAppointment = (overrides = {}) => ({
  id: 'appt-1',
  customerId: 'user-1',
  barberId: 'barber-1',
  serviceId: 'svc-1',
  barbershopId: 'shop-1',
  scheduledAt: new Date().toISOString(),
  status: 'COMPLETED' as const,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  service: { id: 'svc-1', name: 'Degradê', duration: 30, price: 50 },
  barber: { id: 'barber-1', user: { name: 'João' } },
  barbershop: { id: 'shop-1', name: 'Barbearia Alpha', slug: 'alpha' },
  ...overrides,
})

const makeService = (overrides = {}) => ({
  id: 'svc-1',
  name: 'Degradê',
  description: null,
  duration: 30,
  price: 50,
  barbershopId: 'shop-1',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

describe('MinhaContaPage', () => {
  it('shows the services section when user has appointments and services', async () => {
    vi.mocked(listMyAppointments).mockResolvedValue([makeAppointment()])
    vi.mocked(listPublicServices).mockResolvedValue([makeService()])

    render(await MinhaContaPage())

    expect(screen.getByText('Serviços em Barbearia Alpha')).toBeInTheDocument()
    expect(screen.getAllByText('Degradê').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Agendar' })).toHaveAttribute('href', '/b/alpha/agendar')
  })

  it('does not show the services section when user has no appointments', async () => {
    vi.mocked(listMyAppointments).mockResolvedValue([])
    vi.mocked(listPublicServices).mockResolvedValue([])

    render(await MinhaContaPage())

    expect(screen.queryByText(/Serviços em/)).not.toBeInTheDocument()
  })

  it('does not show services section when services list is empty', async () => {
    vi.mocked(listMyAppointments).mockResolvedValue([makeAppointment()])
    vi.mocked(listPublicServices).mockResolvedValue([])

    render(await MinhaContaPage())

    expect(screen.queryByText(/Serviços em/)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

```bash
pnpm --filter=@barber/web test src/__tests__/minha-conta.test.tsx
```

Esperado: FAIL — `Serviços em Barbearia Alpha` não encontrado

- [ ] **Step 3: Substituir o conteúdo de `page.tsx`**

Substituir o conteúdo completo de `src/apps/web/src/app/(customer)/minha-conta/page.tsx`:

```tsx
import { listMyAppointments } from '@/lib/appointments/queries'
import { listPublicServices } from '@/lib/public/queries'
import type { AppointmentWithDetails, Service } from '@barber/types'
import { Calendar, Clock, Scissors } from 'lucide-react'
import Link from 'next/link'
import { CancelButton } from './cancel-button'

export const metadata = { title: 'Meus Agendamentos' }

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
  appointment: AppointmentWithDetails
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

function ServiceCard({ service, slug }: { service: Service; slug: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{service.name}</p>
        <p className="text-xs text-muted-foreground">
          {service.duration} min ·{' '}
          {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>
      <Link
        href={`/b/${slug}/agendar`}
        className="ml-4 shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Agendar
      </Link>
    </div>
  )
}

export default async function MinhaContaPage() {
  const appointments = await listMyAppointments()
  const mostRecent = appointments[0] ?? null
  const services = mostRecent ? await listPublicServices(mostRecent.barbershop.slug) : []

  const upcoming = appointments.filter((a) =>
    ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status),
  )
  const history = appointments.filter((a) =>
    ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status),
  )

  const showServices = appointments.length > 0 && services.length > 0

  return (
    <main className={showServices ? 'mx-auto max-w-5xl px-4 py-10' : 'mx-auto max-w-2xl px-4 py-10'}>
      <h1 className="mb-8 text-xl font-semibold">Meus Agendamentos</h1>

      <div className={showServices ? 'grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]' : undefined}>
        <div>
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Próximos
            </h2>
            {upcoming.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                Nenhum agendamento próximo.{' '}
                <Link href="/" className="text-amber-600 underline">
                  Agendar agora
                </Link>
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
        </div>

        {showServices && mostRecent && (
          <aside>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Serviços em {mostRecent.barbershop.name}
            </h2>
            <div className="flex flex-col gap-3">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  slug={mostRecent.barbershop.slug}
                />
              ))}
            </div>
          </aside>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Rodar os testes da página e confirmar que passam**

```bash
pnpm --filter=@barber/web test src/__tests__/minha-conta.test.tsx
```

Esperado: 3 testes PASS

- [ ] **Step 5: Rodar todos os testes do web app**

```bash
pnpm --filter=@barber/web test
```

Esperado: todos os testes passam

- [ ] **Step 6: Commit**

```bash
git add src/apps/web/src/app/(customer)/minha-conta/page.tsx src/apps/web/src/__tests__/minha-conta.test.tsx
git commit -m "feat(web): add services upsell section to customer page with 2-column layout"
```
