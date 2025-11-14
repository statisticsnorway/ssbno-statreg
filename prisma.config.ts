import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

type Env = {
  NAIS_DATABASE_MYAPP_MYDB_URL: string
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: env<Env>('NAIS_DATABASE_MYAPP_MYDB_URL'),
  },
})
