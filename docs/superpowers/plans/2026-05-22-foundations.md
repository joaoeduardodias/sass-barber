# Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the API + web conventions and one real vertical slice (Barbershop CRUD + Settings) that proves the whole stack end-to-end.

**Architecture:** Fastify API with zod validation, better-auth session guards, and cookie/header tenant scoping returning `{ data }` envelopes. Next.js web with a shadcn/ui design system in `@barber/ui`, RSC + TanStack Query hybrid data layer through a same-origin BFF proxy, and react-hook-form + zod forms. Auth stays better-auth (authentication only); authorization/multi-tenancy use custom models.

**Tech Stack:** Fastify 5, fastify-type-provider-zod, fastify-plugin, better-auth 1.x, Prisma 7 (pg driver adapter), Next.js 15 App Router, React 19, Tailwind 3, shadcn/ui (manual, React-19 style, no forwardRef), TanStack Query 5, next-themes, react-hook-form, @hookform/resolvers, zod 4, vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-05-22-foundations-design.md`

---

## Conventions used in this plan

- **Biome style:** no semicolons, single quotes, 2-space indent, trailing commas, 100-char width, `organizeImports` on. The pre-commit hook runs `biome check --write` via lint-staged, so each commit auto-formats staged files. Code blocks below are written in this style.
- **Envelope:** all domain endpoints return `{ data }` (`ApiResponse`) — lists return `{ data: [] }`. Errors return `{ error, message, statusCode }` (`ApiError`).
- **Test DB:** API integration tests run against a dedicated `barber_test` Postgres database (same container, separate DB). The schema is pushed as a one-time prerequisite (re-run it after any schema change); tables are truncated `beforeEach` for isolation.
- **Run from repo root** unless a step says otherwise. Filter a workspace with `pnpm --filter=@barber/<pkg> <script>`.

---

## File Structure

### `@barber/types` (`src/packages/types`)
- Modify `package.json` — add `zod` dependency.
- Create `src/schemas/barbershop.ts` — `createBarbershopSchema`, `updateBarbershopSchema` + inferred types.
- Modify `src/index.ts` — add `Barbershop` entity interface; re-export schemas.

### `@barber/api` (`src/apps/api`)
- Modify `package.json` — add `fastify-type-provider-zod`, `fastify-plugin`.
- Create `vitest.config.ts`, `.env.test`, `tests/setup.ts`, `tests/helpers/app.ts`, `tests/helpers/auth.ts`, `tests/helpers/db.ts`.
- Create `src/lib/errors.ts` — `ApiError` + error handler + 404 handler.
- Create `src/lib/slug.ts` — `slugify` + `generateUniqueSlug`.
- Create `src/plugins/auth.ts` — `requireAuth`, `requireRole`, `request.user`.
- Create `src/plugins/tenant.ts` — `requireBarbershop`, `resolveMembership`, `request.barbershopId`, `request.membershipRole`.
- Create `src/types/fastify.d.ts` — Fastify decorator type augmentation.
- Create `src/routes/barbershops.ts` — Barbershop CRUD.
- Modify `src/app.ts` — wire zod compilers, error/404 handlers, plugins.
- Modify `src/routes/index.ts` — register barbershop routes.
- Tests: `tests/health.test.ts`, `tests/errors.test.ts`, `tests/auth.test.ts`, `tests/tenant.test.ts`, `tests/slug.test.ts`, `tests/barbershops.test.ts`.

### `@barber/ui` (`src/packages/ui`)
- Modify `package.json` — add cva, clsx, tailwind-merge, tailwindcss-animate, lucide-react, sonner, next-themes, radix (slot, label, dialog, dropdown-menu); peer react-hook-form; subpath `exports`.
- Create `src/lib/utils.ts` — `cn`.
- Create `tailwind-preset.ts` — theme tokens + dark mode + animate.
- Create `src/components/ui/{button,input,textarea,label,card,skeleton,dialog,dropdown-menu,form,sonner}.tsx`.
- Modify `src/index.ts` — export primitives + `cn`.

### `@barber/web` (`src/apps/web`)
- Modify `package.json` — add @tanstack/react-query, next-themes, react-hook-form, @hookform/resolvers, zod, sonner; vitest + RTL + jsdom + @vitejs/plugin-react.
- Create `vitest.config.ts`, `vitest.setup.ts`.
- Modify `tailwind.config.ts` (consume preset), `src/app/globals.css` (tokens), `src/app/layout.tsx` (Providers).
- Create `src/components/providers.tsx`.
- Create `src/lib/api/server.ts`, `src/lib/api/client.ts`, `src/lib/tenant.ts`.
- Create `src/app/api/bff/[...path]/route.ts`.
- Create `src/lib/barbershops/{actions,queries,hooks}.ts`.
- Rewrite `src/components/sidebar.tsx`, `src/components/topbar.tsx`; create `src/components/shop-switcher.tsx`, `src/components/user-menu.tsx`, `src/components/create-shop-dialog.tsx`, `src/components/theme-toggle.tsx`.
- Rewrite `src/app/(dashboard)/layout.tsx`, `settings/page.tsx`, and the placeholder pages.
- Rewrite `src/app/(auth)/login/page.tsx`, `register/page.tsx`, `(auth)/layout.tsx`.
- Tests: `src/lib/__tests__/tenant.test.ts`, `src/lib/api/__tests__/server.test.ts`, `src/components/__tests__/shop-switcher.test.tsx`, `src/app/(dashboard)/settings/__tests__/settings-form.test.tsx`, `src/__tests__/ui-smoke.test.tsx`.

---

# Phase 0 — Shared schemas (`@barber/types`)

## Task 1: Barbershop schemas + entity type

**Files:**
- Modify: `src/packages/types/package.json`
- Create: `src/packages/types/src/schemas/barbershop.ts`
- Modify: `src/packages/types/src/index.ts`

- [ ] **Step 1: Add zod dependency**

Edit `src/packages/types/package.json` — add a `dependencies` block (the file currently has none):

```json
{
  "name": "@barber/types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc --noEmit",
    "lint": "biome check src",
    "lint:fix": "biome check --write src"
  },
  "dependencies": {
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@barber/config": "workspace:*",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Install**

Run: `pnpm install`
Expected: lockfile updates, `zod` linked into `@barber/types`.

- [ ] **Step 3: Create the schemas**

Create `src/packages/types/src/schemas/barbershop.ts`:

```ts
import { z } from 'zod'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const createBarbershopSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
  description: z.string().max(500).optional(),
  address: z.string().min(5, 'Endereço inválido').max(200),
  phone: z.string().min(8, 'Telefone inválido').max(20),
  logoUrl: z.url('URL inválida').optional(),
})

export const updateBarbershopSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(slugRegex, 'Slug inválido').optional(),
  description: z.string().max(500).nullable().optional(),
  address: z.string().min(5).max(200).optional(),
  phone: z.string().min(8).max(20).optional(),
  logoUrl: z.url('URL inválida').nullable().optional(),
})

export type CreateBarbershopInput = z.infer<typeof createBarbershopSchema>
export type UpdateBarbershopInput = z.infer<typeof updateBarbershopSchema>
```

- [ ] **Step 4: Add the entity type + re-export**

Edit `src/packages/types/src/index.ts` — append the `Barbershop` interface and re-export the schemas:

```ts
export * from './schemas/barbershop'

export interface Barbershop {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  phone: string
  logoUrl: string | null
  ownerId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter=@barber/types build`
Expected: exits 0 (no type errors).

- [ ] **Step 6: Commit**

```bash
git add src/packages/types pnpm-lock.yaml
git commit -m "feat: add shared barbershop zod schemas and entity type"
```

---

# Phase 1 — API foundations + Barbershop CRUD (TDD)

## Task 2: API test infrastructure

**Files:**
- Modify: `src/apps/api/package.json`
- Create: `src/apps/api/vitest.config.ts`
- Create: `src/apps/api/.env.test`
- Create: `src/apps/api/tests/setup.ts`
- Create: `src/apps/api/tests/helpers/app.ts`
- Create: `src/apps/api/tests/helpers/auth.ts`
- Create: `src/apps/api/tests/helpers/db.ts`

- [ ] **Step 1: Add runtime deps**

Edit `src/apps/api/package.json` `dependencies` — add `fastify-plugin` and `fastify-type-provider-zod`:

```json
    "@barber/database": "workspace:*",
    "@barber/types": "workspace:*",
    "@fastify/cors": "^10.0.0",
    "@fastify/helmet": "^12.0.0",
    "@fastify/rate-limit": "^10.0.0",
    "@fastify/sensible": "^6.0.0",
    "better-auth": "^1.0.0",
    "dotenv": "^16.4.0",
    "fastify": "^5.0.0",
    "fastify-plugin": "^5.0.0",
    "fastify-type-provider-zod": "^4.0.0",
    "zod": "^4.0.0"
```

Run: `pnpm install`

- [ ] **Step 2: Create the test Postgres database (one-time)**

Run (ignore "already exists" error):

```bash
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE barber_test;"
```

Expected: `CREATE DATABASE` (or a harmless "already exists" error).

- [ ] **Step 3: Push the schema to the test DB (one-time; re-run after schema changes)**

Run from repo root (the inline env var overrides the dev DB for this command only):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barber_test" \
  pnpm --filter=@barber/database exec prisma db push --skip-generate
```

Expected: "Your database is now in sync with your Prisma schema."

- [ ] **Step 4: Create `.env.test`**

Create `src/apps/api/.env.test`:

```
NODE_ENV=test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barber_test"
BETTER_AUTH_SECRET="test-secret-key-min-32-chars-aaaaaaaa"
BETTER_AUTH_URL="http://localhost:3001"
JWT_SECRET="test-jwt-secret-min-32-chars-bbbbbbbb"
```

- [ ] **Step 5: Create vitest config**

Create `src/apps/api/vitest.config.ts`. Loading dotenv at the top guarantees `env.ts` sees the test DB before any module imports it:

```ts
import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'

config({ path: '.env.test' })

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
    hookTimeout: 30_000,
  },
})
```

- [ ] **Step 6: Create per-test cleanup**

Create `src/apps/api/tests/setup.ts`:

```ts
import { prisma } from '@barber/database'
import { afterAll, beforeEach } from 'vitest'

