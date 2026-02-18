import type { ReleasesListing } from '@/types/index'
import { getLocalizedName } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

export async function getAllReleases({ start = 0, count = 10 }): Promise<ReleasesListing[]> {
  const releases = await prisma.release.findMany({
    skip: start,
    take: count,
    select: {
      id: true,
      version: true,
      publish_time: true,
      desk_appoval_status: true,
      period_to: true,
      period_from: true,
      variant_id: true,
    },
  })

  const variantIds = Array.from(new Set(releases.map((r) => r.variant_id).filter(Boolean)))
  const variantsMap = new Map()
  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, statistic_id: true, frequency: { select: { name: true } } },
  })
  for (const v of variants) variantsMap.set(Number(v.id), v)

  const statisticIds = Array.from(new Set(variants.map((v) => v.statistic_id).filter(Boolean)))
  const statistics = await prisma.statistic.findMany({
    where: { id: { in: statisticIds } },
    select: { id: true, shortname: { select: { name: true } }, name: true, language: true, name_en: true },
  })
  const statisticsMap = new Map()
  for (const s of statistics) statisticsMap.set(Number(s.id), s)

  return releases.map((release) => {
    const variant = release.variant_id ? variantsMap.get(Number(release.variant_id)) : undefined
    const statistic = variant?.statistic_id ? statisticsMap.get(Number(variant.statistic_id)) : undefined

    return {
      id: release.id.toString(),
      version: release.version.toString(),
      published_at: release.publish_time.toISOString(),
      desk_approval_status: release.desk_appoval_status,
      period_to: release.period_to.toISOString(),
      period_from: release.period_from.toISOString(),
      // TODO: There's only en names for frequency names in the database
      frequency: { name: [...getLocalizedName('en', variant?.frequency?.name)] },
      statistic: {
        shortname: statistic?.shortname?.name,
        name: [
          ...getLocalizedName(statistic?.language, statistic?.name),
          ...getLocalizedName('en', statistic?.name_en),
        ],
      },
    }
  })
}
