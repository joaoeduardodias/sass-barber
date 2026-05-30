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

export function createAppointment(data: {
  customerId: string
  barberId: string
  serviceId: string
  barbershopId: string
  scheduledAt?: Date
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
}) {
  return prisma.appointment.create({
    data: {
      customerId: data.customerId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      barbershopId: data.barbershopId,
      scheduledAt: data.scheduledAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: data.status ?? 'PENDING',
    },
  })
}