beforeEach(async () => {
  await prisma.$transaction([
    prisma.appointment.deleteMany(),
    prisma.service.deleteMany(),
    prisma.barberProfile.deleteMany(),
    prisma.barbershop.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.user.deleteMany(),
  ])
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

- [ ] **Step 7: Create the app helper**

Create `src/apps/api/tests/helpers/app.ts`:

```ts
import type { FastifyInstance } from 'fastify'
import { createApp } from '../../src/app'

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = await createApp()
  await app.ready()
  return app
}
```

- [ ] **Step 8: Create the auth helper**

Create `src/apps/api/tests/helpers/auth.ts`. It signs up a real user through better-auth and returns the session cookie to replay on `inject`:

```ts
import { prisma, type UserRole } from '@barber/database'
import { auth } from '../../src/auth'

export interface TestUser {
  id: string
  email: string
  cookie: string
}

export async function createTestUser(opts?: {
  role?: UserRole
  name?: string
  email?: string
}): Promise<TestUser> {
  const email = opts?.email ?? `user-${crypto.randomUUID()}@test.com`
  const name = opts?.name ?? 'Test User'

  const { headers } = await auth.api.signUpEmail({
    body: { email, password: 'password123', name },
    returnHeaders: true,
  })

  const setCookie = headers.get('set-cookie') ?? ''
  const cookie = setCookie.split(';')[0]

  const user = await prisma.user.findUniqueOrThrow({ where: { email } })

  if (opts?.role && opts.role !== user.role) {
    await prisma.user.update({ where: { id: user.id }, data: { role: opts.role } })
  }

  return { id: user.id, email, cookie }
}
```

- [ ] **Step 9: Create the db helper**

Create `src/apps/api/tests/helpers/db.ts`:

```ts
import { prisma } from '@barber/database'

export function createBarbershop(
  ownerId: string,
  overrides?: { name?: string; slug?: string },
) {
  const id = crypto.randomUUID()
  return prisma.barbershop.create({
    data: {
      name: overrides?.name ?? 'Test Shop',
      slug: overrides?.slug ?? `test-shop-${id.slice(0, 8)}`,
      address: 'Rua Teste, 123',
      phone: '11999999999',
      ownerId,
    },
  })
}

export function createBarberMembership(userId: string, barbershopId: string) {
  return prisma.barberProfile.create({ data: { userId, barbershopId } })
}
```

- [ ] **Step 10: Commit**

```bash
git add src/apps/api/package.json src/apps/api/vitest.config.ts src/apps/api/.env.test src/apps/api/tests pnpm-lock.yaml
git commit -m "test: add api vitest infrastructure and test helpers"
```

---

## Task 3: Error handling + zod compilers + app wiring

**Files:**
- Create: `src/apps/api/src/lib/errors.ts`
- Modify: `src/apps/api/src/app.ts`
- Test: `src/apps/api/tests/health.test.ts`, `src/apps/api/tests/errors.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/apps/api/tests/health.test.ts`:

```ts
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildTestApp } from './helpers/app'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})
afterAll(async () => {
  await app.close()
})

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'ok' })
  })
})
```

Create `src/apps/api/tests/errors.test.ts`:

```ts
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildTestApp } from './helpers/app'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})
afterAll(async () => {
  await app.close()
})

describe('error handling', () => {
  it('returns the ApiError shape for unknown routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/does-not-exist' })
    expect(res.statusCode).toBe(404)
    expect(res.json()).toEqual({
      error: 'Not Found',
      message: expect.stringContaining('não encontrada'),
      statusCode: 404,
    })
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm --filter=@barber/api test`
Expected: FAIL — `errors.test.ts` fails because the default Fastify 404 body shape/message differs from the `ApiError` shape. Confirm red before proceeding.

- [ ] **Step 3: Create the error module**

Create `src/apps/api/src/lib/errors.ts`:

```ts
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod'
import { ZodError } from 'zod'

export class ApiError extends Error {
  statusCode: number
  error: string

  constructor(statusCode: number, error: string, message: string) {
    super(message)
    this.name = error
    this.statusCode = statusCode
    this.error = error
  }
}

export function errorHandler(
  error: FastifyError | ApiError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof ApiError) {
    return reply
      .status(error.statusCode)
      .send({ error: error.error, message: error.message, statusCode: error.statusCode })
  }

  if (hasZodFastifySchemaValidationErrors(error)) {
    const message = error.validation
      .map((v) => {
        const issue = v.params?.issue
        const path = issue?.path?.join('.') || 'campo'
        return `${path}: ${issue?.message ?? v.message}`
      })
      .join('; ')
    return reply.status(400).send({ error: 'Bad Request', message, statusCode: 400 })
  }

  if (error instanceof ZodError) {
    const message = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return reply.status(400).send({ error: 'Bad Request', message, statusCode: 400 })
  }

  if (isResponseSerializationError(error)) {
    request.log.error(error)
    return reply
      .status(500)
      .send({ error: 'Internal Server Error', message: 'Erro ao serializar resposta', statusCode: 500 })
  }

  const statusCode = error.statusCode ?? 500
  if (statusCode >= 500) request.log.error(error)
  return reply.status(statusCode).send({
    error: error.name ?? 'Internal Server Error',
    message: statusCode >= 500 ? 'Erro interno do servidor' : error.message,
    statusCode,
  })
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(404).send({
    error: 'Not Found',
    message: `Rota ${request.method} ${request.url} não encontrada`,
    statusCode: 404,
  })
}
```

- [ ] **Step 4: Wire compilers + handlers into the app**

Edit `src/apps/api/src/app.ts`. Replace the import block and the instance setup (top of `createApp`) so it reads as below; leave everything from `await app.register(sensible)` downward unchanged:

```ts
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { auth } from './auth'
import { env } from './env'
import { errorHandler, notFoundHandler } from './lib/errors'
import { registerRoutes } from './routes'

export async function createApp() {
  const app = Fastify({
    logger: {
      level:
        env.NODE_ENV === 'production' ? 'info' : env.NODE_ENV === 'test' ? 'silent' : 'debug',
    },
  })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.setErrorHandler(errorHandler)
  app.setNotFoundHandler(notFoundHandler)
```

- [ ] **Step 5: Run to verify both tests pass**

Run: `pnpm --filter=@barber/api test`
Expected: PASS (`health` + `errors`).

- [ ] **Step 6: Commit**

```bash
git add src/apps/api/src/lib/errors.ts src/apps/api/src/app.ts src/apps/api/tests/health.test.ts src/apps/api/tests/errors.test.ts
git commit -m "feat: add api error handler, 404 handler, and zod compilers"
```

---

## Task 4: Auth plugin (requireAuth / requireRole)

**Files:**
- Create: `src/apps/api/src/plugins/auth.ts`
- Create: `src/apps/api/src/types/fastify.d.ts`
- Modify: `src/apps/api/src/app.ts`
- Test: `src/apps/api/tests/auth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/apps/api/tests/auth.test.ts`. It registers throwaway probe routes on the built app so the guards can be exercised in isolation:

```ts
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildTestApp } from './helpers/app'
import { createTestUser } from './helpers/auth'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
  app.get('/api/_probe', { preHandler: [app.requireAuth] }, async (request) => ({
    data: { userId: request.user?.id, role: request.user?.role },
  }))
  app.get(
    '/api/_owner-only',
    { preHandler: [app.requireAuth, app.requireRole('OWNER')] },
    async () => ({ data: 'ok' }),
  )
  await app.ready()
})
afterAll(async () => {
  await app.close()
})

describe('requireAuth', () => {
  it('rejects requests without a session (401)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/_probe' })
    expect(res.statusCode).toBe(401)
    expect(res.json()).toMatchObject({ statusCode: 401, error: 'Unauthorized' })
  })

  it('attaches request.user for an authenticated request', async () => {
    const user = await createTestUser()
    const res = await app.inject({
      method: 'GET',
      url: '/api/_probe',
      headers: { cookie: user.cookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({ userId: user.id, role: 'CUSTOMER' })
  })
})

describe('requireRole', () => {
  it('forbids a user whose role is not allowed (403)', async () => {
    const user = await createTestUser({ role: 'CUSTOMER' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/_owner-only',
      headers: { cookie: user.cookie },
    })
    expect(res.statusCode).toBe(403)
    expect(res.json()).toMatchObject({ statusCode: 403, error: 'Forbidden' })
  })

  it('allows a user whose role is permitted', async () => {
    const user = await createTestUser({ role: 'OWNER' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/_owner-only',
      headers: { cookie: user.cookie },
    })
    expect(res.statusCode).toBe(200)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter=@barber/api test auth`
Expected: FAIL — `app.requireAuth` is not a function (plugin not registered yet).

- [ ] **Step 3: Create the type augmentation**

Create `src/apps/api/src/types/fastify.d.ts`:

```ts
import 'fastify'
import type { UserRole } from '@barber/database'
import type { AuthUser } from '../plugins/auth'

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser | null
    barbershopId: string
    membershipRole: 'OWNER' | 'BARBER' | null
  }
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest) => Promise<void>
    requireRole: (...roles: UserRole[]) => (request: FastifyRequest) => Promise<void>
    requireBarbershop: (request: FastifyRequest) => Promise<void>
  }
}
```

- [ ] **Step 4: Create the auth plugin**

Create `src/apps/api/src/plugins/auth.ts`:

```ts
import type { UserRole } from '@barber/database'
import { fromNodeHeaders } from 'better-auth/node'
import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { auth } from '../auth'
import { ApiError } from '../lib/errors'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

const authPluginCallback: FastifyPluginAsync = async (app) => {
  app.decorateRequest('user', null)

  app.decorate('requireAuth', async (request: FastifyRequest) => {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) })
    if (!session) throw new ApiError(401, 'Unauthorized', 'Autenticação necessária')
    request.user = {
      id: session.user.id,
      email: session.user.email,
      role: (session.user as { role?: UserRole }).role ?? 'CUSTOMER',
    }
  })

  app.decorate('requireRole', (...roles: UserRole[]) => {
    return async (request: FastifyRequest) => {
      if (!request.user) throw new ApiError(401, 'Unauthorized', 'Autenticação necessária')
      if (!roles.includes(request.user.role)) {
        throw new ApiError(403, 'Forbidden', 'Permissão insuficiente')
      }
    }
  })
}

export const authPlugin = fp(authPluginCallback, { name: 'auth-plugin' })
```

- [ ] **Step 5: Register the plugin**

Edit `src/apps/api/src/app.ts` — add the import and register `authPlugin` immediately after the `rateLimit` registration (before the `/api/auth/*` delegation):

```ts
import { authPlugin } from './plugins/auth'
```

```ts
  await app.register(authPlugin)
```

- [ ] **Step 6: Run to verify it passes**

Run: `pnpm --filter=@barber/api test auth`
Expected: PASS (all four cases).

- [ ] **Step 7: Commit**

```bash
git add src/apps/api/src/plugins/auth.ts src/apps/api/src/types/fastify.d.ts src/apps/api/src/app.ts src/apps/api/tests/auth.test.ts
git commit -m "feat: add api auth plugin with requireAuth and requireRole guards"
```

---

## Task 5: Tenant plugin (requireBarbershop / resolveMembership)

**Files:**
- Create: `src/apps/api/src/plugins/tenant.ts`
- Modify: `src/apps/api/src/app.ts`
- Test: `src/apps/api/tests/tenant.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/apps/api/tests/tenant.test.ts`:

```ts
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildTestApp } from './helpers/app'
import { createTestUser } from './helpers/auth'
import { createBarberMembership, createBarbershop } from './helpers/db'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
  app.get(
    '/api/_scoped',
    { preHandler: [app.requireAuth, app.requireBarbershop] },
    async (request) => ({
      data: { barbershopId: request.barbershopId, role: request.membershipRole },
    }),
  )
  await app.ready()
})
afterAll(async () => {
  await app.close()
})

describe('requireBarbershop', () => {
  it('returns 400 when the X-Barbershop-Id header is missing', async () => {
    const user = await createTestUser()
    const res = await app.inject({
      method: 'GET',
      url: '/api/_scoped',
      headers: { cookie: user.cookie },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 403 when the user is not a member', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const stranger = await createTestUser()
    const shop = await createBarbershop(owner.id)
    const res = await app.inject({
      method: 'GET',
      url: '/api/_scoped',
      headers: { cookie: stranger.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(403)
  })

  it('resolves OWNER membership', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const shop = await createBarbershop(owner.id)
    const res = await app.inject({
      method: 'GET',
      url: '/api/_scoped',
      headers: { cookie: owner.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({ barbershopId: shop.id, role: 'OWNER' })
  })

  it('resolves BARBER membership', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    const barber = await createTestUser({ role: 'BARBER' })
    const shop = await createBarbershop(owner.id)
    await createBarberMembership(barber.id, shop.id)
    const res = await app.inject({
      method: 'GET',
      url: '/api/_scoped',
      headers: { cookie: barber.cookie, 'x-barbershop-id': shop.id },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({ role: 'BARBER' })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter=@barber/api test tenant`
Expected: FAIL — `app.requireBarbershop` is not a function.

- [ ] **Step 3: Create the tenant plugin**

Create `src/apps/api/src/plugins/tenant.ts`:

```ts
import { prisma } from '@barber/database'
import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { ApiError } from '../lib/errors'

export async function resolveMembership(
  userId: string,
  barbershopId: string,
): Promise<'OWNER' | 'BARBER' | null> {
  const shop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: { ownerId: true },
  })
  if (!shop) return null
  if (shop.ownerId === userId) return 'OWNER'
  const profile = await prisma.barberProfile.findFirst({
    where: { userId, barbershopId },
    select: { id: true },
  })
  return profile ? 'BARBER' : null
}

const tenantPluginCallback: FastifyPluginAsync = async (app) => {
  app.decorateRequest('barbershopId', '')
  app.decorateRequest('membershipRole', null)

  app.decorate('requireBarbershop', async (request: FastifyRequest) => {
    if (!request.user) throw new ApiError(401, 'Unauthorized', 'Autenticação necessária')
    const header = request.headers['x-barbershop-id']
    const barbershopId = Array.isArray(header) ? header[0] : header
    if (!barbershopId) {
      throw new ApiError(400, 'Bad Request', 'Header X-Barbershop-Id é obrigatório')
    }
    const role = await resolveMembership(request.user.id, barbershopId)
    if (!role) throw new ApiError(403, 'Forbidden', 'Você não tem acesso a esta barbearia')
    request.barbershopId = barbershopId
    request.membershipRole = role
  })
}

export const tenantPlugin = fp(tenantPluginCallback, {
  name: 'tenant-plugin',
  dependencies: ['auth-plugin'],
})
```

- [ ] **Step 4: Register the plugin**

Edit `src/apps/api/src/app.ts` — add the import and register after `authPlugin`:

```ts
import { tenantPlugin } from './plugins/tenant'
```

```ts
  await app.register(tenantPlugin)
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm --filter=@barber/api test tenant`
Expected: PASS (all four cases).

- [ ] **Step 6: Commit**

```bash
git add src/apps/api/src/plugins/tenant.ts src/apps/api/src/app.ts src/apps/api/tests/tenant.test.ts
git commit -m "feat: add api tenant plugin with membership resolution"
```

---

## Task 6: Slug generation

**Files:**
- Create: `src/apps/api/src/lib/slug.ts`
- Test: `src/apps/api/tests/slug.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/apps/api/tests/slug.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createTestUser } from './helpers/auth'
import { createBarbershop } from './helpers/db'
import { generateUniqueSlug, slugify } from '../src/lib/slug'

describe('slugify', () => {
  it('kebab-cases and strips accents', () => {
    expect(slugify('Barbearia São João')).toBe('barbearia-sao-joao')
  })

  it('collapses non-alphanumerics and trims dashes', () => {
    expect(slugify('  Corte & Cia!! ')).toBe('corte-cia')
  })

  it('returns empty string for input with no alphanumerics', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('generateUniqueSlug', () => {
  it('returns the base slug when free', async () => {
    expect(await generateUniqueSlug('Studio Alpha')).toBe('studio-alpha')
  })

  it('appends a numeric suffix on collision', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    await createBarbershop(owner.id, { name: 'Studio Beta', slug: 'studio-beta' })
    expect(await generateUniqueSlug('Studio Beta')).toBe('studio-beta-2')
  })

  it('falls back to "barbearia" when the name has no alphanumerics', async () => {
    expect(await generateUniqueSlug('!!!')).toBe('barbearia')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter=@barber/api test slug`
Expected: FAIL — module `../src/lib/slug` not found.

- [ ] **Step 3: Implement slug helpers**

Create `src/apps/api/src/lib/slug.ts`:

```ts
import { prisma } from '@barber/database'

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'barbearia'
  let candidate = base
  let suffix = 1
  while (
    await prisma.barbershop.findUnique({ where: { slug: candidate }, select: { id: true } })
  ) {
    suffix += 1
    candidate = `${base}-${suffix}`
  }
  return candidate
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter=@barber/api test slug`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/apps/api/src/lib/slug.ts src/apps/api/tests/slug.test.ts
git commit -m "feat: add unique slug generation for barbershops"
```

---

## Task 7: Barbershop routes (CRUD)

**Files:**
- Create: `src/apps/api/src/routes/barbershops.ts`
- Modify: `src/apps/api/src/routes/index.ts`
- Test: `src/apps/api/tests/barbershops.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/apps/api/tests/barbershops.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter=@barber/api test barbershops`
Expected: FAIL — routes return 404 (not registered).

- [ ] **Step 3: Implement the routes**

Create `src/apps/api/src/routes/barbershops.ts`:

```ts
import { prisma } from '@barber/database'
import { createBarbershopSchema, updateBarbershopSchema } from '@barber/types'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ApiError } from '../lib/errors'
import { generateUniqueSlug } from '../lib/slug'
import { resolveMembership } from '../plugins/tenant'

const idParams = z.object({ id: z.string() })

export const barbershopRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/barbershops', { preHandler: [app.requireAuth] }, async (request) => {
    const userId = request.user!.id
    const shops = await prisma.barbershop.findMany({
      where: { OR: [{ ownerId: userId }, { barbers: { some: { userId } } }] },
      orderBy: { createdAt: 'asc' },
    })
    return { data: shops }
  })

  app.post(
    '/barbershops',
    { preHandler: [app.requireAuth], schema: { body: createBarbershopSchema } },
    async (request, reply) => {
      const user = request.user!
      const input = request.body
      const slug = await generateUniqueSlug(input.name)
      const shop = await prisma.barbershop.create({
        data: { ...input, slug, ownerId: user.id },
      })
      if (user.role === 'CUSTOMER') {
        await prisma.user.update({ where: { id: user.id }, data: { role: 'OWNER' } })
      }
      return reply.status(201).send({ data: shop })
    },
  )

  app.get(
    '/barbershops/:id',
    { preHandler: [app.requireAuth], schema: { params: idParams } },
    async (request) => {
      const { id } = request.params
      const role = await resolveMembership(request.user!.id, id)
      if (!role) throw new ApiError(403, 'Forbidden', 'Você não tem acesso a esta barbearia')
      const shop = await prisma.barbershop.findUnique({ where: { id } })
      if (!shop) throw new ApiError(404, 'Not Found', 'Barbearia não encontrada')
      return { data: shop }
    },
  )

  app.patch(
    '/barbershops/:id',
    { preHandler: [app.requireAuth], schema: { params: idParams, body: updateBarbershopSchema } },
    async (request) => {
      const { id } = request.params
      const role = await resolveMembership(request.user!.id, id)
      if (role !== 'OWNER') {
        throw new ApiError(403, 'Forbidden', 'Apenas o dono pode editar a barbearia')
      }
      const data = request.body
      if (data.slug) {
        const existing = await prisma.barbershop.findUnique({
          where: { slug: data.slug },
          select: { id: true },
        })
        if (existing && existing.id !== id) {
          throw new ApiError(409, 'Conflict', 'Este slug já está em uso')
        }
      }
      const shop = await prisma.barbershop.update({ where: { id }, data })
      return { data: shop }
    },
  )
}
```

- [ ] **Step 4: Register the routes**

Edit `src/apps/api/src/routes/index.ts`:

```ts
import type { FastifyInstance } from 'fastify'
import { barbershopRoutes } from './barbershops'
import { healthRoute } from './health'

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoute, { prefix: '/api' })
  await app.register(barbershopRoutes, { prefix: '/api' })
}
```

- [ ] **Step 5: Run the full API suite**

Run: `pnpm --filter=@barber/api test`
Expected: PASS — all suites (health, errors, auth, tenant, slug, barbershops) green.

- [ ] **Step 6: Commit**

```bash
git add src/apps/api/src/routes/barbershops.ts src/apps/api/src/routes/index.ts src/apps/api/tests/barbershops.test.ts
git commit -m "feat: add barbershop CRUD endpoints"
```

---

# Phase 2 — Design system (`@barber/ui`)

> These primitives are declarative; there are no unit tests here. Each task verifies with `pnpm --filter=@barber/ui build` (tsc `--noEmit`). The end-to-end smoke test lives in the web app (Task 22). Components are written React-19 style (ref-as-prop, no `forwardRef`).

## Task 8: UI deps, `cn`, Tailwind preset, exports map

**Files:**
- Modify: `src/packages/ui/package.json`
- Create: `src/packages/ui/src/lib/utils.ts`
- Create: `src/packages/ui/tailwind-preset.ts`

- [ ] **Step 1: Rewrite `package.json`**

Replace `src/packages/ui/package.json` with:

```json
{
  "name": "@barber/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./tailwind-preset": "./tailwind-preset.ts"
  },
  "scripts": {
    "build": "tsc --noEmit",
    "lint": "biome check src",
    "lint:fix": "biome check --write src"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^1.16.0",
    "next-themes": "^0.4.0",
    "sonner": "^1.7.0",
    "tailwind-merge": "^2.5.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "peerDependencies": {
    "react": "^18 || ^19",
    "react-dom": "^18 || ^19",
    "react-hook-form": "^7.50.0"
  },
  "devDependencies": {
    "@barber/config": "workspace:*",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "react-hook-form": "^7.50.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.7.0"
  }
}
```

Run: `pnpm install`

- [ ] **Step 2: Create `cn`**

Create `src/packages/ui/src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Create the Tailwind preset**

