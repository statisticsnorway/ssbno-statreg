import type { ReleaseListing } from '@/types/index'
import { getLocalizedName, dateToISOString } from '@/lib/utils'
import { type PrismaClient } from '@/generated/prisma/client'

type ReleasePrisma = Pick<PrismaClient, 'release'>

export async function getAllReleases(
  { start = 0, count = 10, shortname }: { start?: number; count?: number; shortname?: string },
  prisma: ReleasePrisma
): Promise<ReleaseListing[]> {
  const releases = await prisma.release.findMany({
    skip: start,
    take: count,

    where: shortname
      ? {
          variant: {
            statistic: {
              shortname: {
                name: shortname,
              },
            },
          },
        }
      : undefined,

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
              name_en: true,
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
    const { statistic, frequency } = release.variant ?? {}
    const lang_en = 'en'

    return {
      id: release.id,
      publish_time: dateToISOString(release.publish_time),
      approval_status: release.desk_appoval_status,
      period_to: dateToISOString(release.period_to),
      period_from: dateToISOString(release.period_from),
      frequency: {
        name: [...getLocalizedName('nb', frequency.name), ...getLocalizedName(lang_en, frequency.name_en)],
      },
      statistic: {
        shortname: statistic.shortname.name,
        name: [
          ...getLocalizedName(statistic.language, statistic.name),
          ...getLocalizedName(lang_en, statistic.name_en),
        ],
      },
    }
  })
}

export async function getAllReleasesForStatisticVariant(
  shortname: string,
  variantId: number,
  { start = 0, count = 10 },
  prisma: ReleasePrisma
) {
  const releases = await prisma.release.findMany({
    skip: start,
    take: count,

    where: {
      variant: {
        id: variantId,
        statistic: {
          shortname: {
            name: shortname,
          },
        },
      },
    },

    orderBy: {
      publish_time: 'desc',
    },

    select: {
      desk_appoval_status: true,
      cancelled: true,
      publish_time: true,
      period_from: true,
      period_to: true,

      variant: {
        select: {
          id: true,
          version: true,
          revision: true,
          level_of_detail: true,
          level_of_detail_en: true,

          frequency: {
            select: {
              code: true,
              name: true,
              name_en: true,
            },
          },

          statistic: {
            select: {
              shortname: {
                select: { name: true },
              },
              name: true,
              name_en: true,
            },
          },
        },
      },
    },
  })

  return releases.map((r) => ({
    status: r.desk_appoval_status,
    cancelled: r.cancelled,
    kortnavn: r.variant.statistic.shortname.name,
    period_from: r.period_from,
    period_to: r.period_to,
    publish_time: r.publish_time,

    statistikk: {
      name: r.variant.statistic.name,
      name_en: r.variant.statistic.name_en,
    },

    variant: {
      id: r.variant.id,
      version: r.variant.version,
      revision: r.variant.revision,
      level_of_detail: r.variant.level_of_detail,
      level_of_detail_en: r.variant.level_of_detail_en,
    },

    frequency: {
      code: r.variant.frequency.code,
      name: r.variant.frequency.name,
      name_en: r.variant.frequency.name_en,
    },
  }))
}
