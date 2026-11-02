import process from 'node:process'
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export type Env = {
  PGURL: string
  PRISMA_DATABASE_URL?: string
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.PRISMA_DATABASE_URL ?? env<Env>('PGURL'),
  },
})
