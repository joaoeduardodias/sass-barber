# Foundations — Design Spec

**Date:** 2026-05-22
**Status:** Approved (design), pending implementation plan
**Sub-project:** #1 of 7 in the web/API rebuild

## Context

The web app (`@barber/web`) currently renders **hardcoded mock data** across every page
(auth, dashboard, appointments, barbers, services, customers, settings). The API
(`@barber/api`) exposes **only** `/api/health` plus the better-auth routes — there are **no
domain endpoints**. The goal is to rebuild the platform with a new design + tech stack and
real backend integration.

The overall effort was decomposed into 7 dependency-ordered sub-projects (each with its own
spec → plan → implementation cycle):

| # | Sub-project | Depends on |
|---|---|---|
| 1 | **Foundations** (this spec) | — |
| 2 | Services | 1 |
| 3 | Barbers | 1 |
| 4 | Appointments | 2, 3 |
| 5 | Customers | 4 |
| 6 | Dashboard (stats) | 4 |
| 7 | Public booking + landing redesign | 2, 3, 4 |

This spec covers **only sub-project #1, Foundations**.

## Locked decisions (from brainstorming)

**Tech stack (web):** shadcn/ui + Tailwind · RSC + TanStack Query hybrid · react-hook-form + zod.

**Domain:** Dashboard + public booking (overall) · multi-tenant with shop switcher (an owner
can have multiple barbershops) · Owner + Barber roles (Foundations builds the guard
*mechanism*; barber-specific views land in slice #3).

**API conventions:** cookie + `X-Barbershop-Id` header for tenant scoping, flat routes ·
responses wrapped in `{ data }` (`ApiResponse`) with `PaginatedResponse` for lists ·
dashboard empty-state with a "create barbershop" CTA (no forced onboarding gate).

**Auth:** better-auth handles **authentication only** (login/registro/session). Authorization
& multi-tenancy use **custom** models (no organization plugin). The API resolves sessions via
`auth.api.getSession({ headers })`; `requireAuth`/`requireRole` are thin wrappers over it. No
custom JWT (`JWT_SECRET` stays unused).

**Design:** warm barber-branded aesthetic (amber/copper accent, slightly larger radius) ·
light + dark with `next-themes` · Portuguese (pt-BR) only, no i18n framework.

**Web↔API:** Approach B (BFF proxy) — RSC fetches Fastify server-side; the browser uses a
same-origin Next route-handler proxy + server actions.

## Scope

Foundations establishes every convention later slices reuse **and** proves the full stack
end-to-end with one real vertical slice: **Barbershop CRUD + Settings page**.

### In scope
- API conventions: zod validation, auth/role guards, tenant scoping, error format.
- Barbershop resource endpoints.
- Shared zod schemas in `@barber/types`.
- shadcn/ui design system + warm theme (light/dark) in `@barber/ui`.
- Data layer: BFF proxy + RSC `apiFetch` + TanStack Query setup.
- Active-shop cookie + shop switcher.
- Redesigned app shell (sidebar + topbar), redesigned login/register.
- Fully wired Settings page (barbershop profile).

### Out of scope (later slices)
- Services / Barbers / Appointments / Customers endpoints & pages (slices 2–5).
- Dashboard aggregated stats (slice 6).
- Public booking site + landing-page redesign (slice 7).
- Barber-specific limited views (slice 3) — Foundations builds the role-guard mechanism only.

## API architecture (`@barber/api`)

### Validation
Adopt `fastify-type-provider-zod` (zod is already a dependency). Register the validator +
serializer compilers so route `schema` blocks use zod. Schemas come from `@barber/types`.

### Auth plugin
A Fastify plugin/decorator resolves the better-auth session:
`auth.api.getSession({ headers: request.headers })`, attaching `request.user` (`id`, `role`).
- `requireAuth` preHandler → 401 (`ApiError`) when no session.
- `requireRole(...roles)` preHandler → 403 when the user's global role is not allowed.

### Tenant scoping
A `requireBarbershop` preHandler:
1. Reads `X-Barbershop-Id` from request headers (400 if missing where required).
2. Verifies the authenticated user's **membership**: owner (`Barbershop.ownerId === user.id`)
   or barber (`BarberProfile` with that `barbershopId` + `userId`). 403 if not a member.
3. Decorates `request.barbershopId` and `request.membershipRole` (`OWNER` | `BARBER`).

### Error handling
Central `app.setErrorHandler` returning the `ApiError` shape `{ error, message, statusCode }`:
- `ZodError` → 400 with field details in `message`.
- `@fastify/sensible` / HTTP errors → mapped to the same shape.
- Custom `setNotFoundHandler` → 404 in the same shape.

### Barbershop routes (`src/routes/barbershops.ts`, registered with `/api` prefix)
| Method | Path | Guards | Behavior |
|---|---|---|---|
| GET | `/api/barbershops` | `requireAuth` | Shops the user can access (owned + barber memberships). **Not** tenant-scoped — this is how a tenant is chosen. Powers the switcher. Returns `{ data: Barbershop[] }`. |
| POST | `/api/barbershops` | `requireAuth` | Create; caller becomes `ownerId`. If the caller's global role is `CUSTOMER`, promote to `OWNER`. Slug auto-generated + uniqueness-checked. Returns `{ data }`. |
| GET | `/api/barbershops/:id` | `requireAuth` + membership check | Returns `{ data }`. 403 if not a member. |
| PATCH | `/api/barbershops/:id` | `requireAuth` + owner-only | Update profile (name, slug, description, address, phone, logoUrl). Returns `{ data }`. |

No delete in Foundations (add soft-delete later if needed).

Slug: generated from `name` (kebab-case, deduped with a numeric suffix on collision). Needed
for public booking URLs in slice #7.

## Shared schemas (`@barber/types`)

Add `zod` as a dependency. Introduce domain zod schemas as the single source of truth:
- `createBarbershopSchema`, `updateBarbershopSchema` (and inferred TS types).
- Keep existing envelope types (`ApiResponse`, `PaginatedResponse`, `ApiError`, role/status unions).

The **API** validates with these schemas via the type provider; the **web** validates the same
forms with react-hook-form + `zodResolver`. One definition, both sides.

## Web architecture (`@barber/web` + `@barber/ui`)

### Design system (`@barber/ui`)
shadcn primitives + the Tailwind theme preset/tokens live in the **shared `@barber/ui`**
package so dashboard, auth pages, and the future public-booking site all reuse them. Web's
Tailwind config consumes the preset. Primitives needed for Foundations: button, input, label,
form, dropdown-menu, dialog, sheet, sonner (toast), avatar, card, skeleton, separator,
(plus dependencies pulled in by these).

### Theme
Warm barber-branded palette (amber/copper accent, slightly larger radius) via CSS variables.
Light + dark using `next-themes`. Tokens defined once in the `@barber/ui` theme layer.

### Providers
Root client `Providers` component wrapping `QueryClientProvider` (configured `QueryClient`),
`ThemeProvider` (`next-themes`), and the toaster. Mounted in the root layout.

### Data layer (Approach B — BFF proxy)
- **`apiFetch` (server)** — `lib/api/server.ts`: server→Fastify fetch. Forwards the session
  cookie (via `next/headers`) and injects `X-Barbershop-Id` from the active-shop cookie.
  Unwraps `{ data }`; throws a typed error on non-2xx. Used by RSC + server actions.
- **BFF proxy** — `app/api/bff/[...path]/route.ts`: same-origin endpoint the browser hits;
  forwards to Fastify with the session cookie + tenant header. Mounted at `/api/bff` to avoid
  colliding with the existing `/api/auth/[...all]`.
- **`apiClient` (browser)** — `lib/api/client.ts`: fetch wrapper to `/api/bff/...` for
  TanStack Query; unwraps `{ data }`, throws typed errors.
- **Mutations** default to **server actions** (call `apiFetch`, then `revalidatePath`).
  TanStack Query mutations (through the proxy) are used for optimistic/interactive cases.

### Active barbershop (tenant)
Stored in an `active-barbershop` cookie. A server util reads it; a server action sets it (the
switcher writes the cookie + revalidates). If unset, the dashboard layout defaults it to the
user's first accessible shop.

### App shell
Rebuilt sidebar + topbar in shadcn with the warm theme:
- **Shop switcher** — lists `GET /api/barbershops`; selecting one calls the set-active action;
  a "Create barbershop" item opens a dialog (react-hook-form + `createBarbershopSchema` →
  create server action).
- **User menu** — theme toggle + sign out (better-auth `signOut`).
- Nav items unchanged (dashboard, appointments, barbers, services, customers, settings).

### Pages
- **Settings** — fully functional barbershop-profile form (rhf + `updateBarbershopSchema` →
  update server action). The end-to-end proof of the whole stack.
- **dashboard / appointments / barbers / services / customers** — replaced with clean
  redesigned **empty-state placeholders** wired into the new shell (coherent app; later slices
  fill them in).
- **login / register** — redesigned with shadcn + new theme; better-auth client unchanged.
- **Landing page** — redesign **deferred** to slice #7.

### Middleware
Keep the existing session-cookie gate. Active-shop defaulting happens in the dashboard
layout/server component, not middleware.

## Data flow (end-to-end)

- **Read (initial):** RSC → `apiFetch` (cookie + `X-Barbershop-Id`) → Fastify
  (`requireAuth` + `requireBarbershop`) → Prisma → `{ data }`.
- **Read (interactive):** browser → TanStack Query → `/api/bff/...` → Fastify → same guards.
- **Write:** form (rhf + zod) → server action → `apiFetch` POST/PATCH → Fastify (validates
  with the shared schema) → Prisma → `revalidatePath`.

## Testing strategy

- **API:** vitest + Fastify `app.inject()` integration tests against a test database. Cover
  guards (401 / 403 / 400), barbershop CRUD happy + error paths, the `ApiError` shape, and
  validation failures. Implementation follows TDD.
- **Web:** vitest + React Testing Library. Cover `apiFetch` header injection + error parsing,
  active-shop cookie utils, switcher behavior, and Settings form validation.

## Flagged decisions (approved)

1. shadcn primitives + theme live in `@barber/ui` (shared), not web-local — maximizes reuse.
2. Shared zod schemas live in `@barber/types` (add zod dep), not a new package.
3. BFF proxy at `/api/bff/[...path]` to avoid colliding with the auth proxy.
4. Creating a barbershop promotes a `CUSTOMER`-role user to `OWNER` automatically.
5. No barbershop delete in Foundations (create/update only).
6. Landing-page redesign deferred; login/register redesigned now.
7. Authorization/multi-tenancy uses custom models (no better-auth organization plugin);
   better-auth is authentication only.

## Open risks / notes

- **shadcn in a monorepo** targeting `@barber/ui`: the CLI assumes app-local components;
  `components.json` + import aliases must be configured to point at the shared package. Verify
  the generated imports resolve from both `web` and future consumers.
- **Test database**: API integration tests need a Postgres test DB (or per-test transaction
  cleanup). The plan should pin how it's provisioned (e.g., a `test` schema / Docker service).
- **Slug uniqueness** is global today (`Barbershop.slug @unique`); generation must dedupe
  across all shops, not just the owner's.
