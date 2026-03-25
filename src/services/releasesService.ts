import type { ReleaseDetails, ReleaseListing, ReleaseCreate, ReleaseUpdate } from '@/types/index'
import { ApprovalStatus } from '@/types/enums'
import { getLocalizedName, dateToISOString, sanitize, validateAndParseDate } from '@/lib/utils'
import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

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
    include: SELECT_VARIANT_DETAILS,
  })

  if (!release) return Promise.reject({ status: 404, statregError: 'Release not found' })

  return mapToReleaseDetails(release)
}

export async function createRelease(
  prisma: ReleasePrisma,
  shortname: string,
  variantId: string,
  now: Date,
  body?: ReleaseCreate
): Promise<ReleaseDetails> {
  // TODO: Add asssert functions for find shortname and variant_id
  // TODO: Validate shortname and variantId
  const variantIdNumber = Number(variantId)
  // @ts-ignore; TODO: Will be used in assert functions
  // eslint-disable-next-line no-unused-vars
  const sanitizedShortname = sanitize(shortname)

  const { publish_time, period_from, period_to, release_date_precision } = body ?? {}

  const missingFields = []
  if (!publish_time) missingFields.push('publish_time')
  if (!period_from) missingFields.push('period_from')
  if (!period_to) missingFields.push('period_to')
  if (!release_date_precision) missingFields.push('release_date_precision')

  if (missingFields.length) {
    return Promise.reject({
      statregError: `Missing required field(s): ${missingFields.join(', ')}`,
      missingFields,
    })
  }

  // TODO: MIM-2577: Use function for blocked days once it's implemented
  // TODO: Automatic suggestion of period_to and period_from is going to be solved in a seperate task
  const publishTimeDate = validateAndParseDate(publish_time, 'publish_time')
  const periodFromDate = validateAndParseDate(period_from, 'period_from')
  const periodToDate = validateAndParseDate(period_to, 'period_to')

  const release = await prisma.release.create({
    data: {
      publish_time: publishTimeDate,
      period_from: periodFromDate,
      period_to: periodToDate,
      // TODO: Implementation of release_date_precision logic is going to be solved in a seperate task
      release_date_precision: sanitize(release_date_precision!),
      has_versions: false,
      cancelled: false,
      last_updated: now,
      date_created: now,
      desk_appoval_status: ApprovalStatus.PENDING,
      comment: '',
      variant: {
        connect: {
          id: variantIdNumber,
        },
      },
    },
    include: SELECT_VARIANT_DETAILS,
  })

  return mapToReleaseDetails(release)
}

export async function updateRelease(id: string, body: ReleaseUpdate, prisma: ReleasePrisma): Promise<ReleaseDetails> {
  const idAsNumber = Number.parseInt(sanitize(id))
  if (isNaN(idAsNumber)) {
    return Promise.reject({ statregError: 'Invalid release id' })
  }

  if (!body.comment) return Promise.reject({ statregError: 'Required field `comment` is missing' })

  // TODO validate and parse dates
  // TODO call function to check that release date is not blocked
  // TODO insert validated data
  const release = await prisma.release.update({
    include: SELECT_VARIANT_DETAILS,
    where: { id: idAsNumber },
    data: {},
  })

  // TODO: You may not need this error since Prisma will give an error if update fails
  if (!release) return Promise.reject({ status: 404, statregError: 'Release id not found' })

  return mapToReleaseDetails(release)
}

const SELECT_VARIANT_DETAILS = {
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

export function mapToReleaseDetails(
  prismaRelease: Prisma.ReleaseGetPayload<{ include: typeof SELECT_VARIANT_DETAILS }>
): ReleaseDetails {
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