Create `src/packages/ui/tailwind-preset.ts`:

```ts
import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const preset: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [animate],
}

export default preset
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter=@barber/ui build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/packages/ui/package.json src/packages/ui/src/lib/utils.ts src/packages/ui/tailwind-preset.ts pnpm-lock.yaml
git commit -m "feat: add ui deps, cn helper, and tailwind theme preset"
```

---

## Task 9: Base primitives (button, input, textarea, label, card, skeleton)

**Files:**
- Create: `src/packages/ui/src/components/ui/button.tsx`
- Create: `src/packages/ui/src/components/ui/input.tsx`
- Create: `src/packages/ui/src/components/ui/textarea.tsx`
- Create: `src/packages/ui/src/components/ui/label.tsx`
- Create: `src/packages/ui/src/components/ui/card.tsx`
- Create: `src/packages/ui/src/components/ui/skeleton.tsx`

- [ ] **Step 1: button.tsx**

```tsx
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
```

- [ ] **Step 2: input.tsx**

```tsx
import type * as React from 'react'
import { cn } from '../../lib/utils'

export function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 3: textarea.tsx**

```tsx
import type * as React from 'react'
import { cn } from '../../lib/utils'

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 4: label.tsx**

```tsx
'use client'

import * as LabelPrimitive from '@radix-ui/react-label'
import type * as React from 'react'
import { cn } from '../../lib/utils'

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 5: card.tsx**

```tsx
import type * as React from 'react'
import { cn } from '../../lib/utils'

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-sm text-muted-foreground', className)} {...props} />
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
```

- [ ] **Step 6: skeleton.tsx**

```tsx
import type * as React from 'react'
import { cn } from '../../lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
}
```

- [ ] **Step 7: Commit** (typecheck happens in Task 11 once everything is exported)

```bash
git add src/packages/ui/src/components/ui/button.tsx src/packages/ui/src/components/ui/input.tsx src/packages/ui/src/components/ui/textarea.tsx src/packages/ui/src/components/ui/label.tsx src/packages/ui/src/components/ui/card.tsx src/packages/ui/src/components/ui/skeleton.tsx
git commit -m "feat: add ui base primitives"
```

---

## Task 10: Overlay primitives (dialog, dropdown-menu)

**Files:**
- Create: `src/packages/ui/src/components/ui/dialog.tsx`
- Create: `src/packages/ui/src/components/ui/dropdown-menu.tsx`

- [ ] **Step 1: dialog.tsx**

```tsx
'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type * as React from 'react'
import { cn } from '../../lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
  )
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
```

- [ ] **Step 2: dropdown-menu.tsx**

```tsx
'use client'

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import type * as React from 'react'
import { cn } from '../../lib/utils'

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      />
    </DropdownMenuPortal>
  )
}

