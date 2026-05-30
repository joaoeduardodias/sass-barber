# Seed Data + Customer Pages — Design Spec

**Date:** 2026-05-30
**Status:** Approved (design), pending implementation plan
**Sub-project:** #7 (Public booking + customer area) of 7 in the web/API rebuild

## Context

Slices 1–3 are complete (Foundations, Services, Barbers). The database schema already has
`Barbershop`, `BarberProfile`, `Service`, `Appointment`, and `User` with a `CUSTOMER` role.
The seed file (`prisma/seed.ts`) exists but is empty. No customer-facing pages exist yet.

This spec covers two deliverables:
1. **Seed data** — realistic fictional data so all screens can be validated with real content.
2. **Customer pages** — public barbershop page, multi-step booking flow, and logged-in customer area.

## Locked decisions (from brainstorming)

- **Pages scope (Option A):** separate route groups `(public)` and `(customer)`, clean separation from the owner dashboard.
- **Seed level (Option B):** 1 barbershop, 2–3 barbers, 6–8 services, ~10 appointments in varied statuses.
- **Booking auth (Option B):** visitor browses and selects a slot; login/cadastro happens inline at the final confirmation step.
- **Customer actions:** can cancel PENDING or CONFIRMED appointments (with confirm dialog).

## Part 1 — Seed Data

### Users

| Email | Password | Role |
|---|---|---|
| `dono@barbearia.com` | `password123` | OWNER |
| `joao@barber.com` | `password123` | BARBER |
| `pedro@barber.com` | `password123` | BARBER |
| `cliente@example.com` | `password123` | CUSTOMER |

All users created with `better-auth`'s `api.signUpEmail` so that Account + Session records are
correct. Alternatively, hash the password with `bcrypt` and insert directly if the auth client
is not available from the seed script. Use `bcrypt` with 10 rounds (same as better-auth default).

### Barbershop

**Name:** Barbearia Vintage  
**Slug:** `barbearia-vintage`  
**Address:** Rua Augusta, 1200 — São Paulo, SP  
**Phone:** (11) 91234-5678  
**Description:** "Tradição e estilo desde 2010. Cortes clássicos e modernos para homens que se cuidam."  
**Owner:** `dono@barbearia.com`

### BarberProfiles

- **João Silva** (`joao@barber.com`) — bio: "Especialista em degradê e barba"
- **Pedro Costa** (`pedro@barber.com`) — bio: "Expert em cortes clássicos e platinado"

Both linked to Barbearia Vintage, `isActive: true`.

### Services (7)

| Name | Price | Duration |
|---|---|---|
| Corte simples | R$35 | 30 min |
| Degradê | R$50 | 45 min |
| Corte + Barba | R$60 | 60 min |
| Barba | R$30 | 30 min |
| Corte infantil | R$30 | 30 min |
| Sobrancelha | R$15 | 15 min |
| Platinado | R$150 | 120 min |

All `isActive: true`.

### Appointments (~10 for the customer user)

Mix of statuses to populate all UI states:

| # | Service | Barber | scheduledAt | Status |
|---|---|---|---|---|
| 1 | Corte simples | João | 30 days ago | COMPLETED |
| 2 | Barba | Pedro | 15 days ago | COMPLETED |
| 3 | Degradê | João | 7 days ago | COMPLETED |
| 4 | Corte + Barba | Pedro | Tomorrow 10:00 | PENDING |
| 5 | Corte simples | João | Next week Mon 14:00 | CONFIRMED |
| 6 | Barba | Pedro | Next week Wed 11:00 | CONFIRMED |
| 7 | Sobrancelha | João | 20 days ago | CANCELLED |

`customerId` = cliente user, `barbershopId` = Barbearia Vintage.

## Part 2 — API Endpoints

### Public routes (`src/routes/public.ts`, prefix `/api/public`, no auth)

| Method | Path | Returns |
|---|---|---|
| GET | `/api/public/barbershops/:slug` | Barbershop info (name, slug, address, phone, description, logoUrl) |
| GET | `/api/public/barbershops/:slug/services` | Active services (id, name, description, price, duration) |
| GET | `/api/public/barbershops/:slug/barbers` | Active barbers (id, user.name, bio, avatarUrl) |
| GET | `/api/public/barbershops/:slug/slots` | Query: `barberId`, `serviceId`, `date` (YYYY-MM-DD) → available time slots |

**Slots algorithm:**
- Generate slots from 09:00 to 18:00, step = service duration in minutes.
- Fetch existing appointments for the barber on that date with status PENDING, CONFIRMED, or IN_PROGRESS.
- Filter out slots that overlap with any booked appointment.
- Return `{ data: string[] }` — array of "HH:mm" strings.

