import { describe, expect, it } from 'vitest'
import { generateUniqueSlug, slugify } from '../src/lib/slug'
import { createTestUser } from './helpers/auth'
import { createBarbershop } from './helpers/db'

describe('slugify', () => {
  it('kebab-cases and strips accents', () => {
    expect(slugify('Barbearia São João')).toBe('barbearia-sao-joao')
  })

  it('collapses non-alphanumerics and trims dashes', () => {
    expect(slugify('  Corte & Cia!! ')).toBe('corte-cia')
  })

  it('returns empty string for input with no alphanumerics', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('generateUniqueSlug', () => {
  it('returns the base slug when free', async () => {
    expect(await generateUniqueSlug('Studio Alpha')).toBe('studio-alpha')
  })

  it('appends a numeric suffix on collision', async () => {
    const owner = await createTestUser({ role: 'OWNER' })
    await createBarbershop(owner.id, { name: 'Studio Beta', slug: 'studio-beta' })
    expect(await generateUniqueSlug('Studio Beta')).toBe('studio-beta-2')
  })

  it('falls back to "barbearia" when the name has no alphanumerics', async () => {
    expect(await generateUniqueSlug('!!!')).toBe('barbearia')
  })
})
