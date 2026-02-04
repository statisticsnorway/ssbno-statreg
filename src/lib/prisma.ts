import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'
import process from 'node:process'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.PGURL!,
  // SSL settings need to be disabled for local development
  ssl:
    process.env.NODE_ENV !== 'development'
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
})
const prisma = new PrismaClient({ adapter })

export { prisma }
