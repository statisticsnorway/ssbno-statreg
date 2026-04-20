import type { ReleaseDetails, ReleaseListing, ReleaseCreate, ReleaseUpdate } from '@ssbno-statreg/shared'
import { ApprovalStatus } from '@ssbno-statreg/shared/enums'
import { dateToISOString, sanitize, parseDateISO, parseId, ensureRequiredFieldsExists } from '@/lib/utils'
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
  const safeShortname = sanitize(shortname)
  const parsedVariantId = variantId ? parseId(variantId) : undefined

  const where = await buildReleaseFilter({ shortname: safeShortname, variantId: parsedVariantId }, prisma)

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
  const idAsNumber = parseId(id, 'release')
  const release = await prisma.release.findFirst({
    where: { id: idAsNumber },
    include: ReleaseDetailsIncludes,
  })

  if (!release) return Promise.reject({ status: 404, statregError: `Release ${idAsNumber} not found` })

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

  const { publishTimeDate, periodFromDate, periodToDate, releaseDatePrecision } = parseReleaseInput(body)

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
      desk_appoval_status: ApprovalStatus.PENDING,
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
  { shortname, variantId }: { shortname?: string; variantId?: number },
  prisma: ReleasePrisma
) {
  if (!shortname && variantId === undefined) return

  if (shortname) {
    await releaseAsserts.assertStatisticExists(shortname, prisma)
  }

  if (variantId !== undefined) {
    await releaseAsserts.assertVariantExists(variantId, prisma)
  }

  if (shortname && variantId !== undefined) {
    await releaseAsserts.assertVariantMatchesShortname(variantId, shortname, prisma)
  }

  const where: any = { variant: {} }

  if (variantId !== undefined) {
    where.variant.id = variantId
  }

  if (shortname) {
    where.variant.statistic = {
      shortname: { name: shortname },
    }
  }

  return where
}

export async function updateRelease(
  prisma: ReleasePrisma,
  id: string,
  body: ReleaseUpdate | undefined,
  now = new Date()
): Promise<ReleaseDetails> {
  const idAsNumber = parseId(id)

  const validatedInput = parseReleaseInput(body, 'update')

  const release = await prisma.release.update({
    include: ReleaseDetailsIncludes,
    where: { id: idAsNumber },
    data: {
      publish_time: validatedInput.publishTimeDate,
      period_from: validatedInput.periodFromDate,
      period_to: validatedInput.periodToDate,
      release_date_precision: validatedInput.releaseDatePrecision,
      desk_appoval_status: ApprovalStatus.PENDING,
      last_updated: now,
      comment: validatedInput.comment,
    },
  })

  return mapToReleaseDetails(release)
}

type ValidatedReleaseInput = {
  publishTimeDate: Date
  periodFromDate: Date
  periodToDate: Date
  releaseDatePrecision: string
  comment: string
}

export function parseReleaseInput(
  body: ReleaseUpdate | undefined,
  type: 'create' | 'update' = 'create'
): ValidatedReleaseInput {
  let createFields: (keyof ReleaseCreate)[] = ['publish_time', 'period_from', 'period_to', 'release_date_precision']

  const requiredFields: (keyof ReleaseUpdate)[] = type === 'create' ? createFields : [...createFields, 'comment']

  const { publish_time, period_from, period_to, release_date_precision, comment } =
    ensureRequiredFieldsExists(body, requiredFields) ?? {}

  const safeComment = sanitize(comment)
  if (type === 'update') {
    if (!safeComment) {
      throw { statregError: "Field 'comment' must be a non-empty string." }
    }
  }

  // TODO check that release_data_precision is enum
  // TODO: MIM-2577: Use function for blocked days once it's implemented
  // TODO: Automatic suggestion of period_to and period_from is going to be solved in a seperate task
  return {
    publishTimeDate: parseDateISO(publish_time, 'publish_time'),
    periodFromDate: parseDateISO(period_from, 'period_from'),
    periodToDate: parseDateISO(period_to, 'period_to'),
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
