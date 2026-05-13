import type { ExtendedPrismaClient } from '@/lib/prisma'
import { type ShortnameListing } from '@ssbno-statreg/shared'

export type ShortnamePrisma = Pick<ExtendedPrismaClient, 'shortname' | 'statistic'>

export async function getShortnames(prisma: ShortnamePrisma): Promise<ShortnameListing[]> {
  const shortnames = await prisma.shortname.findMany({
    select: {
      name: true,
      statistic: { select: { name: true } },
    },
    where: { NOT: { statistic: null } },
  })

  const result = shortnames.map((item) => {
    return { shortname: item.name, statistic_name: item.statistic!.name }
  })

  return result
}
