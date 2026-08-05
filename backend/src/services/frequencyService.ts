import type { ExtendedPrismaClient } from '@/lib/prisma'
import { type Frequency } from '@ssbno-statreg/shared'

export type FrequencyPrisma = Pick<ExtendedPrismaClient, 'frequency'>

export async function getFrequencies(prisma: FrequencyPrisma): Promise<Frequency[]> {
  const frequencies = await prisma.frequency.findMany({
    select: {
      name: true,
      code: true,
    },
  })

  const result = frequencies.map((frequency) => frequency)

  return result
}
