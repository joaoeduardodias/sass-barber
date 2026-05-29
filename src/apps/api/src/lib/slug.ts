import { prisma } from '@barber/database'

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'barbearia'
  let candidate = base
  let suffix = 1
  while (await prisma.barbershop.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    suffix += 1
    candidate = `${base}-${suffix}`
  }
  return candidate
}
