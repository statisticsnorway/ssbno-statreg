import type { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export type StatisticWithShortname = Prisma.StatisticGetPayload<{
  include: {
    shortname: true
  }
}>

export async function createTestShortname(prefix = 'it-stat'): Promise<string> {
  const now = new Date()
  const shortname = `${prefix}-${now.getTime()}`

  await prisma.shortname.create({
    data: {
      name: shortname,
      version: 1,
      date_created: now,
      last_updated: now,
    },
  })

  return shortname
}

export async function readStatisticFromDb(shortname: string): Promise<StatisticWithShortname> {
  return prisma.statistic.findFirstOrThrow({
    where: {
      shortname: {
        name: shortname,
      },
    },
    include: {
      shortname: true,
    },
  })
}

export async function cleanupCreatedStatistics(
  createdStatistics: Array<{ statisticId: number | null; shortname: string | null }>
): Promise<void> {
  for (const created of createdStatistics) {
    if (created.statisticId !== null) {
      await prisma.statistic.delete({
        where: {
          id: created.statisticId,
        },
      })
    }

    if (created.shortname !== null) {
      await prisma.shortname.delete({
        where: {
          name: created.shortname,
        },
      })
    }
  }
}
