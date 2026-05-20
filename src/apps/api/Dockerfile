FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

FROM base AS development
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm --filter=@barber/database db:generate
EXPOSE 3001
CMD ["pnpm", "--filter=@barber/api", "dev"]

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter=@barber/database db:generate
RUN pnpm --filter=@barber/api build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/index.js"]
