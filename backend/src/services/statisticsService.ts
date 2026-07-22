import { type Contact, type StatisticDetails, ApprovalStatus, StatisticListingResponse } from '@ssbno-statreg/shared'
import { dateToISOString, sanitize } from '@/lib/utils'
import type { Prisma } from '@/generated/prisma/client'
import { getDivisionFromCode } from '@/services/klassService'
import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'
import { statisticsAsserts } from '@/lib/asserts'
import { getAllUsersFromCache } from '@/lib/cache'
import { PostStatisticsByShortnameBody, PutStatisticsByShortnameBody } from '@/parser'

export type StatisticPrisma = Pick<PrismaClient, 'statistic' | 'shortname' | 'responsiblePerson' | 'region_level'>

// Statistic listing

export async function getFilteredStatistics(
  {
    start = 0,
    count = 10,
    filterByShortnames,
    filterByContactPrincipalName,
    sort,
  }: {
    start?: number
    count?: number
    filterByShortnames?: string[]
    filterByContactPrincipalName?: string[]
    sort?: string
  },
  prisma: StatisticPrisma
): Promise<StatisticListingResponse> {
  const safeFilterByShortnames = filterByShortnames?.length
    ? filterByShortnames.map((shortname) => sanitize(shortname))
    : undefined

  const where = await buildStatisticFilter(
    { filterByShortnames: safeFilterByShortnames, filterByContactPrincipalName },
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
    filterByContactPrincipalName,
  }: { filterByShortnames?: string[]; filterByContactPrincipalName?: string[] },
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
    ...(filterByContactPrincipalName?.length && {
      responsiblePersons: {
        some: {
          principalName: { in: filterByContactPrincipalName },
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
      responsiblePersons: { select: { principalName: true } },
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
      const contacts = statistic.responsiblePersons.map(({ principalName }) => {
        const user = users[principalName]
        return {
          name: user?.displayName ?? '',
          principalName: principalName,
        }
      })

      return {
        shortname: statistic.shortname.name,
        main_language,
        status: {
          code: statistic.status,
        },
        division: {
          name: getDivisionFromCode(divisionCode)?.name,
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
  responsiblePersons: { select: { principalName: true } },
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
  const division_code = statistic.division_code ?? ''
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
      name: getDivisionFromCode(division_code)?.name,
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
    contacts: statistic.responsiblePersons.map(({ principalName }) => {
      const user = users[principalName]
      return {
        name: user?.displayName ?? '',
        principalName: principalName,
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

// Create statistic

export async function createStatistic(
  prisma: StatisticPrisma,
  shortname: string,
  body: PostStatisticsByShortnameBody,
  now = new Date()
): Promise<StatisticDetails> {
  const safeShortname = sanitize(shortname)

  await statisticsAsserts.assertShortnameExists(safeShortname, prisma)
  await statisticsAsserts.assertShortnameExistsAndIsAvailable(safeShortname, prisma)

  const safeName = sanitize(body.name)
  const safeNameEn = sanitize(body.name_en)

  if (!safeName) {
    throw { statregError: "Field 'name' must be a non-empty string." }
  }

  if (body.status === 'A' && !safeNameEn) {
    throw { statregError: "Field 'name_en' must be a non-empty string." }
  }

  if (body.division && !getDivisionFromCode(body.division)) {
    throw { statregError: "Field 'division' does not correspond to an existing division." }
  }

  let newContacts
  if (body.contacts) {
    newContacts = await upsertContacts(body.contacts, prisma)

    if (body.status === 'A' && newContacts.length === 0) {
      return Promise.reject({ statregError: 'An active statistic needs at least one contact' })
    }
  }

  const result = await prisma.statistic.create({
    data: {
      name: safeName,
      name_en: safeNameEn,
      priority: 1,
      yearly_reporting: false,
      status: body.status,
      desk_appoval_status: ApprovalStatus.ACCEPTED,
      language: body.main_language ?? 'nb',
      date_created: now,
      last_updated: now,
      first_release: body.first_released_at,
      comment: sanitize(body.comment) || `Create statistic with shortname: ${shortname}`,
      division_code: body.division,
      responsiblePersons: newContacts
        ? {
            connect: newContacts.map((contact) => ({ id: contact.id })),
          }
        : undefined,
      statistic_region_levels: {
        create: body.statistic_region_levels?.map((code) => ({
          region_level: { connect: { code } },
        })),
      },
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

// Update statistic

export async function updateStatistic(
  shortname: string,
  body: PutStatisticsByShortnameBody,
  prisma: StatisticPrisma
): Promise<StatisticDetails> {
  const safeShortname = sanitize(shortname)
  const existingStatistic = await prisma.statistic.findFirst({
    where: { shortname: { name: safeShortname } },
    select: { id: true },
  })

  if (!existingStatistic) return Promise.reject({ status: 404, statregError: `Shortname ${safeShortname} not found` })

  const safeName = sanitize(body.name)
  const safeNameEn = sanitize(body.name_en)

  if (!safeName) {
    throw { statregError: "Field 'name' must be a non-empty string." }
  }

  if (!safeNameEn) {
    throw { statregError: "Field 'name_en' must be a non-empty string." }
  }

  if (!getDivisionFromCode(body.division)) {
    throw { statregError: "Field 'division' does not correspond to an existing division." }
  }

  let newContacts
  if (body.contacts) {
    newContacts = await upsertContacts(body.contacts, prisma)

    if (body.status === 'A' && newContacts.length === 0) {
      return Promise.reject({ statregError: 'An active statistic needs at least one contact' })
    }
  }

  const regionLevels = await prisma.region_level.findMany({
    where: { code: { in: body.statistic_region_levels } },
    select: { id: true },
  })

  const updatedStatistic = await prisma.statistic.update({
    where: { id: existingStatistic.id },
    data: {
      name: safeName,
      name_en: safeNameEn,
      division_code: body.division,
      desk_appoval_status: ApprovalStatus.PENDING,
      status: body.status,
      comment: sanitize(body.status),
      language: body.main_language,
      related_statistic_id: body.relation,
      legacy_topic_codes: body.previous_topic_codes,
      yearly_reporting: body.yearly_reporting,
      first_release: new Date(body.first_released_at),
      responsiblePersons: newContacts
        ? {
            set: newContacts.map((contact) => ({ id: contact.id })),
          }
        : undefined,
      statistic_region_levels: {
        deleteMany: {},
        create: regionLevels.map((level) => ({
          region_level: { connect: { id: level.id } },
        })),
      },
    },
    include: StatisticsDetailedIncludes,
  })
  return await mapStatisticDetails(updatedStatistic)
}

// Update statistic contacts

async function upsertContacts(principalNames: string[], prisma: StatisticPrisma) {
  const users = await getAllUsersFromCache()

  const uniquePrincipalNames = [...new Set(principalNames)]
  const knownPrincipalNames = uniquePrincipalNames.filter((principalName) => users[principalName])

  return await Promise.all(
    knownPrincipalNames.map((principalName) =>
      prisma.responsiblePerson.upsert({
        where: { principalName },
        create: { principalName },
        update: {},
      })
    )
  )
}

export async function updateStatisticContacts(
  shortname: string,
  newPrincipalNames: string[],
  prisma: StatisticPrisma
): Promise<Contact[]> {
  const safeShortname = sanitize(shortname)

  const existingStatistic = await prisma.statistic.findFirst({
    where: { shortname: { name: safeShortname } },
    select: { id: true, status: true },
  })
  if (!existingStatistic) {
    return Promise.reject({ status: 404, statregError: `Shortname '${safeShortname}' not found` })
  }

  const newContacts = await upsertContacts(newPrincipalNames, prisma)

  if (existingStatistic.status === 'A' && newContacts.length === 0) {
    return Promise.reject({ statregError: 'An active statistic needs at least one contact' })
  }

  const updatedStatistic = await prisma.statistic.update({
    // https://docs.prisma.io/docs/orm/reference/prisma-client-reference#set
    where: { id: existingStatistic.id },
    data: {
      responsiblePersons: {
        set: newContacts.map((contact) => ({ id: contact.id })),
      },
    },
    select: { responsiblePersons: { select: { principalName: true } } },
  })

  const users = await getAllUsersFromCache()
  return updatedStatistic.responsiblePersons.map((person) => ({
    name: users[person.principalName]?.displayName ?? '',
    principalName: person.principalName,
  }))
}
