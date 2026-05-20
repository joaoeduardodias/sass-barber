import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.info('Seeding database...')

  console.info('Seeding complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
