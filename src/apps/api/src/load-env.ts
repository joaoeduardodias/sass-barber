import { resolve } from 'node:path'
import { config } from 'dotenv'

// Load root .env (CWD is src/apps/api when running via pnpm)
config({ path: resolve(process.cwd(), '../../../.env') })
