import type { ReleaseDetails, ReleaseListing, ReleaseCreate, ReleaseUpdate } from '@/types/index'
import { getLocalizedName, dateToISOString, sanitize } from '@/lib/utils'
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
  // TODO: Implement logic in another PR; log params to prevent lint from failing
  console.log(`shortname: ${shortname}, (variant) id: ${variantId}, prisma: ${prisma}`)

  if (!body) return Promise.reject({ statregError: 'Invalid body' })

  return {}
}

export async function updateRelease(id: string, input: ReleaseUpdate, prisma: ReleasePrisma): Promise<ReleaseDetails> {
  const idAsNumber = Number.parseInt(sanitize(id))
  if (isNaN(idAsNumber)) {
    return Promise.reject({ statregError: 'Invalid release id' })
  }

  if (!input.comment) return Promise.reject({ status: 400, statregError: 'Required field `comment` is missing' })

  // TODO validate and parse dates
  // TODO call function to check that release date is not blocked
  // TODO insert validated data
  const release = await prisma.release.update({
    select: SELECT_RELEASE_DETAILS,
    where: { id: idAsNumber },
    data: {},
  })

  if (!release) return Promise.reject({ status: 404, statregError: 'Release id not found' })

  return createReleaseDetails(release)
}

const SELECT_RELEASE_DETAILS = {
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
}

function createReleaseDetails(prismaRelease: any): ReleaseDetails {
  const { statistic, frequency } = prismaRelease.variant ?? {}

  return {
    id: prismaRelease.id,
    publish_time: dateToISOString(prismaRelease.publish_time),
    has_versions: prismaRelease.version > 1,
    approval_status: prismaRelease.desk_appoval_status,
    variant: {
      id: prismaRelease.variant.id,
      frequency: {
        name: [...getLocalizedName('nb', frequency.name), ...getLocalizedName(lang_en, frequency.name_en)],
      },
      revision: {
        name: [...getLocalizedName('nb', prismaRelease.variant.revision)],
      },
    },
    statistic: {
      shortname: statistic.shortname.name,
      name: [...getLocalizedName(statistic.language, statistic.name), ...getLocalizedName(lang_en, statistic.name_en)],
    },
    period_from: dateToISOString(prismaRelease.period_from),
    period_to: dateToISOString(prismaRelease.period_to),
    release_date_precision: prismaRelease.release_date_precision,
    cancelled: prismaRelease.cancelled,
  }
}
