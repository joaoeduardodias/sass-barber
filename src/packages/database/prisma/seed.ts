import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
})

async function main() {
  console.info('Seeding database...')

  console.info('Seeding complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
