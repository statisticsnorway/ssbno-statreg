import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'
import process from 'node:process'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.STATREG_DB_URL_CONNECTION_STRING!,
})

const prisma = new PrismaClient({ adapter })

export { prisma, PrismaClient }
