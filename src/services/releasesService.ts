import type { ReleaseDetails, ReleaseListing, ReleaseCreate, ReleaseUpdate } from '@/types/index'
import { ApprovalStatus } from '@/types/enums'
import { dateToISOString, sanitize, validateDateISO, ensureNumber, ensureRequiredFieldsExists } from '@/lib/utils'
import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { releaseAsserts } from '@/lib/asserts'

export type ReleasePrisma = Pick<PrismaClient, 'release' | 'statistic' | 'variant'>

export async function getReleases(
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
  const safeShortname = shortname ? sanitize(shortname) : undefined
  const where = await buildReleaseFilter({ shortname: safeShortname, variantId }, prisma)

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
              code: true,
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
        name: statistic.name,
        name_en: statistic.name_en ?? '',
      },
      frequency: {
        name: frequency.name,
        code: frequency.code,
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
    include: ReleaseDetailsIncludes,
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
  const variantIdNumber = ensureNumber(variantId)
  const safeShortname = sanitize(shortname)

  await releaseAsserts.assertStatisticExists(safeShortname, prisma)
  await releaseAsserts.assertVariantExists(variantIdNumber, prisma)
  await releaseAsserts.assertVariantMatchesShortname(variantIdNumber, safeShortname, prisma)

  const requiredFields: (keyof ReleaseCreate)[] = ['publish_time', 'period_from', 'period_to', 'release_date_precision']
  const { publish_time, period_from, period_to, release_date_precision } =
    ensureRequiredFieldsExists(body, requiredFields) ?? {}

  // TODO: MIM-2577: Use function for blocked days once it's implemented
  // TODO: Automatic suggestion of period_to and period_from is going to be solved in a seperate task
  const publishTimeDate = validateDateISO(publish_time, 'publish_time')
  const periodFromDate = validateDateISO(period_from, 'period_from')
  const periodToDate = validateDateISO(period_to, 'period_to')

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
    include: ReleaseDetailsIncludes,
  })

  return mapToReleaseDetails(release)
}

export async function buildReleaseFilter(
  { shortname, variantId }: { shortname?: string; variantId?: string | number },
  prisma: ReleasePrisma
) {
  if (!shortname && variantId === undefined) return

  const parsedVariantId = variantId === undefined ? undefined : ensureNumber(variantId)

  if (shortname) {
    await releaseAsserts.assertStatisticExists(shortname, prisma)
  }

  if (parsedVariantId !== undefined) {
    await releaseAsserts.assertVariantExists(parsedVariantId, prisma)
  }

  if (shortname && parsedVariantId !== undefined) {
    await releaseAsserts.assertVariantMatchesShortname(parsedVariantId, shortname, prisma)
  }

  const where: any = { variant: {} }

  if (parsedVariantId !== undefined) {
    where.variant.id = parsedVariantId
  }

  if (shortname) {
    where.variant.statistic = {
      shortname: { name: shortname },
    }
  }

  return where
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
    include: ReleaseDetailsIncludes,
    where: { id: idAsNumber },
    data: {},
  })

  // TODO: You may not need this error since Prisma will give an error if update fails
  if (!release) return Promise.reject({ status: 404, statregError: 'Release id not found' })

  return mapToReleaseDetails(release)
}

export const ReleaseDetailsIncludes = {
  variant: {
    select: {
      id: true,
      frequency: {
        select: {
          name: true,
          code: true,
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
  prismaRelease: Prisma.ReleaseGetPayload<{ include: typeof ReleaseDetailsIncludes }>
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
        name: frequency.name,
        code: frequency.code,
      },
      revision: {
        name: prismaRelease.variant.revision,
      },
    },
    statistic: {
      shortname: statistic.shortname.name,
      name: statistic.name,
      name_en: statistic.name_en ?? '',
    },
    period_from: dateToISOString(prismaRelease.period_from),
    period_to: dateToISOString(prismaRelease.period_to),
    release_date_precision: prismaRelease.release_date_precision,
    cancelled: prismaRelease.cancelled,
  }
}
