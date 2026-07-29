import { type StatisticDetails, ApprovalStatus } from '@ssbno-statreg/shared'
import { dateToISOString, sanitize } from '@/lib/utils'
import type { Prisma } from '@/generated/prisma/client'
import { getDivisionFromCode } from '@/services/klassService'
import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'
import { statisticsAsserts } from '@/lib/asserts'
import { getAllUsersFromCache } from '@/lib/cache'
import { PostStatisticsByShortnameBody, PutStatisticsByShortnameBody } from '@/parser'

export type StatisticPrisma = Pick<PrismaClient, 'statistic' | 'shortname' | 'responsiblePerson' | 'region_level'>

type StatisticPrismaResult = Prisma.StatisticGetPayload<{ include: typeof StatisticsDetailedIncludes }>

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

  if (!getDivisionFromCode(body.division)) {
    throw { statregError: "Field 'division' does not correspond to an existing division." }
  }

  let newContacts
  if (body.contacts) {
    newContacts = await upsertContacts(body.contacts, prisma)

    if (body.status === 'A' && newContacts.length === 0) {
      throw { statregError: 'An active statistic needs at least one contact' }
    }
  }

  const result = await prisma.statistic.create({
    data: {
      shortname: {
        connect: {
          name: safeShortname,
        },
      },
      name: safeName,
      name_en: safeNameEn,
      priority: 1,
      yearly_reporting: false,
      status: body.status,
      desk_appoval_status: ApprovalStatus.ACCEPTED,
      language: body.main_language ?? 'nb',
      date_created: now,
      last_updated: now,
      comment: sanitize(body.comment) || `Create statistic with shortname: ${shortname}`,
      division_code: body.division,
      ...(body.first_released_at && {
        first_release: new Date(body.first_released_at),
      }),
      ...(body.statistic_region_levels && {
        statistic_region_levels: {
          create: body.statistic_region_levels.map((code) => ({
            region_level: { connect: { code } },
          })),
        },
      }),
      ...(newContacts && {
        responsiblePersons: {
          connect: newContacts.map((contact) => ({ id: contact.id })),
        },
      }),
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

  if (!existingStatistic) throw { status: 404, statregError: `Shortname ${safeShortname} not found` }

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
      throw { statregError: 'An active statistic needs at least one contact' }
    }
  }

  const updatedStatistic = await prisma.statistic.update({
    where: { id: existingStatistic.id },
    data: {
      name: safeName,
      name_en: safeNameEn,
      division_code: body.division,
      desk_appoval_status: ApprovalStatus.PENDING,
      status: body.status,
      comment: sanitize(body.comment),
      language: body.main_language,
      related_statistic_id: body.relation,
      legacy_topic_codes: body.previous_topic_codes,
      yearly_reporting: body.yearly_reporting,
      first_release: new Date(body.first_released_at),
      statistic_region_levels: {
        deleteMany: {},
        create: body.statistic_region_levels.map((code) => ({
          region_level: { connect: { code } },
        })),
      },
      ...(newContacts && {
        responsiblePersons: {
          set: newContacts.map((contact) => ({ id: contact.id })),
        },
      }),
    },
    include: StatisticsDetailedIncludes,
  })
  return await mapStatisticDetails(updatedStatistic)
}

// Helpers

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
    variants: mapStatisticVariants(statistic.variants),
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

export function mapStatisticVariants(
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