function DropdownMenuItem({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}
```

- [ ] **Step 3: Commit**

```bash
git add src/packages/ui/src/components/ui/dialog.tsx src/packages/ui/src/components/ui/dropdown-menu.tsx
git commit -m "feat: add ui dialog and dropdown-menu primitives"
```

---

## Task 11: Form + toaster + barrel exports

**Files:**
- Create: `src/packages/ui/src/components/ui/form.tsx`
- Create: `src/packages/ui/src/components/ui/sonner.tsx`
- Modify: `src/packages/ui/src/index.ts`
- Delete: `src/packages/ui/src/components/Button.tsx`

- [ ] **Step 1: form.tsx**

```tsx
'use client'

import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form'
import { cn } from '../../lib/utils'
import { Label } from './label'

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = { name: TName }

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

type FormItemContextValue = { id: string }
const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) throw new Error('useFormField must be used within <FormField>')

  const { id } = itemContext
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const id = React.useId()
  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  )
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()
  return <Label className={cn(error && 'text-destructive', className)} htmlFor={formItemId} {...props} />
}

function FormControl(props: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  return (
    <Slot
      id={formItemId}
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { formDescriptionId } = useFormField()
  return (
    <p id={formDescriptionId} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
}

function FormMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? '') : children
  if (!body) return null
  return (
    <p
      id={formMessageId}
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
}
```

- [ ] **Step 2: sonner.tsx**

```tsx
'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  const { theme = 'system' } = useTheme()
  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

export { toast } from 'sonner'
```

- [ ] **Step 3: Delete the old Button and rewrite the barrel**

Delete `src/packages/ui/src/components/Button.tsx` (replaced by the themed `components/ui/button.tsx`; nothing imports the old one yet).

Run: `git rm src/packages/ui/src/components/Button.tsx`

Replace `src/packages/ui/src/index.ts` with:

```ts
export { cn } from './lib/utils'
export { Button, buttonVariants, type ButtonProps } from './components/ui/button'
export { Input } from './components/ui/input'
export { Textarea } from './components/ui/textarea'
export { Label } from './components/ui/label'
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/card'
export { Skeleton } from './components/ui/skeleton'
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog'
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu'
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from './components/ui/form'
export { Toaster, toast } from './components/ui/sonner'
```

- [ ] **Step 4: Typecheck the whole package**

Run: `pnpm --filter=@barber/ui build`
Expected: exits 0 (all primitives + form + toaster typecheck).

- [ ] **Step 5: Commit**

```bash
git add src/packages/ui/src
git commit -m "feat: add ui form and toaster, replace legacy Button, export design system"
```

---

# Phase 3 — Web data layer + theme (`@barber/web`)

## Task 12: Web deps + vitest setup

**Files:**
- Modify: `src/apps/web/package.json`
- Create: `src/apps/web/vitest.config.ts`
- Create: `src/apps/web/vitest.setup.ts`

- [ ] **Step 1: Add deps**

Edit `src/apps/web/package.json`. Set `dependencies` and `devDependencies` to:

```json
  "dependencies": {
    "@barber/types": "workspace:*",
    "@barber/ui": "workspace:*",
    "@hookform/resolvers": "^3.10.0",
    "@tanstack/react-query": "^5.0.0",
    "better-auth": "^1.0.0",
    "lucide-react": "^1.16.0",
    "next": "^15.0.0",
    "next-themes": "^0.4.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.50.0",
    "sonner": "^1.7.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@barber/config": "workspace:*",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
```

Run: `pnpm install`

- [ ] **Step 2: Create vitest config**

Create `src/apps/web/vitest.config.ts`:

```ts
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(process.cwd(), './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

- [ ] **Step 3: Create vitest setup**

Create `src/apps/web/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 4: Commit**

```bash
git add src/apps/web/package.json src/apps/web/vitest.config.ts src/apps/web/vitest.setup.ts pnpm-lock.yaml
git commit -m "test: add web data deps and vitest + RTL setup"
```

---

## Task 13: Theme — Tailwind preset, tokens, providers

**Files:**
- Modify: `src/apps/web/tailwind.config.ts`
- Modify: `src/apps/web/src/app/globals.css`
- Create: `src/apps/web/src/components/providers.tsx`
- Modify: `src/apps/web/src/app/layout.tsx`

- [ ] **Step 1: Consume the preset**

Replace `src/apps/web/tailwind.config.ts`:

```ts
import preset from '@barber/ui/tailwind-preset'
import type { Config } from 'tailwindcss'

const config: Config = {
  presets: [preset],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
}

export default config
```

- [ ] **Step 2: Define theme tokens**

Replace `src/apps/web/src/app/globals.css` with the warm barber palette (amber/copper accent, larger radius), light + dark:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --sidebar-width: 15rem;

    --background: 40 30% 98%;
    --foreground: 24 10% 10%;
    --card: 0 0% 100%;
    --card-foreground: 24 10% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 24 10% 10%;
    --primary: 28 80% 45%;
    --primary-foreground: 40 40% 98%;
    --secondary: 30 20% 94%;
    --secondary-foreground: 24 10% 18%;
    --muted: 30 20% 94%;
    --muted-foreground: 24 6% 45%;
    --accent: 32 60% 90%;
    --accent-foreground: 24 30% 20%;
    --destructive: 0 72% 50%;
    --destructive-foreground: 0 0% 98%;
    --border: 30 15% 88%;
    --input: 30 15% 88%;
    --ring: 28 80% 45%;
    --radius: 0.65rem;
  }

  .dark {
    --background: 24 10% 8%;
    --foreground: 40 20% 96%;
    --card: 24 10% 11%;
    --card-foreground: 40 20% 96%;
    --popover: 24 10% 11%;
    --popover-foreground: 40 20% 96%;
    --primary: 30 85% 55%;
    --primary-foreground: 24 30% 10%;
    --secondary: 24 8% 18%;
    --secondary-foreground: 40 20% 96%;
    --muted: 24 8% 18%;
    --muted-foreground: 30 10% 65%;
    --accent: 26 30% 22%;
    --accent-foreground: 40 20% 96%;
    --destructive: 0 62% 45%;
    --destructive-foreground: 0 0% 98%;
    --border: 24 8% 20%;
    --input: 24 8% 22%;
    --ring: 30 85% 55%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }

  ::selection {
    @apply bg-primary text-primary-foreground;
  }
}
```

- [ ] **Step 3: Create Providers**

Create `src/apps/web/src/components/providers.tsx`:

```tsx
'use client'

import { Toaster } from '@barber/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
```

- [ ] **Step 4: Mount Providers in the root layout**

Replace `src/apps/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'BarberSaaS',
    template: '%s | BarberSaaS',
  },
  description: 'Plataforma de gestão para barbearias',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter=@barber/web exec tsc --noEmit`
Expected: exits 0. (Visual verification of the theme happens in Task 22 via the dev server.)

- [ ] **Step 6: Commit**

```bash
git add src/apps/web/tailwind.config.ts src/apps/web/src/app/globals.css src/apps/web/src/components/providers.tsx src/apps/web/src/app/layout.tsx
git commit -m "feat: wire warm theme tokens and app providers into web"
```

---

## Task 14: Active-barbershop cookie util (TDD)

**Files:**
- Create: `src/apps/web/src/lib/tenant.ts`
- Test: `src/apps/web/src/lib/__tests__/tenant.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/apps/web/src/lib/__tests__/tenant.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = new Map<string, { value: string }>()
const mockCookies = {
  get: (key: string) => store.get(key),
  set: (key: string, value: string) => store.set(key, { value }),
}
vi.mock('next/headers', () => ({ cookies: async () => mockCookies }))

import { getActiveBarbershopId, setActiveBarbershopId } from '../tenant'

beforeEach(() => store.clear())

describe('active barbershop cookie', () => {
  it('returns null when unset', async () => {
    expect(await getActiveBarbershopId()).toBeNull()
  })

  it('round-trips the id', async () => {
    await setActiveBarbershopId('shop-1')
    expect(await getActiveBarbershopId()).toBe('shop-1')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter=@barber/web test tenant`
Expected: FAIL — module `../tenant` not found.

- [ ] **Step 3: Implement the util**

Create `src/apps/web/src/lib/tenant.ts`:

```ts
import { cookies } from 'next/headers'

export const ACTIVE_BARBERSHOP_COOKIE = 'active-barbershop'

export async function getActiveBarbershopId(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACTIVE_BARBERSHOP_COOKIE)?.value ?? null
}

export async function setActiveBarbershopId(id: string): Promise<void> {
  const store = await cookies()
  store.set(ACTIVE_BARBERSHOP_COOKIE, id, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
}
```

> Note: the cookie is intentionally **not** `httpOnly` so the client `shop-switcher` can detect whether a default needs persisting (see Task 18).

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter=@barber/web test tenant`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/apps/web/src/lib/tenant.ts src/apps/web/src/lib/__tests__/tenant.test.ts
git commit -m "feat: add active-barbershop cookie util"
```

---

## Task 15: Server `apiFetch` (TDD)

**Files:**
- Create: `src/apps/web/src/lib/api/server.ts`
- Test: `src/apps/web/src/lib/api/__tests__/server.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/apps/web/src/lib/api/__tests__/server.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

const cookieStore = {
  toString: () => 'better-auth.session_token=abc',
  get: (key: string) => (key === 'active-barbershop' ? { value: 'shop-1' } : undefined),
}
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))

import { ApiFetchError, apiFetch } from '../server'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

afterEach(() => fetchMock.mockReset())

describe('apiFetch', () => {
  it('forwards the cookie + X-Barbershop-Id and unwraps { data }', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { id: 'shop-1' } }), { status: 200 }),
    )
    const result = await apiFetch('/barbershops/shop-1')
    expect(result).toEqual({ id: 'shop-1' })

    const [, init] = fetchMock.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get('cookie')).toContain('session_token')
    expect(headers.get('x-barbershop-id')).toBe('shop-1')
  })

  it('throws ApiFetchError on non-2xx', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'nope', statusCode: 403 }), { status: 403 }),
    )
    await expect(apiFetch('/barbershops/x')).rejects.toThrowError(ApiFetchError)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter=@barber/web test server`
Expected: FAIL — module `../server` not found.

- [ ] **Step 3: Implement `apiFetch`**

Create `src/apps/web/src/lib/api/server.ts`:

```ts
import { cookies } from 'next/headers'

const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export class ApiFetchError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ApiFetchError'
    this.statusCode = statusCode
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies()
  const headers = new Headers(init?.headers)
  headers.set('cookie', cookieStore.toString())

  const activeShop = cookieStore.get('active-barbershop')?.value
  if (activeShop) headers.set('x-barbershop-id', activeShop)
  if (init?.body && !headers.has('content-type')) headers.set('content-type', 'application/json')

  const res = await fetch(`${API_URL}/api${path}`, { ...init, headers, cache: 'no-store' })
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiFetchError(res.status, json?.message ?? 'Erro na requisição')
  }
  return (json?.data ?? json) as T
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter=@barber/web test server`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add src/apps/web/src/lib/api/server.ts src/apps/web/src/lib/api/__tests__/server.test.ts
git commit -m "feat: add server-side apiFetch with cookie and tenant injection"
```

---

## Task 16: Browser `apiClient` + BFF proxy route

**Files:**
- Create: `src/apps/web/src/lib/api/client.ts`
- Create: `src/apps/web/src/app/api/bff/[...path]/route.ts`

- [ ] **Step 1: Create `apiClient`**

Create `src/apps/web/src/lib/api/client.ts`:

```ts
export class ApiClientError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ApiClientError'
    this.statusCode = statusCode
  }
}

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('content-type')) headers.set('content-type', 'application/json')

  const res = await fetch(`/api/bff${path}`, { ...init, headers })
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiClientError(res.status, json?.message ?? 'Erro na requisição')
  }
  return (json?.data ?? json) as T
}
```

- [ ] **Step 2: Create the BFF proxy**

Create `src/apps/web/src/app/api/bff/[...path]/route.ts`. It forwards the browser's session cookie (already on the same-origin request) to Fastify and injects `X-Barbershop-Id` from the active-shop cookie:

```ts
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const url = `${API_URL}/api/${path.join('/')}${req.nextUrl.search}`

  const headers = new Headers(req.headers)
  headers.delete('host')

  const cookieStore = await cookies()
  const activeShop = cookieStore.get('active-barbershop')?.value
  if (activeShop) headers.set('x-barbershop-id', activeShop)

  const res = await fetch(url, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
  })

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  })
}

