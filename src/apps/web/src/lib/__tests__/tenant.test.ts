import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = new Map<string, { value: string }>()
const mockCookies = {
  get: (key: string) => store.get(key),
  set: (key: string, value: string) => store.set(key, { value }),
}
vi.mock('next/headers', () => ({ cookies: async () => mockCookies }))

import { getActiveBarbershopId, setActiveBarbershopId } from '../tenant'

beforeEach(() => store.clear())

describe('active barbershop cookie', () => {
  it('returns null when unset', async () => {
    expect(await getActiveBarbershopId()).toBeNull()
  })

  it('round-trips the id', async () => {
    await setActiveBarbershopId('shop-1')
    expect(await getActiveBarbershopId()).toBe('shop-1')
  })
})
