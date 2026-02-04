import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'
import process from 'node:process'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.PGURL!,
  // SSL settings need to be disabled for local development, otherwise prisma db seed will fail,
  // and the NAIS_CLUSTER_NAME is a default variable that is either test or prod
  ssl: process.env.NAIS_CLUSER_NAME
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
})
const prisma = new PrismaClient({ adapter })

export { prisma }
