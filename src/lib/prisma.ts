import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import process from 'node:process'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_URL!,
})

const prisma = new PrismaClient({ adapter })

export { prisma }
