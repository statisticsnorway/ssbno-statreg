import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'
import process from 'node:process'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.PGURL!,
  // TODO: Disable ssl in local development
  ssl: {
    rejectUnauthorized: false,
  },
})
const prisma = new PrismaClient({ adapter })

export { prisma }
