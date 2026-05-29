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
