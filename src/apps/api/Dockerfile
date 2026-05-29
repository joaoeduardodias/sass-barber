FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

FROM base AS development
WORKDIR /app
RUN chown -R node:node /app
COPY --chown=node:node . .
USER node
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
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/index.js"]
