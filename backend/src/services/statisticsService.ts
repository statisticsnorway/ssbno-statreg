import {
  type StatisticDetails,
  type StatisticUpdate,
  type StatisticCreate,
  ApprovalStatus,
  StatisticStatus,
  StatisticListingResponse,
} from '@ssbno-statreg/shared'
import { dateToISOString, sanitize, parseDateOnly, ensureRequiredFieldsExists, isNumber, parseId } from '@/lib/utils'
import type { Prisma } from '@/generated/prisma/client'
import { getDivisionFromCode } from '@/services/klassService'
import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'
import { statisticsAsserts } from '@/lib/asserts'
import { getAllUsersFromCache } from '@/lib/cache'

export type StatisticPrisma = Pick<PrismaClient, 'statistic' | 'shortname'>

// Statistic listing

export async function getFilteredStatistics(
  {
    start = 0,
    count = 10,
    filterByShortnames,
    filterByContactInitials,
    sort,
  }: {
    start?: number
    count?: number
    filterByShortnames?: string[]
    filterByContactInitials?: string[]
    sort?: string
  },
  prisma: StatisticPrisma
): Promise<StatisticListingResponse> {
  const safeFilterByShortnames = filterByShortnames?.length
    ? filterByShortnames.map((shortname) => sanitize(shortname))
    : undefined

  const where = await buildStatisticFilter(
    { filterByShortnames: safeFilterByShortnames, filterByContactInitials },
    prisma
  )

  return getStatistics({ start, count, where, orderBy: parseStatisticSortQuery(sort) }, prisma)
}

function parseStatisticSortQuery(sort?: string): Prisma.StatisticOrderByWithRelationInput | undefined {
  if (sort === 'shortname') {
    return { shortname: { name: 'asc' } }
  }
  if (sort === '-shortname') {
    return { shortname: { name: 'desc' } }
  }
  return undefined
}

export async function buildStatisticFilter(
  {
    filterByShortnames,
    filterByContactInitials,
  }: { filterByShortnames?: string[]; filterByContactInitials?: string[] },
  prisma: StatisticPrisma
) {
  if (filterByShortnames?.length) {
    await statisticsAsserts.assertFilteredShortnamesExist(filterByShortnames, prisma)
  }

  return {
    ...(filterByShortnames?.length && {
      OR: filterByShortnames.map((shortname) => ({
        shortname: {
          name: shortname,
        },
      })),
    }),
    ...(filterByContactInitials?.length && {
      responsiblePersons: {
        some: {
          username: { in: filterByContactInitials },
        },
      },
    }),
  }
}

export async function getStatistics(
  {
    start = 0,
    count = 10,
    where,
    orderBy,
  }: {
    start?: number
    count?: number
    where?: Prisma.StatisticWhereInput
    orderBy?: Prisma.StatisticOrderByWithRelationInput
  },
  prisma: StatisticPrisma
): Promise<StatisticListingResponse> {
  const statistics = await prisma.statistic.findMany({
    skip: start,
    take: count,
    where,
    orderBy,
    select: {
      language: true,
      status: true,
      name: true,
      name_en: true,
      shortname: { select: { name: true } },
      responsiblePersons: { select: { username: true } },
      division_code: true,
    },
  })
  const total = await prisma.statistic.count({ where })
  const users = await getAllUsersFromCache()

  return {
    total,
    statistics: statistics.map((statistic) => {
      const main_language = statistic.language
      const divisionCode = statistic.division_code ?? ''
      const contacts = statistic.responsiblePersons.map(({ username }) => {
        const user = users[username ? username + '@ssb.no' : '']
        return {
          name: user?.displayName ?? '',
          userPrincipalName: user?.userPrincipalName ?? '',
        }
      })

      return {
        shortname: statistic.shortname.name,
        main_language,
        status: {
          code: statistic.status,
        },
        division: {
          name: getDivisionFromCode(Number(divisionCode))?.name,
          code: divisionCode,
        },
        name: statistic.name,
        name_en: statistic.name_en ?? '',
        contacts,
      }
    }),
  }
}

// Statistic details

type StatisticPrismaResult = Prisma.StatisticGetPayload<{ include: typeof StatisticsDetailedIncludes }>

const VariantSelect = {
  omit: { version: true, statistic_id: true, freq_id: true },
  include: {
    frequency: { select: { name: true, code: true } },
  },
}

export const StatisticsDetailedIncludes = {
  shortname: { select: { name: true } },
  responsiblePersons: { select: { username: true } },
  related_statistic: { select: { language: true, name: true, name_en: true, shortname: { select: { name: true } } } },
  statistic_region_levels: {
    select: { region_level: { select: { name: true, code: true } } },
  },
  variants: VariantSelect,
}