export const GET = proxy
export const POST = proxy
export const PATCH = proxy
export const PUT = proxy
export const DELETE = proxy
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter=@barber/web exec tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/apps/web/src/lib/api/client.ts src/apps/web/src/app/api/bff
git commit -m "feat: add browser apiClient and BFF proxy route"
```

---

## Task 17: Barbershop data layer (queries, actions, hooks)

**Files:**
- Create: `src/apps/web/src/lib/barbershops/queries.ts`
- Create: `src/apps/web/src/lib/barbershops/actions.ts`
- Create: `src/apps/web/src/lib/barbershops/hooks.ts`

- [ ] **Step 1: Server queries (RSC)**

Create `src/apps/web/src/lib/barbershops/queries.ts`:

```ts
import 'server-only'
import type { Barbershop } from '@barber/types'
import { apiFetch } from '@/lib/api/server'

export function listBarbershops() {
  return apiFetch<Barbershop[]>('/barbershops')
}

export function getBarbershop(id: string) {
  return apiFetch<Barbershop>(`/barbershops/${id}`)
}
```

- [ ] **Step 2: Server actions (mutations)**

Create `src/apps/web/src/lib/barbershops/actions.ts`:

```ts
'use server'

import type { Barbershop, CreateBarbershopInput, UpdateBarbershopInput } from '@barber/types'
import { revalidatePath } from 'next/cache'
import { apiFetch } from '@/lib/api/server'
import { setActiveBarbershopId } from '@/lib/tenant'

