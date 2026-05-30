import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
})

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET ?? 'seed-secret-key-minimum-32-characters',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
  emailAndPassword: { enabled: true },
})

async function createUser(name: string, email: string, role: 'OWNER' | 'BARBER' | 'CUSTOMER') {
  const result = await auth.api.signUpEmail({ body: { name, email, password: 'password123' } })
  if (result.user.role !== role) {
    await prisma.user.update({ where: { id: result.user.id }, data: { role } })
  }
  return result.user
}

async function main() {
  console.info('Limpando banco...')
  await prisma.appointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.barberProfile.deleteMany()
  await prisma.barbershop.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verification.deleteMany()
  await prisma.user.deleteMany()

  console.info('Criando usuários...')
  const owner = await createUser('Dono da Barbearia', 'dono@barbearia.com', 'OWNER')
  const joao = await createUser('João Silva', 'joao@barber.com', 'BARBER')
  const pedro = await createUser('Pedro Costa', 'pedro@barber.com', 'BARBER')
  const cliente = await createUser('Carlos Cliente', 'cliente@example.com', 'CUSTOMER')

  console.info('Criando barbearia...')
  const shop = await prisma.barbershop.create({
    data: {
      name: 'Barbearia Vintage',
      slug: 'barbearia-vintage',
      description:
        'Tradição e estilo desde 2010. Cortes clássicos e modernos para homens que se cuidam.',
      address: 'Rua Augusta, 1200 — São Paulo, SP',
      phone: '(11) 91234-5678',
      ownerId: owner.id,
    },
  })

  console.info('Criando perfis de barbeiro...')
  const joaoProfile = await prisma.barberProfile.create({
    data: {
      userId: joao.id,
      barbershopId: shop.id,
      bio: 'Especialista em degradê e barba',
    },
  })
  const pedroProfile = await prisma.barberProfile.create({
    data: {
      userId: pedro.id,
      barbershopId: shop.id,
      bio: 'Expert em cortes clássicos e platinado',
    },
  })

  console.info('Criando serviços...')
  const [corteSimples, degrade, corteBarbaSvc, barbaSvc, , sobrancelha] = await Promise.all([
    prisma.service.create({
      data: { name: 'Corte simples', price: 35, duration: 30, barbershopId: shop.id },
    }),
    prisma.service.create({
      data: { name: 'Degradê', price: 50, duration: 45, barbershopId: shop.id },
    }),
    prisma.service.create({
      data: { name: 'Corte + Barba', price: 60, duration: 60, barbershopId: shop.id },
    }),
    prisma.service.create({
      data: { name: 'Barba', price: 30, duration: 30, barbershopId: shop.id },
    }),
    prisma.service.create({
      data: { name: 'Corte infantil', price: 30, duration: 30, barbershopId: shop.id },
    }),
    prisma.service.create({
      data: { name: 'Sobrancelha', price: 15, duration: 15, barbershopId: shop.id },
    }),
    prisma.service.create({
      data: { name: 'Platinado', price: 150, duration: 120, barbershopId: shop.id },
    }),
  ])

  console.info('Criando agendamentos...')
  const now = new Date()
  const utcDate = (offsetDays: number, hour = 10) =>
    new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays, hour, 0),
    )

  await prisma.appointment.createMany({
    data: [
      {
        customerId: cliente.id,
        barberId: joaoProfile.id,
        serviceId: corteSimples.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(-30),
        status: 'COMPLETED',
      },
      {
        customerId: cliente.id,
        barberId: pedroProfile.id,
        serviceId: barbaSvc.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(-15),
        status: 'COMPLETED',
      },
      {
        customerId: cliente.id,
        barberId: joaoProfile.id,
        serviceId: degrade.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(-7),
        status: 'COMPLETED',
      },
      {
        customerId: cliente.id,
        barberId: pedroProfile.id,
        serviceId: corteBarbaSvc.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(1),
        status: 'PENDING',
      },
      {
        customerId: cliente.id,
        barberId: joaoProfile.id,
        serviceId: corteSimples.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(7, 14),
        status: 'CONFIRMED',
      },
      {
        customerId: cliente.id,
        barberId: pedroProfile.id,
        serviceId: barbaSvc.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(9, 11),
        status: 'CONFIRMED',
      },
      {
        customerId: cliente.id,
        barberId: joaoProfile.id,
        serviceId: sobrancelha.id,
        barbershopId: shop.id,
        scheduledAt: utcDate(-20),
        status: 'CANCELLED',
      },
    ],
  })

  console.info(`
✓ Seed completo!

Usuários:
  dono@barbearia.com / password123  (OWNER)
  joao@barber.com   / password123  (BARBER)
  pedro@barber.com  / password123  (BARBER)
  cliente@example.com / password123 (CUSTOMER)

Barbearia: Barbearia Vintage  (slug: barbearia-vintage)
Página pública: http://localhost:3000/b/barbearia-vintage
Área do cliente: http://localhost:3000/minha-conta
  `)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
