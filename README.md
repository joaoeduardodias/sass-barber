# Barber SaaS

A multi-tenant SaaS platform for barber shops — appointment scheduling, service management, and staff profiles.

## Stack

| Layer | Technology |
|---|---|
| API | Fastify 5, Node 20, better-auth |
| Web | Next.js 15 (App Router), React 19, Tailwind CSS |
| Database | PostgreSQL 16, Prisma ORM |
| Cache / sessions | Redis 7 |
| Monorepo | Turborepo, pnpm workspaces |
| Linting / formatting | Biome |

## Monorepo layout

```
src/
  apps/
    api/        @barber/api   — REST API (port 3001)
    web/        @barber/web   — Next.js frontend (port 3000)
  packages/
    database/   @barber/database  — Prisma client + schema
    types/      @barber/types     — Shared TypeScript types
    ui/         @barber/ui        — Shared React components
    config/     @barber/config    — Shared tsconfig files
```

Shared packages use the **internal package pattern** — their `main`/`types` fields point to source TypeScript. No build step is needed for them; consuming apps compile them directly.

## Getting started

### Prerequisites

- Node >= 20
- pnpm >= 9
- Docker (for PostgreSQL and Redis)

### Setup

```bash
# Install dependencies
pnpm install

# Start infrastructure
docker-compose up -d postgres redis

# Configure environment
cp .env.example .env
# Fill in the required values in .env

# Push the database schema
pnpm db:push

# (Optional) seed the database
pnpm db:seed

# Start all apps in dev mode
pnpm dev
```

The API will be available at `http://localhost:3001` and the web app at `http://localhost:3000`.

## Commands

```bash
# Development
pnpm dev             # start all apps in parallel (hot reload)

# Build
pnpm build           # turbo build for all packages

# Lint / format
pnpm lint            # biome check across all packages
pnpm check           # biome check on the whole repo
pnpm check:fix       # biome check --write (auto-fix)
pnpm format          # biome format --write .

# Tests
pnpm test
pnpm test:watch

# Target a single package
pnpm --filter=@barber/api dev
pnpm --filter=@barber/api test

# Database (Prisma)
pnpm db:generate     # regenerate client after schema changes
pnpm db:push         # sync schema to database (dev, no migration file)
pnpm db:migrate      # run migrations (production)
pnpm db:seed         # seed the database
pnpm db:studio       # open Prisma Studio
```

## Docker

A full Docker Compose setup is included for both development and production.

```bash
# Development (with hot reload)
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up
```

## Data model

Domain models: `Barbershop`, `BarberProfile`, `Service`, `Appointment`.

User roles: `ADMIN`, `OWNER`, `BARBER`, `CUSTOMER`.

Appointment statuses: `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.

Auth is handled by `better-auth` with the `User`, `Session`, `Account`, and `Verification` models mapped to lowercase table names.

## Contributing

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/). Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`. Subject must not be uppercase and max 100 characters.

A pre-commit hook runs Biome auto-fix (`biome check --write`) on staged `ts`, `tsx`, `js`, `jsx`, and `json` files via lint-staged.
