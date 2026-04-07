import type { StatisticListing, StatisticDetails, StatisticUpdate, StatisticCreate } from '@/types/index'
import { dateToISOString, sanitize, validateDateOnly, ensureRequiredFieldsExists, isNumber } from '@/lib/utils'
import type { Prisma } from '@/generated/prisma/client'
import { getDivisionFromCode } from '@/services/klassService'
import { fetchUsers } from '@/services/entraUserService'
import type { UserLookupItem, Users } from '@/types/entra'
import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'
import { ApprovalStatus, StatisticStatus } from '@/types/enums'
import { statisticsAsserts } from '@/lib/asserts'

export type StatisticPrisma = Pick<PrismaClient, 'statistic' | 'shortname'>

// Statistic listing

export async function getAllStatistics(
  { start = 0, count = 10 },
  prisma: StatisticPrisma
): Promise<StatisticListing[]> {
  const statistics = await prisma.statistic.findMany({
    skip: start,
    take: count,
    select: {
      language: true,
      status: true,
      name: true,
      name_en: true,
      shortname: { select: { name: true } },
      responsiblePersons: { select: { username: true, email: true } },
    },
  })

  return statistics.map((statistic) => {
    const main_language = statistic.language
    return {
      shortname: statistic.shortname.name,
      main_language,
      status: {
        code: statistic.status,
      },
      name: statistic.name,
      name_en: statistic.name_en ?? '',
      contacts: statistic.responsiblePersons,
    }
  })
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
  responsiblePersons: { select: { email: true, username: true } },
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
    revision: variant.revision,
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
    contacts: await fetchUsers(statistic.responsiblePersons).then((users) =>
      users?.map((user) => {
        const lookupUser = (user as UserLookupItem).user
        const responsiblePerson = user as Users

        // TODO bug: when fetchUsers "succeeds", username is always undefined
        return {
          name: lookupUser?.displayName,
          email: lookupUser?.email ?? (user as UserLookupItem).lookupEmail ?? responsiblePerson.email,
          username: responsiblePerson.username as string | undefined,
        }
      })
    ),
    statistic_region_levels: statistic.statistic_region_levels?.map(({ region_level }) => {
      return { name: region_level.name, code: region_level.code ?? '' }
    }),
  }
}

export async function getStatisticByShortname(shortname: string, prisma: StatisticPrisma): Promise<StatisticDetails> {
  const statistic = await prisma.statistic.findFirst({
    where: { shortname: { name: sanitize(shortname) } },
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
  } = validateStatisticInput(body, requiredFields, 'update')

  const safeShortname = sanitize(shortname)
  // TODO: Can we reuse assert functions when we expect statistics to be returned by the function?
  const statistic = await prisma.statistic.findFirst({
    where: { shortname: { name: safeShortname } },
    select: { id: true, statistic_region_levels: { select: { region_level: { select: { code: true, id: true } } } } },
  })

  if (!statistic) return Promise.reject({ status: 404, statregError: `Shortname ${safeShortname} not found` })

  const regionLevelsToRemove = statistic.statistic_region_levels.filter(
    (existingRegLvl) =>
      !statistic_region_levels?.find((incomingRegLvl) => incomingRegLvl === existingRegLvl.region_level.code)
  )
  const deleteRegionLevelStatement = regionLevelsToRemove.map((regLvl) => {
    return { statistic_id_region_level_id: { statistic_id: statistic.id, region_level_id: regLvl.region_level.id } }
  })

  const regionLevelsToAdd = statistic_region_levels.filter(
    (incomingRegLvl) =>
      incomingRegLvl.code &&
      !statistic.statistic_region_levels?.find((existingRegLvl) => incomingRegLvl === existingRegLvl.region_level.code)
  )
  const createRegionLevelStatement = regionLevelsToAdd.map((regLvl) => {
    return { region_level: { connect: { code: regLvl.code } } }
  })

  const updatedStatistic = await prisma.statistic.update({
    where: { id: statistic.id },
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

  const requiredFields: (keyof StatisticCreate)[] = ['division', 'name', 'name_en', 'first_released_at']
  const { division, name, name_en, first_released_at, main_language, comment } = validateStatisticInput(
    body,
    requiredFields
  )

  await statisticsAsserts.assertShortnameExists(safeShortname, prisma)
  await statisticsAsserts.assertShortnameExistsAndIsAvailable(safeShortname, prisma)

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
  relation?: number
}

export function validateStatisticInput(
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

  if (!name) {
    throw { statregError: "Field 'name' must be a non-empty string." }
  }

  if (!isNumber(division)) {
    throw { statregError: "Field 'division' must be a number." }
  }

  if (!getDivisionFromCode(Number(division))) {
    throw { statregError: "Field 'division' does not correspond to an existing division." }
  }

  if (main_language !== 'nb' && main_language !== 'nn') {
    throw { statregError: "Field 'main_language' must be either 'nb' or 'nn'." }
  }

  const validatedInput = {
    division,
    name: sanitize(name),
    name_en: sanitize(name_en!),
    first_released_at: validateDateOnly(first_released_at!),
    main_language: sanitize(main_language),
    comment: comment ? sanitize(comment) : '',
  }

  if (type === 'update') {
    if (typeof yearly_reporting !== 'boolean') {
      throw { statregError: "Field 'yearly_reporting' must be a boolean." }
    }

    if (!Object.keys(StatisticStatus).includes(status?.code!)) {
      throw { statregError: `Field 'status' must be one of these: ${Object.keys(StatisticStatus).join(', ')}.` }
    }

    if (!isNumber(relation)) {
      throw { statregError: "Field 'relation' must be a number." }
    }

    return {
      ...validatedInput,
      statistic_region_levels,
      status: sanitize(status?.code!),
      previous_topic_codes: sanitize(previous_topic_codes!),
      yearly_reporting: Boolean(yearly_reporting),
      relation: Number(relation),
    }
  }

  return validatedInput
}
