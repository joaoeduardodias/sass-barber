import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  API_INTERNAL_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const env = schema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  API_INTERNAL_URL: process.env.API_INTERNAL_URL,
  NODE_ENV: process.env.NODE_ENV,
})
