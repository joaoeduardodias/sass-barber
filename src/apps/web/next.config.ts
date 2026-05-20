import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@barber/ui', '@barber/types'],
  output: 'standalone',
}

export default nextConfig
