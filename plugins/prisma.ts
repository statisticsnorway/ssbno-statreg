import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import process from 'node:process'

export async function setupPrisma(): Promise<PrismaClient> {
  const adapter = new PrismaPg({
    connectionString: process.env.NAIS_DATABASE_MYAPP_MYDB_URL!,
  })

  const prisma = new PrismaClient({ adapter })
  await prisma.$connect()

  return prisma
}
