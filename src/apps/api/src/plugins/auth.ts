import { type UserRole, prisma } from '@barber/database'
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
    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!dbUser) throw new ApiError(401, 'Unauthorized', 'Autenticação necessária')
    request.user = { id: dbUser.id, email: dbUser.email, role: dbUser.role }
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
