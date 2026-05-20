# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SaaS platform for barber shops. Turborepo monorepo with two apps and four shared packages:

| Package | Name | Role |
|---|---|---|
| `src/apps/api` | `@barber/api` | Fastify REST API (port 3001) |
| `src/apps/web` | `@barber/web` | Next.js 15 frontend (port 3000) |
| `src/packages/database` | `@barber/database` | Prisma client + schema |
| `src/packages/types` | `@barber/types` | Shared TypeScript types |
| `src/packages/ui` | `@barber/ui` | Shared React components |
| `src/packages/config` | `@barber/config` | Shared tsconfig files |

Shared packages use the **internal package pattern** — their `main`/`types` fields point to source TypeScript. No build step needed; consuming apps compile them directly.

## Commands

```bash
# Dev (all apps in parallel)
pnpm dev

# Build
pnpm build

# Lint / format with Biome
pnpm lint          # turbo lint in all packages
pnpm check         # biome check on whole repo
pnpm check:fix     # biome check --write
pnpm format        # biome format --write .

# Tests
pnpm test
pnpm test:watch

# Target a single workspace
pnpm --filter=@barber/api test
pnpm --filter=@barber/api dev

# Database (Prisma)
pnpm db:generate   # prisma generate (run after schema changes)
pnpm db:push       # prisma db push (dev, no migration file)
pnpm db:migrate    # prisma migrate deploy (prod)
pnpm db:seed       # run prisma/seed.ts
pnpm db:studio     # prisma studio UI
```

## Infrastructure

Local dev requires PostgreSQL (port 5432) and Redis (port 6379). Start them with:

```bash
docker-compose up -d postgres redis
```

Copy `.env.example` to `.env` and fill in the required values before running. The API reads env vars via `src/env.ts` (Zod-validated at startup — missing vars will crash with a clear error).

## Architecture

**`apps/api`** (Fastify 5, Node 20):
- Entry: `src/index.ts` → `src/app.ts` (Fastify instance setup)
- Plugins registered in `app.ts`: cors, helmet, rate-limit, sensible
- Auth routes (`/api/auth/*`) delegated to `better-auth` handler in `src/auth.ts`
- Routes registered via `src/routes/index.ts`
- Build: `tsup` bundles to `dist/index.js` with all `@barber/*` deps inlined (`noExternal`)
- Dev: `tsx watch` (no compilation step)

**`apps/web`** (Next.js 15 App Router):
- `src/app/` — App Router pages and layouts
- Tailwind CSS configured to scan `packages/ui/src` as well
- `next.config.ts` has `transpilePackages` for `@barber/ui` and `@barber/types`
- Production uses Next.js `standalone` output

**`packages/database`**:
- Prisma schema at `prisma/schema.prisma`
- Exports a singleton `prisma` client from `src/index.ts`
- After schema changes, always run `pnpm db:generate`
- better-auth models: `User`, `Session`, `Account`, `Verification` (lowercase mapped via `@@map`)
- Domain models: `Barbershop`, `BarberProfile`, `Service`, `Appointment`

## Code Style (Biome)

- No semicolons, single quotes, 2-space indent, 100-char line width
- `@biomejs/biome` lives at root; all packages discover it via directory traversal
- Pre-commit hook runs `biome check --write` via lint-staged on `{ts,tsx,js,jsx,json}` files

## Commits

Conventional commits enforced by commitlint. Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`. Subject must not be uppercase, max 100 chars.
