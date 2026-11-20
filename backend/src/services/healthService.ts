import type { ExtendedPrismaClient } from '@/lib/prisma'
import { StatregError } from '@/lib/statregError'

type HealthPrisma = Pick<ExtendedPrismaClient, '$queryRaw'>

export async function checkDatabaseHealth(prisma: HealthPrisma): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    console.error('Health check failed', error)
    throw new StatregError('Service unavailable', 503)
  }
}
