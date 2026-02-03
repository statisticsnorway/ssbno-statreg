import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'
import process from 'node:process'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.PGURL!,
  ssl: {
    rejectUnauthorized: false,
  },
})

const prisma = new PrismaClient({ adapter })

export { prisma }
