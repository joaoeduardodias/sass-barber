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