export function parseStatisticVariants(
  variants: Prisma.VariantGetPayload<typeof VariantSelect>[] | undefined
): StatisticDetails['variants'] {
  if (!variants?.length) return []

  return variants.map((variant) => ({
    id: variant.id,
    updated_at: dateToISOString(variant.last_updated),
    level_of_detail: {
      name: variant.level_of_detail ?? '',
      name_en: variant.level_of_detail_en ?? '',
    },
    created_at: dateToISOString(variant.date_created),
    cancelled: variant.cancelled,
    frequency: {
      name: variant.frequency.name,
      code: variant.frequency.code,
    },
    revision: {
      code: variant.revision,
    },
  }))
}

export async function mapStatisticDetails(statistic: StatisticPrismaResult): Promise<StatisticDetails> {
  const main_language = statistic.language
  const division_code = statistic.division_code
  const relation = statistic.related_statistic?.shortname
    ? {
        shortname: statistic.related_statistic?.shortname?.name,
        name: statistic.related_statistic?.name,
        name_en: statistic.related_statistic?.name_en ?? '',
      }
    : {}
  const users = await getAllUsersFromCache()

  return {
    version: statistic.version,
    shortname: statistic.shortname.name,
    approval_status: statistic.desk_appoval_status ?? ApprovalStatus.PENDING,
    main_language,
    division: {
      code: division_code,
      name: getDivisionFromCode(Number(division_code))?.name,
    },
    first_released_at: dateToISOString(statistic.first_release),
    yearly_reporting: statistic.yearly_reporting,
    status: {
      code: statistic.status,
    },
    previous_topic_codes: statistic.legacy_topic_codes,
    relation,
    name: statistic.name,
    name_en: statistic.name_en ?? '',
    updated_at: dateToISOString(statistic.last_updated),
    comment: statistic.comment,
    created_at: dateToISOString(statistic.date_created),
    variants: parseStatisticVariants(statistic.variants),
    contacts: statistic.responsiblePersons.map(({ username }) => {
      const user = users[username ? username + '@ssb.no' : '']
      return {
        name: user?.displayName ?? '',
        userPrincipalName: user?.userPrincipalName ?? '',
      }
    }),
    statistic_region_levels: statistic.statistic_region_levels?.map(({ region_level }) => {
      return { name: region_level.name, code: region_level.code ?? '' }
    }),
  }
}

export async function getStatisticByShortname(shortname: string, prisma: StatisticPrisma): Promise<StatisticDetails> {
  const safeShortname = sanitize(shortname)

  const statistic = await prisma.statistic.findFirst({
    where: { shortname: { name: safeShortname } },
    include: StatisticsDetailedIncludes,
  })
  if (!statistic) return Promise.reject({ status: 404, statregError: 'Shortname not found' })

  return await mapStatisticDetails(statistic)
}

export async function updateStatistic(
  shortname: string,
  body: StatisticUpdate,
  prisma: StatisticPrisma
): Promise<StatisticDetails> {
  const requiredFields: (keyof StatisticUpdate)[] = [
    'division',
    'statistic_region_levels',
    'status',
    'name',
    'name_en',
    'relation',
    'previous_topic_codes',
    'yearly_reporting',
    'first_released_at',
    'main_language',
    'comment',
  ]

  const safeShortname = sanitize(shortname)
  const existingStatistic = await prisma.statistic.findFirst({
    where: { shortname: { name: safeShortname } },
    select: { id: true, statistic_region_levels: { select: { region_level: { select: { code: true, id: true } } } } },
  })

  if (!existingStatistic) return Promise.reject({ status: 404, statregError: `Shortname ${safeShortname} not found` })

  const {
    division,
    statistic_region_levels = [],
    status,
    name,
    name_en,
    relation,
    previous_topic_codes,
    yearly_reporting,
    first_released_at,
    main_language,
    comment,
  } = parseStatisticInput(body, requiredFields, 'update')

  const regionLevelsToRemove = existingStatistic.statistic_region_levels.filter(
    (existingRegLvl) =>
      !statistic_region_levels?.find((incomingRegLvl) => incomingRegLvl === existingRegLvl.region_level.code)
  )
  const deleteRegionLevelStatement = regionLevelsToRemove.map((regLvl) => {
    return {
      statistic_id_region_level_id: { statistic_id: existingStatistic.id, region_level_id: regLvl.region_level.id },
    }
  })

  const regionLevelsToAdd = statistic_region_levels.filter(
    (incomingRegLvl) =>
      incomingRegLvl.code &&
      !existingStatistic.statistic_region_levels?.find(
        (existingRegLvl) => incomingRegLvl === existingRegLvl.region_level.code
      )
  )
  const createRegionLevelStatement = regionLevelsToAdd.map((regLvl) => {
    return { region_level: { connect: { code: regLvl.code } } }
  })

  const updatedStatistic = await prisma.statistic.update({
    where: { id: existingStatistic.id },
    data: {
      name,
      name_en,
      division_code: division,
      desk_appoval_status: ApprovalStatus.PENDING,
      status,
      comment,
      language: main_language,
      related_statistic_id: relation,
      legacy_topic_codes: previous_topic_codes,
      yearly_reporting,
      first_release: first_released_at,
      statistic_region_levels: {
        create: createRegionLevelStatement,
        delete: deleteRegionLevelStatement,
      },
    },
    include: StatisticsDetailedIncludes,
  })

  return await mapStatisticDetails(updatedStatistic)
}

