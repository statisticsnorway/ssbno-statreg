import type { ReleaseDetails, ReleaseListing } from '@/types/index'
import { getLocalizedName, dateToISOString, sanitize } from '@/lib/utils'
import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'

type ReleasePrisma = Pick<PrismaClient, 'release'>
const lang_en = 'en'

export async function getAllReleases(
  {
    start = 0,
    count = 10,
    shortname,
    variantId,
  }: {
    start?: number
    count?: number
    shortname?: string
    variantId?: number
  },
  prisma: ReleasePrisma
): Promise<ReleaseListing[]> {
  const where =
    shortname || variantId !== undefined
      ? {
          variant: {
            ...(variantId !== undefined ? { id: variantId } : {}),
            ...(shortname
              ? {
                  statistic: {
                    shortname: {
                      name: sanitize(shortname),
                    },
                  },
                }
              : {}),
          },
        }
      : undefined

  const releases = await prisma.release.findMany({
    skip: start,
    take: count,
    where,
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

    return {
      id: release.id,
      publish_time: dateToISOString(release.publish_time),
      approval_status: release.desk_appoval_status,
      period_to: dateToISOString(release.period_to),
      period_from: dateToISOString(release.period_from),
      statistic: {
        shortname: statistic.shortname.name,
        name: [
          ...getLocalizedName(statistic.language, statistic.name),
          ...getLocalizedName(lang_en, statistic.name_en),
        ],
      },
      frequency: {
        name: [...getLocalizedName('nb', frequency.name), ...getLocalizedName(lang_en, frequency.name_en)],
      },
    }
  })
}

export async function getReleaseById(id: string, prisma: ReleasePrisma): Promise<ReleaseDetails> {
  const idAsNumber = Number.parseInt(sanitize(id))
  if (isNaN(idAsNumber)) {
    return Promise.reject({ statregError: 'Invalid release id' })
  }

  const release = await prisma.release.findFirst({
    where: { id: idAsNumber },
    select: {
      id: true,
      version: true,
      publish_time: true,
      desk_appoval_status: true,
      period_to: true,
      period_from: true,
      release_date_precision: true,
      cancelled: true,
      variant: {
        select: {
          id: true,
          frequency: {
            select: {
              name: true,
              name_en: true,
            },
          },
          revision: true,
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

  if (!release) return Promise.reject({ status: 404, statregError: 'Release id not found' })

  const { statistic, frequency } = release.variant ?? {}

  return {
    id: release.id,
    publish_time: dateToISOString(release.publish_time),
    has_versions: release.version > 1,
    approval_status: release.desk_appoval_status,
    variant: {
      id: release.variant.id,
      frequency: {
        name: [...getLocalizedName('nb', frequency.name), ...getLocalizedName(lang_en, frequency.name_en)],
      },
      revision: {
        name: [...getLocalizedName('nb', release.variant.revision)],
      },
    },
    statistic: {
      shortname: statistic.shortname.name,
      name: [...getLocalizedName(statistic.language, statistic.name), ...getLocalizedName(lang_en, statistic.name_en)],
    },
    period_from: dateToISOString(release.period_from),
    period_to: dateToISOString(release.period_to),
    release_date_precision: release.release_date_precision,
    cancelled: release.cancelled,
  }
}
