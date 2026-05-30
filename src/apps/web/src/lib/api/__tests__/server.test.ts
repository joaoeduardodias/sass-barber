import { afterEach, describe, expect, it, vi } from 'vitest'

const cookieStore = {
  toString: () => 'better-auth.session_token=abc',
  get: (key: string) => (key === 'active-barbershop' ? { value: 'shop-1' } : undefined),
}
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))

import { ApiFetchError, apiFetch } from '../server'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

afterEach(() => fetchMock.mockReset())

describe('apiFetch', () => {
  it('forwards the cookie + X-Barbershop-Id and unwraps { data }', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { id: 'shop-1' } }), { status: 200 }),
    )
    const result = await apiFetch('/barbershops/shop-1')
    expect(result).toEqual({ id: 'shop-1' })

    const [, init] = fetchMock.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get('cookie')).toContain('session_token')
    expect(headers.get('x-barbershop-id')).toBe('shop-1')
  })

  it('throws ApiFetchError on non-2xx', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'nope', statusCode: 403 }), { status: 403 }),
    )
    await expect(apiFetch('/barbershops/x')).rejects.toThrowError(ApiFetchError)
  })
})