export async function createStatistic(
  prisma: StatisticPrisma,
  shortname: string,
  body?: StatisticCreate,
  now = new Date()
): Promise<StatisticDetails> {
  const safeShortname = sanitize(shortname)

  await statisticsAsserts.assertShortnameExists(safeShortname, prisma)
  await statisticsAsserts.assertShortnameExistsAndIsAvailable(safeShortname, prisma)

  const requiredFields: (keyof StatisticCreate)[] = ['division', 'name', 'name_en', 'first_released_at']
  const { division, name, name_en, first_released_at, main_language, comment } = parseStatisticInput(
    body,
    requiredFields
  )

  const result = await prisma.statistic.create({
    data: {
      name,
      name_en,
      priority: 1,
      yearly_reporting: false,
      status: 'K',
      desk_appoval_status: ApprovalStatus.ACCEPTED,
      language: main_language,
      date_created: now,
      last_updated: now,
      first_release: first_released_at,
      comment: comment || `Create statistic with shortname: ${shortname}`,
      division_code: division,
      shortname: {
        connect: {
          name: safeShortname,
        },
      },
    },
    include: StatisticsDetailedIncludes,
  })
  return await mapStatisticDetails(result)
}

type ValidatedStatisticInput = {
  division: string | null | undefined
  statistic_region_levels?: {
    code?: string | undefined
  }[]
  status?: string
  name: string
  name_en: string
  previous_topic_codes?: string
  yearly_reporting?: boolean
  first_released_at: Date
  main_language: string
  comment: string
  relation?: number | null
}

export function parseStatisticInput(
  body: StatisticCreate | StatisticUpdate | undefined,
  requiredFields: (keyof StatisticCreate)[] | (keyof StatisticUpdate)[],
  type: 'create' | 'update' = 'create'
): ValidatedStatisticInput {
  const {
    division,
    statistic_region_levels,
    status,
    name,
    name_en,
    previous_topic_codes,
    yearly_reporting,
    first_released_at,
    main_language,
    comment,
    relation,
  } = ensureRequiredFieldsExists(body as StatisticUpdate, requiredFields as (keyof StatisticUpdate)[])

  const safeName = sanitize(name)
  const safeNameEn = sanitize(name_en)
  const safeComment = sanitize(comment)

  if (!safeName) {
    throw { statregError: "Field 'name' must be a non-empty string." }
  }

  if (main_language !== 'nb' && main_language !== 'nn') {
    throw { statregError: "Field 'main_language' must be either 'nb' or 'nn'." }
  }

  const validatedInput = {
    division: parseDivision(division),
    name: safeName,
    name_en: safeNameEn,
    first_released_at: parseDateOnly(first_released_at!),
    main_language,
    comment: safeComment,
  }

  if (type === 'update') {
    if (typeof yearly_reporting !== 'boolean') {
      throw { statregError: "Field 'yearly_reporting' must be a boolean." }
    }

    if (!safeComment) {
      throw { statregError: "Field 'comment' must be a non-empty string." }
    }

    return {
      ...validatedInput,
      statistic_region_levels,
      status: parseStatusCode(status?.code),
      previous_topic_codes: sanitize(previous_topic_codes!),
      yearly_reporting: Boolean(yearly_reporting),
      relation: parseRelation(relation),
      comment: safeComment,
    }
  }

  return validatedInput
}

export function parseDivision(division?: string | null) {
  if (!division || !isNumber(division)) {
    throw { statregError: "Field 'division' must be a number." }
  }

  if (!getDivisionFromCode(Number(division))) {
    throw { statregError: "Field 'division' does not correspond to an existing division." }
  }

  return division.toString()
}

export function parseStatusCode(statusCode?: string): string {
  if (!statusCode || !Object.keys(StatisticStatus).includes(statusCode)) {
    throw { statregError: `Field 'status' must be one of these: ${Object.keys(StatisticStatus).join(', ')}.` }
  }
  return statusCode
}

export function parseRelation(relationId?: string | null): number | null {
  if (relationId) {
    return parseId(relationId, 'relation')
  }
  return null
}
