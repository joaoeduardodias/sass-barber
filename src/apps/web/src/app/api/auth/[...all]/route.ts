import type { NextRequest } from 'next/server'

// Server-side: use internal Docker network URL to reach the API container.
// Client-side NEXT_PUBLIC_API_URL points to localhost:3001 (host-accessible).
const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname + req.nextUrl.search
  const url = `${API_URL}${path}`

  const headers = new Headers(req.headers)
  headers.delete('host')

  const res = await fetch(url, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    // @ts-expect-error — duplex needed for streaming body in Node 18+
    duplex: 'half',
  })

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  })
}

export const GET = proxy
export const POST = proxy
