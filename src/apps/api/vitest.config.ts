import { config } from 'dotenv'
import { defineConfig } from 'vitest/config'

config({ path: '.env.test' })

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
    hookTimeout: 30_000,
  },
})
