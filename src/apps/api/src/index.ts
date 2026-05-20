import 'dotenv/config'
import { createApp } from './app'
import { env } from './env'

async function start() {
  const app = await createApp()

  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
