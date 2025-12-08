import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

type Env = {
  NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_URL: string
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env<Env>('NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_URL'),
  },
})
