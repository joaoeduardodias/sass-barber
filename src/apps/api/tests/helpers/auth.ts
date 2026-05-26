import { type UserRole, prisma } from '@barber/database'
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
