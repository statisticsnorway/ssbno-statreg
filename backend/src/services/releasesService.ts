import {
  type ReleaseDetails,
  type ReleaseCreate,
  type ReleaseUpdate,
  type ReleaseListingResponse,
  type ReleasesBulkApproveResponse,
  ApprovalStatus,
} from '@ssbno-statreg/shared'
import {
  dateToISOString,
  sanitize,
  getDateOnlyAsString,
  parseDateISO,
  parseDateOnly,
  parseId,
  ensureRequiredFieldsExists,
  parseHumanReadableMeasuringPeriod,
} from '@/lib/utils'
import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { releaseAsserts } from '@/lib/asserts'
import { checkForKnownPrismaErrors } from '@/lib/prismaErrors'
import { StatregError } from '@/lib/statregError'
import { isCurrentUserAdmin } from '@/lib/context'
import { isDateBlocked } from '@/lib/blockedDates'

export type ReleasePrisma = Pick<PrismaClient, 'release' | 'statistic' | 'variant' | 'shortname' | 'calender_date'>

export async function getReleases(
  {
    start = 0,
    count = 10,
    where: whereFromInput,
    sort,
  }: {
    start?: number
    count?: number
    where?: Prisma.ReleaseWhereInput
    sort?: string
  },
  prisma: ReleasePrisma
): Promise<ReleaseListingResponse> {
  const orderBy = parseReleasesSortQuery(sort)

  const where = { ...whereFromInput, archived: false }

  const releases = await prisma.release.findMany({
    skip: start,
    take: count,
    where,
    orderBy: orderBy ?? { publish_time: 'desc' },
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
  const total = await prisma.release.count({ where })

  return {
    total,
    releases: releases.map((release) => {
      const { statistic, frequency } = release.variant ?? {}
      return {
        id: release.id,
        publish_time: dateToISOString(release.publish_time),
        approval_status: release.desk_appoval_status,
        period_to: getDateOnlyAsString(release.period_to),
        period_from: getDateOnlyAsString(release.period_from),
        measuring_period_title: parseHumanReadableMeasuringPeriod(
          frequency.code,
          release.period_from,
          release.period_to
        ),
        statistic: {
          shortname: statistic.shortname.name,
          name: statistic.name,
          name_en: statistic.name_en ?? '',
        },
        frequency: {
          name: frequency.name,
          code: frequency.code,
        },
        revision: { code: release.variant.revision },
      }
    }),
  }
}

function parseReleasesSortQuery(sort?: string): Prisma.ReleaseOrderByWithRelationInput | undefined {
  if (sort === 'publish_time') {
    return { publish_time: 'asc' }
  }
  if (sort === '-publish_time') {
    return { publish_time: 'desc' }
  }
  return undefined
}

export async function getFilteredReleases(
  {
    start = 0,
    count = 10,
    filterByShortnames,
    publishTimeAfter,
    publishTimeBefore,
    sort,
    approvalStatus,
  }: {
    start?: number
    count?: number
    filterByShortnames?: string[]
    publishTimeAfter?: string
    publishTimeBefore?: string
    sort?: string
    approvalStatus?: string
  },
  prisma: ReleasePrisma
): Promise<ReleaseListingResponse> {
  const safeFilterByShortnames = filterByShortnames?.length
    ? filterByShortnames.map((shortname) => sanitize(shortname))
    : undefined

  const filterByAfterPublishDate = publishTimeAfter ? parseDateISO(publishTimeAfter) : undefined
  const filterByBeforePublishDate = publishTimeBefore ? parseDateISO(publishTimeBefore) : undefined
  const filterByApprovalStatus = approvalStatus ? sanitize(approvalStatus) : undefined

  const where = await buildReleaseFilter(
    {
      filterByShortnames: safeFilterByShortnames,
      filterByAfterPublishDate,
      filterByBeforePublishDate,
      filterByApprovalStatus,
    },
    prisma
  )

  return getReleases({ start, count, where, sort }, prisma)
}

export async function getVariantReleases(
  {
    start = 0,
    count = 10,
    shortname,
    variantId,
    sort,
  }: {
    start?: number
    count?: number
    shortname: string
    variantId: number
    sort?: string
  },
  prisma: ReleasePrisma
): Promise<ReleaseListingResponse> {
  const safeShortname = sanitize(shortname)
  const parsedVariantId = parseId(variantId)

  const where = await buildVariantReleaseFilter({ shortname: safeShortname, variantId: parsedVariantId }, prisma)

  return getReleases({ start, count, where, sort }, prisma)
}

export async function getReleaseById(id: string, prisma: ReleasePrisma): Promise<ReleaseDetails> {
  const idAsNumber = parseId(id, 'release')
  const release = await prisma.release.findFirst({
    where: { id: idAsNumber },
    include: ReleaseDetailsIncludes,
  })

  if (!release || release.archived) throw new StatregError(`Release ${idAsNumber} not found`, 404)

  return mapToReleaseDetails(release)
}

export async function createRelease(
  prisma: ReleasePrisma,
  shortname: string,
  variantId: string,
  body?: ReleaseCreate,
  now = new Date()
): Promise<ReleaseDetails> {
  const parsedVariantId = parseId(variantId)
  const safeShortname = sanitize(shortname)

  await releaseAsserts.assertStatisticExists(safeShortname, prisma)
  await releaseAsserts.assertVariantExists(parsedVariantId, prisma)
  await releaseAsserts.assertVariantMatchesShortname(parsedVariantId, safeShortname, prisma)

  const { publishTimeDate, periodFromDate, periodToDate, releaseDatePrecision } = await parseReleaseInput(prisma, body)

  const release = await prisma.release.create({
    data: {
      publish_time: publishTimeDate,
      period_from: periodFromDate,
      period_to: periodToDate,
      release_date_precision: releaseDatePrecision,
      has_versions: false,
      cancelled: false,
      last_updated: now,
      date_created: now,
      desk_appoval_status: isCurrentUserAdmin() ? ApprovalStatus.ACCEPTED : ApprovalStatus.PENDING,
      comment: '',
      variant: {
        connect: {
          id: parsedVariantId,
        },
      },
    },
    include: ReleaseDetailsIncludes,
  })

  return mapToReleaseDetails(release)
}

export async function buildReleaseFilter(
  {
    filterByShortnames,
    filterByAfterPublishDate,
    filterByBeforePublishDate,
    filterByApprovalStatus,
  }: {
    filterByShortnames?: string[]
    filterByAfterPublishDate?: Date
    filterByBeforePublishDate?: Date
    filterByApprovalStatus?: string
  },
  prisma: ReleasePrisma
) {
  if (filterByShortnames?.length) {
    await releaseAsserts.assertFilteredShortnamesExist(filterByShortnames, prisma)
  }

  return {
    ...(filterByShortnames?.length && {
      OR: filterByShortnames.map((shortname) => ({
        variant: {
          statistic: {
            shortname: {
              name: shortname,
            },
          },
        },
      })),
    }),
    ...((filterByBeforePublishDate || filterByAfterPublishDate) && {
      publish_time: {
        ...(filterByBeforePublishDate && {
          lte: filterByBeforePublishDate,
        }),

        ...(filterByAfterPublishDate && {
          gte: filterByAfterPublishDate,
        }),
      },
    }),
    ...(filterByApprovalStatus && {
      desk_appoval_status: filterByApprovalStatus,
    }),
  }
}

export async function buildVariantReleaseFilter(
  { shortname, variantId }: { shortname: string; variantId: number },
  prisma: ReleasePrisma
) {
  await Promise.all([
    releaseAsserts.assertStatisticExists(shortname, prisma),
    releaseAsserts.assertVariantExists(variantId, prisma),
  ])

  await releaseAsserts.assertVariantMatchesShortname(variantId, shortname, prisma)

  return {
    variant: {
      id: variantId,
    },
  }
}

export async function updateRelease(
  prisma: ReleasePrisma,
  id: string,
  body: ReleaseUpdate | undefined,
  now = new Date()
): Promise<ReleaseDetails> {
  const idAsNumber = parseId(id)

  if (body?.archived === true && !isCurrentUserAdmin()) {
    throw new StatregError('Only admins can archive releases')
  }

  const validatedInput = await parseReleaseInput(prisma, body, 'update')

  const release = await prisma.release.update({
    include: ReleaseDetailsIncludes,
    where: { id: idAsNumber },
    data: {
      publish_time: validatedInput.publishTimeDate,
      period_from: validatedInput.periodFromDate,
      period_to: validatedInput.periodToDate,
      release_date_precision: validatedInput.releaseDatePrecision,
      ...(body?.archived !== undefined && { archived: body.archived }),
      desk_appoval_status: isCurrentUserAdmin() ? ApprovalStatus.ACCEPTED : ApprovalStatus.PENDING,
      last_updated: now,
      comment: validatedInput.comment,
    },
  })

  return mapToReleaseDetails(release)
}

type ReleaseApproveResponse = ReleasesBulkApproveResponse['releases'][number]

async function approveRelease(prisma: ReleasePrisma, id: number): Promise<ReleaseApproveResponse> {
  try {
    await prisma.release.update({
      where: { id },
      data: {
        desk_appoval_status: ApprovalStatus.ACCEPTED,
        last_updated: new Date(),
      },
    })
    return { id, status: 200 }
  } catch (error) {
    if (error instanceof Error) {
      const knownErrorMessage = checkForKnownPrismaErrors(error)
      if (knownErrorMessage) {
        return { id, status: 400, message: knownErrorMessage }
      }
    }
    return { id, status: 500 }
  }
}

export async function bulkApproveReleases(prisma: ReleasePrisma, ids: number[]): Promise<ReleasesBulkApproveResponse> {
  const releases = []

  for (const id of ids) {
    releases.push(await approveRelease(prisma, id))
  }

  return { releases }
}

type ValidatedReleaseInput = {
  publishTimeDate: Date
  periodFromDate: Date
  periodToDate: Date
  releaseDatePrecision: string
  comment: string
  archived?: boolean
}

export async function parseReleaseInput(
  prisma: ReleasePrisma,
  body: ReleaseUpdate | undefined,
  type: 'create' | 'update' = 'create'
): Promise<ValidatedReleaseInput> {
  const createFields: (keyof ReleaseCreate)[] = ['publish_time', 'period_from', 'period_to', 'release_date_precision']

  const requiredFields: (keyof ReleaseUpdate)[] = type === 'create' ? createFields : [...createFields, 'comment']

  const { publish_time, period_from, period_to, release_date_precision, comment } =
    ensureRequiredFieldsExists(body, requiredFields) ?? {}

  const safeComment = sanitize(comment)
  if (type === 'update') {
    if (!safeComment) {
      throw new StatregError("Field 'comment' must be a non-empty string.")
    }
  }

  const publishTimeDate = parseDateISO(publish_time, 'publish_time')
  const periodFromDate = parseDateOnly(period_from, 'period_from')
  const periodToDate = parseDateOnly(period_to, 'period_to')

  if (periodFromDate > periodToDate) {
    throw new StatregError('End of measuring period cannot be earlier than start of measuring period')
  }
  if (periodToDate > publishTimeDate) {
    throw new StatregError('Publish time cannot be earlier than end of measuring period')
  }

  const isAdmin = isCurrentUserAdmin()

  if (!isAdmin && (await isDateBlocked(getDateOnlyAsString(publishTimeDate), prisma))) {
    throw new StatregError('The given date is full or blocked')
  }

  // Non-admins can only create releases with a publish time more than three months from now
  if (!isAdmin && !releaseAsserts.assertReleaseDateIsMoreThanThreeMonthsAway(publishTimeDate)) {
    throw new StatregError('Publish time must be later than three months from now')
  }

  // TODO check that release_data_precision is enum
  return {
    publishTimeDate,
    periodFromDate: periodFromDate,
    periodToDate: periodToDate,
    releaseDatePrecision: sanitize(release_date_precision!),
    comment: safeComment,
  }
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
  const { statistic, frequency } = prismaRelease.variant

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
        code: prismaRelease.variant.revision,
      },
    },
    statistic: {
      shortname: statistic.shortname.name,
      name: statistic.name,
      name_en: statistic.name_en ?? '',
    },
    period_from: getDateOnlyAsString(prismaRelease.period_from),
    period_to: getDateOnlyAsString(prismaRelease.period_to),
    release_date_precision: prismaRelease.release_date_precision,
    cancelled: prismaRelease.cancelled,
  }
}
