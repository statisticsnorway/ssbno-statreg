import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export type Env = {
  STATREG_DB_URL_CONNECTION_STRING: string
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env<Env>('STATREG_DB_URL_CONNECTION_STRING'),
  },
})
