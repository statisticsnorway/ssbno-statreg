import type { ReleaseListing } from '@/types/index'
import { getLocalizedName } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

export async function getAllReleases({ start = 0, count = 10 }): Promise<ReleaseListing[]> {
  const releases = await prisma.release.findMany({
    skip: start,
    take: count,
    orderBy: { publish_time: 'desc' }, // TODO: Should we already make this a req.query option or leave it for filtering later?
    select: {
      id: true,
      version: true,
      publish_time: true,
      desk_appoval_status: true,
      period_to: true,
      period_from: true,
      variant: {
        select: {
          frequency: {
            select: {
              name: true,
            },
          },
          statistic: {
            select: {
              language: true,
              name: true,
              name_en: true,
              shortname: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return releases.map((release) => {
    const { statistic } = release.variant

    return {
      id: release.id,
      published_at: release.publish_time.toISOString(),
      desk_approval_status: release.desk_appoval_status,
      period_to: release.period_to.toISOString(),
      period_from: release.period_from.toISOString(),
      // TODO: There's only en names for frequency names in the database. Double check
      frequency: { name: [...getLocalizedName('en', release.variant?.frequency?.name)] },
      statistic: {
        shortname: statistic?.shortname?.name,
        name: [
          ...getLocalizedName(statistic?.language ?? 'nb', statistic?.name),
          ...getLocalizedName('en', statistic?.name_en),
        ],
      },
    }
  })
}
