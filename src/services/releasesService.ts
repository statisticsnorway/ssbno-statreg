import type { ReleaseListing } from '@/types/index'
import { getLocalizedName, dateToISOString } from '@/lib/utils'
import { prisma } from '@/lib/prisma'

export async function getAllReleases({ start = 0, count = 10 }): Promise<ReleaseListing[]> {
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
      published_at: dateToISOString(release.publish_time),
      desk_approval_status: release.desk_appoval_status,
      period_to: dateToISOString(release.period_to),
      period_from: dateToISOString(release.period_from),
      frequency: { name: [...getLocalizedName('nb', ''), ...getLocalizedName('en', release.variant?.frequency?.name)] },
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
