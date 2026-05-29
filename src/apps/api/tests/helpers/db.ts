import { prisma } from '@barber/database'

export function createBarbershop(ownerId: string, overrides?: { name?: string; slug?: string }) {
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

export function createService(
  barbershopId: string,
  overrides?: { name?: string; duration?: number; price?: number },
) {
  return prisma.service.create({
    data: {
      name: overrides?.name ?? 'Corte Masculino',
      duration: overrides?.duration ?? 30,
      price: overrides?.price ?? 35,
      barbershopId,
    },
  })
}
