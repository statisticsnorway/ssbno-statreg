import type { StatisticListing, StatisticDetails, StatisticUpdate, StatisticCreate } from '@/types/index'
import { dateToISOString, sanitize } from '@/lib/utils'
import type { Prisma } from '@/generated/prisma/client'
import { getDivisionFromCode } from '@/services/klassService'
import { fetchUsers } from '@/services/entraUserService'
import type { UserLookupItem, Users } from '@/types/entra'
import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'
import { ApprovalStatus } from '@/types/enums'

type StatisticPrisma = Pick<PrismaClient, 'statistic'>

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

async function mapStatisticDetails(statistic: StatisticPrismaResult) {
  const main_language = statistic.language
  const division_code = statistic.division_code
  const related_statistic = statistic.related_statistic

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
    relation: {
      shortname: related_statistic?.shortname?.name,
      name: related_statistic?.name,
      name_en: related_statistic?.name_en ?? '',
    },
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

  return mapStatisticDetails(statistic)
}

export async function updateStatistic(
  shortname: string,
  body: StatisticUpdate,
  prisma: StatisticPrisma
): Promise<StatisticDetails> {
  const {
    division,
    // statistic_region_levels,
    status,
    name,
    name_en,
    approval_status,
    relation,
    previous_topic_codes,
    yearly_reporting,
    first_released_at,
    main_language,
    comment,
  } = body ?? {}

  const safeShortname = sanitize(shortname)
  // TODO MIM-2593: input validation
  // TODO: Reuse shortname validation from MIM-2545
  const statistic = await prisma.statistic.findFirst({
    where: { shortname: { name: safeShortname } },
    select: { id: true, statistic_region_levels: { select: { region_level: { select: { code: true, id: true } } } } },
  })

  if (!statistic) return Promise.reject({ status: 404, statregError: `Shortname ${safeShortname} not found` })

  // TODO MIM-2595: Handle removal and additions of region_levels
  // const regionLevelsToRemove = statistic.statistic_region_levels.map(
  //   (existingRegLvl) => !statistic_region_levels?.find(incomingRegLvl => incomingRegLvl === existingRegLvl.region_level.code)
  // )
  // const regionLevelsToAdd = statistic_region_levels?.map(
  //   (incomingRegLvl) => !statistic.statistic_region_levels?.find(existingRegLvl => incomingRegLvl === existingRegLvl.region_level.code)
  // )

  //TODO MIM-2590: Make include statement to a variable
  const updatedStatistic = await prisma.statistic.update({
    where: { id: statistic.id },
    data: {
      name: name,
      name_en: name_en,
      division_code: division,
      desk_appoval_status: approval_status,
      status: status!.code,
      comment,
      language: main_language,
      related_statistic_id: relation ? Number(relation) : null,
      legacy_topic_codes: previous_topic_codes,
      yearly_reporting,
      first_release: first_released_at,
      statistic_region_levels: {},
    },
    include: StatisticsDetailedIncludes,
  })

  const result = mapStatisticDetails(updatedStatistic)

  return result
}

export async function createStatistic(
  prisma: StatisticPrisma,
  shortname: string,
  body?: StatisticCreate,
  now = new Date()
): Promise<StatisticDetails> {
  // TODO: Fix proper validation! Check existance of shortname, as well as other parameters.

  if (!body?.name) {
    return Promise.reject({ status: 400, statregError: 'Norwegian name is required' })
  }

  const result = await prisma.statistic.create({
    data: {
      name: body.name,
      priority: 1,
      name_en: body.name_en,
      yearly_reporting: false,
      status: 'K',
      comment: body.comment ?? '',
      language: 'nb',
      date_created: now,
      last_updated: now,
      shortname: {
        connect: {
          name: shortname,
        },
      },
    },
    include: StatisticsDetailedIncludes,
  })
  return await mapStatisticDetails(result)
}
