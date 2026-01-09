import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export type Env = {
  NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_URL: string
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env<Env>('NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_URL'),
  },
})