### Appointment routes (`src/routes/appointments.ts`, prefix `/api`)

| Method | Path | Guards | Behavior |
|---|---|---|---|
| POST | `/api/appointments` | `requireAuth` | Create appointment; `customerId` from session; validate no barber conflict at that slot |
| GET | `/api/appointments/my` | `requireAuth` | List the authenticated user's appointments, ordered by `scheduledAt` desc |
| PATCH | `/api/appointments/:id/cancel` | `requireAuth` | Set status to CANCELLED; validate `customerId === user.id`; only PENDING or CONFIRMED allowed |

**Create appointment body (zod schema in `@barber/types`):**
```ts
{
  barbershopId: string
  serviceId: string
  barberId: string
  scheduledAt: string // ISO datetime
  notes?: string
}
```

Conflict check: no existing appointment for `barberId` at `scheduledAt` with status
PENDING | CONFIRMED | IN_PROGRESS.

## Part 3 — Web Pages

### Route group `(public)` (`src/app/(public)/`)

**Layout** (`layout.tsx`): minimal header — logo (scissors icon + "Barbearia") + "Entrar" link.
No sidebar. Plain white background.

**`/b/[slug]/page.tsx`** — Barbershop public page (RSC):
- Hero section: name, description, address, phone.
- Services grid: cards with name, price, duration.
- "Agendar agora" button → `/b/[slug]/agendar`.
- If barbershop not found → 404.

**`/b/[slug]/agendar/page.tsx`** — Booking flow (Client Component, multi-step with `useState`):

Step 1 — **Serviço:** grid of service cards; click to select and advance.

Step 2 — **Barbeiro + Horário:**
- Select barber (cards with name/bio).
- Date picker: current week + next week (simple day buttons, no library).
- Once barber + date selected: fetch `/api/public/.../slots?barberId=&serviceId=&date=` → show time grid.
- Click slot to select.
- "Continuar" button advances to step 3.

Step 3 — **Confirmar:**
- Summary card: service, barber, date, time, price.
- If user is NOT logged in: inline sign-in/register tabs using `better-auth` client (email + password); on success, submit the booking automatically.
- If user IS logged in: "Confirmar agendamento" button → POST `/api/bff/appointments`.
- On success: replace UI with a confirmation card + "Ver meus agendamentos" link → `/minha-conta`.

### Route group `(customer)` (`src/app/(customer)/`)

**Layout** (`layout.tsx`): mini-header — logo + user name + sign-out button. Requires auth
(redirect to `/login` if no session). Requires `CUSTOMER` role (redirect to `/dashboard` if OWNER or BARBER).

**`/minha-conta/page.tsx`** (RSC):
Fetches from `GET /api/appointments/my`.

Two sections:
1. **Próximos agendamentos** (status PENDING | CONFIRMED): date, time, service name, barber name,
   status badge, "Cancelar" button (opens a `<AlertDialog>` confirm; on confirm → PATCH cancel action → revalidate).
2. **Histórico** (status COMPLETED | CANCELLED | NO_SHOW): same info, no actions.

Empty state for each section if no appointments.

### Shared lib additions

- `src/lib/appointments/actions.ts` — `bookAppointment`, `cancelAppointment` server actions.
- `src/lib/appointments/queries.ts` — `listMyAppointments` (RSC fetch).
- `src/lib/public/queries.ts` — `getPublicBarbershop`, `listPublicServices`, `listPublicBarbers`, `getAvailableSlots` (client-side fetch via `apiClient`).

## Data flow

- **Public pages (read):** Client Component → `apiClient` → `/api/bff/public/...` → Fastify (no auth checked by API, BFF forwards normally).
- **Booking submit:** Client Component → `apiClient` → `/api/bff/appointments` (POST) → Fastify `requireAuth`.
- **Customer area (read):** RSC → `apiFetch` (server) → `/api/appointments/my`.
- **Cancel:** server action → `apiFetch` PATCH → `revalidatePath('/minha-conta')`.

## Testing strategy

- **API:** integration tests for the 7 new endpoints. Cover: 404 on unknown slug, slot generation logic, conflict detection on booking, auth guard on `POST /api/appointments`, ownership check on cancel.
- **Web:** unit test for the slot generation helper; RTL test for the booking step flow (step navigation, auth gate at step 3).

## Out of scope

- Payment integration.
- Email/SMS appointment reminders.
- Barber's own schedule view (slice #3 future iteration).
- Dashboard stats (slice #6).
- Admin ability to cancel/reschedule from dashboard (future).