export async function createBarbershopAction(input: CreateBarbershopInput): Promise<Barbershop> {
  const shop = await apiFetch<Barbershop>('/barbershops', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  await setActiveBarbershopId(shop.id)
  revalidatePath('/', 'layout')
  return shop
}

export async function updateBarbershopAction(
  id: string,
  input: UpdateBarbershopInput,
): Promise<Barbershop> {
  const shop = await apiFetch<Barbershop>(`/barbershops/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  revalidatePath('/settings')
  revalidatePath('/', 'layout')
  return shop
}

export async function setActiveBarbershopAction(id: string): Promise<void> {
  await setActiveBarbershopId(id)
  revalidatePath('/', 'layout')
}
```

- [ ] **Step 3: Client hook (TanStack Query)**

Create `src/apps/web/src/lib/barbershops/hooks.ts`:

```ts
'use client'

import type { Barbershop } from '@barber/types'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

export function useBarbershops() {
  return useQuery({
    queryKey: ['barbershops'],
    queryFn: () => apiClient<Barbershop[]>('/barbershops'),
  })
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter=@barber/web exec tsc --noEmit`
Expected: exits 0. (`server-only` is provided transitively by Next; if tsc complains it cannot find it, add `server-only` to web `devDependencies` and re-run `pnpm install`.)

- [ ] **Step 5: Commit**

```bash
git add src/apps/web/src/lib/barbershops
git commit -m "feat: add barbershop queries, server actions, and query hook"
```

---

# Phase 4 — Web UI (`@barber/web`)

## Task 18: App shell (switcher, user menu, theme toggle, sidebar, topbar)

**Files:**
- Create: `src/apps/web/src/components/theme-toggle.tsx`
- Create: `src/apps/web/src/components/user-menu.tsx`
- Create: `src/apps/web/src/components/create-shop-dialog.tsx`
- Create: `src/apps/web/src/components/shop-switcher.tsx`
- Rewrite: `src/apps/web/src/components/sidebar.tsx`
- Rewrite: `src/apps/web/src/components/topbar.tsx`
- Test: `src/apps/web/src/components/__tests__/shop-switcher.test.tsx`

- [ ] **Step 1: theme-toggle.tsx**

```tsx
'use client'

import { Button } from '@barber/ui'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Alternar tema"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

- [ ] **Step 2: user-menu.tsx**

```tsx
'use client'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@barber/ui'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter()
  const initial = name.charAt(0).toUpperCase() || 'U'

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-start gap-3 px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initial}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">{email}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 3: create-shop-dialog.tsx**

```tsx
'use client'

import { type CreateBarbershopInput, createBarbershopSchema } from '@barber/types'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  toast,
} from '@barber/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { createBarbershopAction } from '@/lib/barbershops/actions'

export function CreateShopDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const form = useForm<CreateBarbershopInput>({
    resolver: zodResolver(createBarbershopSchema),
    defaultValues: { name: '', address: '', phone: '', description: '' },
  })

  function onSubmit(values: CreateBarbershopInput) {
    startTransition(async () => {
      try {
        await createBarbershopAction(values)
        toast.success('Barbearia criada!')
        form.reset()
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao criar barbearia')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova barbearia</DialogTitle>
          <DialogDescription>Crie uma barbearia para começar a gerenciar.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Barbearia do Zé" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua das Flores, 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="11999999999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? 'Criando…' : 'Criar barbearia'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: shop-switcher.tsx**

```tsx
'use client'

import type { Barbershop } from '@barber/types'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@barber/ui'
import { Check, ChevronsUpDown, Plus, Store } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { setActiveBarbershopAction } from '@/lib/barbershops/actions'
import { ACTIVE_BARBERSHOP_COOKIE } from '@/lib/tenant'
import { CreateShopDialog } from './create-shop-dialog'

function hasActiveCookie() {
  if (typeof document === 'undefined') return true
  return document.cookie.split('; ').some((c) => c.startsWith(`${ACTIVE_BARBERSHOP_COOKIE}=`))
}

export function ShopSwitcher({
  shops,
  activeId,
}: {
  shops: Barbershop[]
  activeId: string | null
}) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [, startTransition] = useTransition()

  // The dashboard layout defaults activeId but cannot write cookies during render; persist it here.
  useEffect(() => {
    if (activeId && !hasActiveCookie()) {
      startTransition(async () => {
        await setActiveBarbershopAction(activeId)
        router.refresh()
      })
    }
  }, [activeId, router])

  const active = shops.find((s) => s.id === activeId) ?? null

  function selectShop(id: string) {
    if (id === activeId) return
    startTransition(async () => {
      await setActiveBarbershopAction(id)
      router.refresh()
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between gap-2"
            aria-label="Trocar de barbearia"
          >
            <span className="flex items-center gap-2 truncate">
              <Store className="h-4 w-4 shrink-0" />
              <span className="truncate">{active?.name ?? 'Selecione...'}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" align="start">
          <DropdownMenuLabel>Barbearias</DropdownMenuLabel>
          {shops.map((shop) => (
            <DropdownMenuItem key={shop.id} onSelect={() => selectShop(shop.id)}>
              <Store className="h-4 w-4" />
              <span className="truncate">{shop.name}</span>
              {shop.id === activeId && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          {shops.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhuma barbearia</p>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova barbearia
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateShopDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
```

- [ ] **Step 5: Rewrite sidebar.tsx**

```tsx
'use client'

import type { Barbershop } from '@barber/types'
import { cn } from '@barber/ui'
import { CalendarDays, LayoutDashboard, Scissors, Settings, Tag, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShopSwitcher } from './shop-switcher'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/appointments', label: 'Agendamentos', icon: CalendarDays },
  { href: '/barbers', label: 'Barbeiros', icon: Scissors },
  { href: '/services', label: 'Serviços', icon: Tag },
  { href: '/customers', label: 'Clientes', icon: Users },
]

export function Sidebar({
  shops,
  activeId,
  user,
}: {
  shops: Barbershop[]
  activeId: string | null
  user: { name: string; email: string }
}) {
  const pathname = usePathname()
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    )

  return (
    <aside className="flex h-screen w-[var(--sidebar-width)] shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary">
            <Scissors className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold">BarberSaaS</span>
        </Link>
      </div>

      <div className="border-b p-2">
        <ShopSwitcher shops={shops} activeId={activeId} />
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label="Navegação principal">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={linkClass(active)}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-1 border-t p-2">
        <Link
          href="/settings"
          aria-current={isActive('/settings') ? 'page' : undefined}
          className={linkClass(isActive('/settings'))}
        >
          <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
          Configurações
        </Link>
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
            <UserMenu name={user.name} email={user.email} />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 6: Rewrite topbar.tsx**

```tsx
interface TopbarProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function Topbar({ title, description, actions }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold">{title}</h1>
        {description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="ml-4 flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
```

- [ ] **Step 7: Add radix-in-jsdom polyfills to the test setup**

Radix dropdown/dialog need a few DOM APIs jsdom lacks. Append to `src/apps/web/vitest.setup.ts`:

```ts
import { vi } from 'vitest'

if (!window.HTMLElement.prototype.hasPointerCapture) {
  window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.setPointerCapture = vi.fn()
}
window.HTMLElement.prototype.scrollIntoView = vi.fn()
```

- [ ] **Step 8: Write the switcher test**

Create `src/apps/web/src/components/__tests__/shop-switcher.test.tsx`:

```tsx
import type { Barbershop } from '@barber/types'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const setActive = vi.fn()
vi.mock('@/lib/barbershops/actions', () => ({
  setActiveBarbershopAction: (...args: unknown[]) => setActive(...args),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

import { ShopSwitcher } from '../shop-switcher'

function makeShop(id: string, name: string): Barbershop {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    description: null,
    address: 'a',
    phone: 'p',
    logoUrl: null,
    ownerId: 'o',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  }
}

beforeEach(() => {
  setActive.mockReset()
  document.cookie = 'active-barbershop=shop-1'
})

describe('ShopSwitcher', () => {
  it('shows the active shop and switches on select', async () => {
    const user = userEvent.setup()
    render(
      <ShopSwitcher
        shops={[makeShop('shop-1', 'Alpha'), makeShop('shop-2', 'Beta')]}
        activeId="shop-1"
      />,
    )

    const trigger = screen.getByRole('button', { name: /trocar de barbearia/i })
    expect(trigger).toHaveTextContent('Alpha')

    await user.click(trigger)
    await user.click(await screen.findByText('Beta'))

    expect(setActive).toHaveBeenCalledWith('shop-2')
  })
})
```

- [ ] **Step 9: Run the switcher test**

Run: `pnpm --filter=@barber/web test shop-switcher`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/apps/web/src/components src/apps/web/vitest.setup.ts
git commit -m "feat: rebuild app shell with shop switcher, user menu, and theme toggle"
```

---

## Task 19: Dashboard layout + placeholder pages

**Files:**
- Create: `src/apps/web/src/lib/session.ts`
- Create: `src/apps/web/src/components/page-placeholder.tsx`
- Rewrite: `src/apps/web/src/app/(dashboard)/layout.tsx`
- Rewrite: `src/apps/web/src/app/(dashboard)/dashboard/page.tsx`
- Rewrite: `src/apps/web/src/app/(dashboard)/appointments/page.tsx`
- Rewrite: `src/apps/web/src/app/(dashboard)/barbers/page.tsx`
- Rewrite: `src/apps/web/src/app/(dashboard)/services/page.tsx`
- Rewrite: `src/apps/web/src/app/(dashboard)/customers/page.tsx`

- [ ] **Step 1: Server session helper**

Create `src/apps/web/src/lib/session.ts`. It reads the better-auth session through the API's auth endpoint (proxied), so the web never needs DB access:

```ts
import { cookies } from 'next/headers'

const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface SessionUser {
  id: string
  name: string
  email: string
}

export async function getServerSession(): Promise<{ user: SessionUser } | null> {
  const cookieStore = await cookies()
  const res = await fetch(`${API_URL}/api/auth/get-session`, {
    headers: { cookie: cookieStore.toString() },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  return data?.user ? { user: data.user } : null
}
```

- [ ] **Step 2: Placeholder component**

Create `src/apps/web/src/components/page-placeholder.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react'
import { Topbar } from '@/components/topbar'

export function PagePlaceholder({
  title,
  description,
  icon: Icon,
  message,
}: {
  title: string
  description: string
  icon: LucideIcon
  message: string
}) {
  return (
    <>
      <Topbar title={title} description={description} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-medium">{message}</p>
          <p className="mt-1 text-xs text-muted-foreground">Em breve nesta seção.</p>
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 3: Dashboard layout**

Replace `src/apps/web/src/app/(dashboard)/layout.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { listBarbershops } from '@/lib/barbershops/queries'
import { getServerSession } from '@/lib/session'
import { getActiveBarbershopId } from '@/lib/tenant'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const shops = await listBarbershops()
  const cookieActive = await getActiveBarbershopId()
  const activeId = cookieActive ?? shops[0]?.id ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar shops={shops} activeId={activeId} user={session.user} />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  )
}
```

- [ ] **Step 4: Dashboard page**

Replace `src/apps/web/src/app/(dashboard)/dashboard/page.tsx`:

```tsx
import { LayoutDashboard } from 'lucide-react'
import { PagePlaceholder } from '@/components/page-placeholder'

export default function DashboardPage() {
  return (
    <PagePlaceholder
      title="Dashboard"
      description="Visão geral da sua barbearia"
      icon={LayoutDashboard}
      message="Suas métricas aparecerão aqui"
    />
  )
}
```

- [ ] **Step 5: Appointments page**

Replace `src/apps/web/src/app/(dashboard)/appointments/page.tsx`:

```tsx
import { CalendarDays } from 'lucide-react'
import { PagePlaceholder } from '@/components/page-placeholder'

export default function AppointmentsPage() {
  return (
    <PagePlaceholder
      title="Agendamentos"
      description="Gerencie os horários da sua barbearia"
      icon={CalendarDays}
      message="Seus agendamentos aparecerão aqui"
    />
  )
}
```

- [ ] **Step 6: Barbers page**

Replace `src/apps/web/src/app/(dashboard)/barbers/page.tsx`:

```tsx
import { Scissors } from 'lucide-react'
import { PagePlaceholder } from '@/components/page-placeholder'

export default function BarbersPage() {
  return (
    <PagePlaceholder
      title="Barbeiros"
      description="Gerencie a sua equipe"
      icon={Scissors}
      message="Sua equipe aparecerá aqui"
    />
  )
}
```

- [ ] **Step 7: Services page**

Replace `src/apps/web/src/app/(dashboard)/services/page.tsx`:

```tsx
import { Tag } from 'lucide-react'
import { PagePlaceholder } from '@/components/page-placeholder'

export default function ServicesPage() {
  return (
    <PagePlaceholder
      title="Serviços"
      description="Gerencie os serviços oferecidos"
      icon={Tag}
      message="Seus serviços aparecerão aqui"
    />
  )
}
```

- [ ] **Step 8: Customers page**

Replace `src/apps/web/src/app/(dashboard)/customers/page.tsx`:

```tsx
import { Users } from 'lucide-react'
import { PagePlaceholder } from '@/components/page-placeholder'

export default function CustomersPage() {
  return (
    <PagePlaceholder
      title="Clientes"
      description="Veja a sua base de clientes"
      icon={Users}
      message="Seus clientes aparecerão aqui"
    />
  )
}
```

- [ ] **Step 9: Typecheck**

Run: `pnpm --filter=@barber/web exec tsc --noEmit`
Expected: exits 0.

- [ ] **Step 10: Commit**

```bash
git add src/apps/web/src/lib/session.ts src/apps/web/src/components/page-placeholder.tsx "src/apps/web/src/app/(dashboard)"
git commit -m "feat: wire dashboard shell layout and redesigned placeholder pages"
```

---

## Task 20: Settings page (wired profile form, TDD on the form)

**Files:**
- Create: `src/apps/web/src/app/(dashboard)/settings/settings-form.tsx`
- Rewrite: `src/apps/web/src/app/(dashboard)/settings/page.tsx`
- Test: `src/apps/web/src/app/(dashboard)/settings/__tests__/settings-form.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/apps/web/src/app/(dashboard)/settings/__tests__/settings-form.test.tsx`:

```tsx
import type { Barbershop } from '@barber/types'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const updateAction = vi.fn()
vi.mock('@/lib/barbershops/actions', () => ({
  updateBarbershopAction: (...args: unknown[]) => updateAction(...args),
}))

import { SettingsForm } from '../settings-form'

const shop: Barbershop = {
  id: 'shop-1',
  name: 'Barbearia Teste',
  slug: 'barbearia-teste',
  description: null,
  address: 'Rua Teste, 123',
  phone: '11999999999',
  logoUrl: null,
  ownerId: 'owner-1',
  isActive: true,
  createdAt: '',
  updatedAt: '',
}

beforeEach(() => updateAction.mockReset())

describe('SettingsForm', () => {
  it('blocks submit and shows an error for an invalid slug', async () => {
    const user = userEvent.setup()
    render(<SettingsForm shop={shop} />)

    const slug = screen.getByLabelText('Slug (URL pública)')
    await user.clear(slug)
    await user.type(slug, 'Com Espaco Invalido')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(await screen.findByText('Slug inválido')).toBeInTheDocument()
    expect(updateAction).not.toHaveBeenCalled()
  })

  it('submits valid changes', async () => {
    updateAction.mockResolvedValueOnce(shop)
    const user = userEvent.setup()
    render(<SettingsForm shop={shop} />)

    const name = screen.getByLabelText('Nome')
    await user.clear(name)
    await user.type(name, 'Novo Nome')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await vi.waitFor(() =>
      expect(updateAction).toHaveBeenCalledWith('shop-1', expect.objectContaining({ name: 'Novo Nome' })),
    )
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter=@barber/web test settings-form`
Expected: FAIL — module `../settings-form` not found.

- [ ] **Step 3: Implement the form**

Create `src/apps/web/src/app/(dashboard)/settings/settings-form.tsx`:

```tsx
'use client'

import { type Barbershop, type UpdateBarbershopInput, updateBarbershopSchema } from '@barber/types'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  toast,
} from '@barber/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { updateBarbershopAction } from '@/lib/barbershops/actions'

export function SettingsForm({ shop }: { shop: Barbershop }) {
  const [pending, startTransition] = useTransition()
  const form = useForm<UpdateBarbershopInput>({
    resolver: zodResolver(updateBarbershopSchema),
    defaultValues: {
      name: shop.name,
      slug: shop.slug,
      description: shop.description ?? '',
      address: shop.address,
      phone: shop.phone,
    },
  })

  function onSubmit(values: UpdateBarbershopInput) {
    startTransition(async () => {
      try {
        await updateBarbershopAction(shop.id, values)
        toast.success('Alterações salvas!')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil da barbearia</CardTitle>
        <CardDescription>Estas informações aparecem na sua página pública.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL pública)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormDescription>Apenas letras minúsculas, números e hífens.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter=@barber/web test settings-form`
Expected: PASS (both cases).

- [ ] **Step 5: Implement the settings page**

Replace `src/apps/web/src/app/(dashboard)/settings/page.tsx`:

```tsx
import { Building2 } from 'lucide-react'
import { Topbar } from '@/components/topbar'
import { getBarbershop, listBarbershops } from '@/lib/barbershops/queries'
import { getActiveBarbershopId } from '@/lib/tenant'
import { SettingsForm } from './settings-form'

export const metadata = { title: 'Configurações' }

export default async function SettingsPage() {
  const shops = await listBarbershops()
  const activeId = (await getActiveBarbershopId()) ?? shops[0]?.id ?? null

  if (!activeId) {
    return (
      <>
        <Topbar title="Configurações" description="Gerencie a sua barbearia" />
        <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium">Você ainda não tem uma barbearia</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Crie uma pelo seletor na barra lateral.
          </p>
        </main>
      </>
    )
  }

  const shop = await getBarbershop(activeId)

  return (
    <>
      <Topbar title="Configurações" description="Gerencie o perfil da sua barbearia" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          <SettingsForm shop={shop} />
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add "src/apps/web/src/app/(dashboard)/settings"
git commit -m "feat: add fully wired barbershop settings page"
```

---

## Task 21: Redesigned auth pages

**Files:**
- Rewrite: `src/apps/web/src/app/(auth)/login/page.tsx`
- Rewrite: `src/apps/web/src/app/(auth)/register/page.tsx`
- Rewrite: `src/apps/web/src/app/(auth)/layout.tsx`

- [ ] **Step 1: Login page**

Replace `src/apps/web/src/app/(auth)/login/page.tsx`:

```tsx
'use client'

import { Button, Input, Label } from '@barber/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const { error } = await authClient.signIn.email({
      email: form.get('email') as string,
      password: form.get('password') as string,
      callbackURL: '/dashboard',
    })

    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Bem-vindo de volta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entre na sua conta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="voce@exemplo.com" required />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
              Esqueceu a senha?
            </Link>
          </div>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Cadastre-se
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 2: Register page**

Replace `src/apps/web/src/app/(auth)/register/page.tsx`:

```tsx
'use client'

import { Button, Input, Label } from '@barber/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const { error } = await authClient.signUp.email({
      name: form.get('name') as string,
      email: form.get('email') as string,
      password: form.get('password') as string,
      callbackURL: '/dashboard',
    })

    if (error) {
      setError(error.message ?? 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Criar conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Comece a gerenciar sua barbearia hoje</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" name="name" type="text" placeholder="João Silva" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="voce@exemplo.com" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Entrar
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 3: Auth layout**

Replace `src/apps/web/src/app/(auth)/layout.tsx`:

```tsx
import { Scissors } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col bg-primary p-10 text-primary-foreground lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary-foreground">
            <Scissors className="h-3.5 w-3.5 text-primary" />
          </span>
          <span className="text-sm font-semibold">BarberSaaS</span>
        </Link>

        <div className="flex flex-1 items-end pb-4">
          <blockquote className="space-y-3">
            <p className="text-xl font-medium leading-snug">
              &ldquo;Reduzi o tempo de gestão em 70% e aumentei o faturamento da minha
              barbearia.&rdquo;
            </p>
            <footer>
              <p className="text-sm font-semibold">Carlos Mendes</p>
              <p className="text-xs opacity-80">Dono · Barbearia Clássica, São Paulo</p>
            </footer>
          </blockquote>
        </div>

        <p className="text-xs opacity-70">© 2026 BarberSaaS</p>
      </div>

      <div className="flex flex-col items-center justify-center bg-background p-6 lg:p-10">
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary">
            <Scissors className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold">BarberSaaS</span>
        </Link>

        <div className="w-full max-w-sm rounded-xl border bg-card p-7 shadow-sm">{children}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter=@barber/web exec tsc --noEmit`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add "src/apps/web/src/app/(auth)"
git commit -m "feat: redesign login and register with the new design system"
```

---

## Task 22: Smoke test + full verification

**Files:**
- Test: `src/apps/web/src/__tests__/ui-smoke.test.tsx`

- [ ] **Step 1: UI smoke test**

Create `src/apps/web/src/__tests__/ui-smoke.test.tsx`:

```tsx
import { Button, Input } from '@barber/ui'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('ui smoke', () => {
  it('renders Button and Input from @barber/ui', () => {
    render(
      <>
        <Button>Salvar</Button>
        <Input aria-label="campo" defaultValue="x" />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
    expect(screen.getByLabelText('campo')).toHaveValue('x')
  })
})
```

- [ ] **Step 2: Run the full web test suite**

Run: `pnpm --filter=@barber/web test`
Expected: PASS — tenant, server, shop-switcher, settings-form, ui-smoke.

- [ ] **Step 3: Run the full API test suite**

Run: `pnpm --filter=@barber/api test`
Expected: PASS — all suites green.

- [ ] **Step 4: Lint + typecheck the whole repo**

Run: `pnpm check && pnpm --filter=@barber/ui build && pnpm --filter=@barber/types build && pnpm --filter=@barber/web exec tsc --noEmit && pnpm --filter=@barber/api exec tsc --noEmit`
Expected: all exit 0. Fix any Biome findings with `pnpm check:fix`.

- [ ] **Step 5: Manual end-to-end smoke (dev servers)**

Ensure infra is up: `docker compose up -d postgres redis`, then push the dev schema if needed: `pnpm db:push`. Start everything: `pnpm dev`.

Verify in a browser at http://localhost:3000:
1. Register a new account → lands on `/dashboard`. The new user is `CUSTOMER`; the shop switcher shows "Nenhuma barbearia".
2. Open the switcher → "Nova barbearia" → fill the form → submit. A toast confirms; the switcher now shows the new shop; the user is promoted to `OWNER` (verify via `pnpm db:studio` if desired).
3. Go to **Configurações** → edit the name + description → save → toast confirms. Reload: the values persist (proves write → API → DB → re-read).
4. Toggle light/dark via the theme button — the warm palette switches.
5. Sign out → redirected to `/login`. Log back in → back to `/dashboard`.

- [ ] **Step 6: Final commit**

```bash
git add src/apps/web/src/__tests__/ui-smoke.test.tsx
git commit -m "test: add web ui smoke test"
```

---

## Self-Review (completed during plan authoring)

**Spec coverage:**
- API conventions (zod validation, auth/role guards, tenant scoping, `ApiError`, `{ data }` envelope) → Tasks 3–5, 7.
- Barbershop endpoints (list/create/get/patch, slug, CUSTOMER→OWNER promotion, owner-only update) → Tasks 6–7.
- Shared zod schemas in `@barber/types` → Task 1.
- shadcn/ui design system + warm light/dark theme in `@barber/ui` → Tasks 8–11, 13.
- Data layer (BFF proxy + RSC `apiFetch` + TanStack Query) → Tasks 15–17.
- Active-shop cookie + shop switcher → Tasks 14, 18.
- Redesigned shell (sidebar + topbar) + login/register → Tasks 18, 21.
- Fully wired Settings page → Task 20.
- Testing strategy (API integration via `inject`; web via RTL) → throughout; full run in Task 22.

**Type consistency:** `ApiError`/`AuthUser`/`resolveMembership`/`apiFetch`/`Barbershop`/`CreateBarbershopInput`/`UpdateBarbershopInput`/`ACTIVE_BARBERSHOP_COOKIE` names are used identically across producer and consumer tasks.

**Open-risk resolutions (from the spec):**
- *shadcn in a monorepo*: primitives are hand-written into `@barber/ui` (no CLI); web consumes them via the package barrel and the theme via the `@barber/ui/tailwind-preset` subpath export (Tasks 8, 13).
- *Test database*: pinned to a dedicated `barber_test` DB; schema pushed as a one-time prerequisite; per-test truncation for isolation (Task 2).
- *Slug uniqueness is global*: `generateUniqueSlug` dedupes across all shops; PATCH guards slug collisions with a 409 (Tasks 6–7).



