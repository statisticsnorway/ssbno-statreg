import type { ReleaseDetails, ReleaseListing, ReleaseCreate } from '@/types/index'
import { getLocalizedName, dateToISOString, sanitize, validateAndParseDate } from '@/lib/utils'
import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'

type ReleasePrisma = Pick<PrismaClient, 'release'>
const lang_en = 'en'

export async function getAllReleases({ start = 0, count = 10 }, prisma: ReleasePrisma): Promise<ReleaseListing[]> {
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

export async function createRelease(
  prisma: ReleasePrisma,
  shortname: string,
  variantId: string,
  body?: ReleaseCreate
): Promise<ReleaseDetails> {
  // TODO: Add helper functions for find shortname and variant_id

  if (!body) return Promise.reject({ statregError: 'Invalid body' })

  const { publish_time, period_from, period_to, release_date_precision } = body

  const publishTimeDate = validateAndParseDate(publish_time)
  const periodFromDate = validateAndParseDate(period_from)
  const periodToDate = validateAndParseDate(period_to)

  await prisma.release.create({
    data: {
      publish_time: publishTimeDate,
      period_from: periodFromDate,
      period_to: periodToDate,
      release_date_precision: sanitize(release_date_precision!),
      desk_appoval_status: 'VENTER_PAA_GODKJENNING', // TODO: Enum
    },
  })

  const release = await prisma.release.findFirst({
    where: { variant_id: Number(variantId) },
    include: {
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

  if (!release) return Promise.reject({ status: 404, statregError: 'Release not found' })

  // const { statistic, frequency } = release.variant ?? {}

  return {}
}
