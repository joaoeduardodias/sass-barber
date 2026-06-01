import { env } from '@/env'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

const API_URL = env.API_INTERNAL_URL ?? env.NEXT_PUBLIC_API_URL

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const url = `${API_URL}/api/${path.join('/')}${req.nextUrl.search}`

  const headers = new Headers(req.headers)
  headers.delete('host')

  const cookieStore = await cookies()
  const activeShop = cookieStore.get('active-barbershop')?.value
  if (activeShop) headers.set('x-barbershop-id', activeShop)

  const res = await fetch(url, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
  })

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  })
}

export const GET = proxy
export const POST = proxy
export const PATCH = proxy
export const PUT = proxy
export const DELETE = proxy
