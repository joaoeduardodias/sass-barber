import { resolve } from 'node:path'
import { config } from 'dotenv'
import type { NextConfig } from 'next'

// Load root .env (CWD is src/apps/web when running via pnpm)
config({ path: resolve(process.cwd(), '../../.env') })

// Validate env vars at startup — crashes with a clear error if required vars are missing
import('./src/env')

const nextConfig: NextConfig = {
  transpilePackages: ['@barber/ui', '@barber/types'],
  output: 'standalone',
}

export default nextConfig
