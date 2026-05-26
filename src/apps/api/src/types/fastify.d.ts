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
