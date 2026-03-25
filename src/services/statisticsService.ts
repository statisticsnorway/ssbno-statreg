import type { StatisticListing, StatisticDetails, StatisticUpdate } from '@/types/index'
import { getLocalizedName, dateToISOString, sanitize } from '@/lib/utils'
import type { PrismaClient, Prisma } from '@/generated/prisma/client'
import { getDivisionFromCode } from '@/services/klassService'
import { fetchUsers } from '@/services/entraUserService'
import type { UserLookupItem, Users } from '@/types/entra'

type StatisticPrisma = Pick<PrismaClient, 'statistic'>
const lang_en = 'en'

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
      name: [...getLocalizedName(main_language, statistic.name), ...getLocalizedName(lang_en, statistic.name_en)],
      contacts: statistic.responsiblePersons,
    }
  })
}

// Statistic details

const VariantSelect = {
  omit: { version: true, statistic_id: true, freq_id: true },
  include: {
    frequency: { select: { name: true, name_en: true } },
  },
}

export function parseStatisticVariants(
  variants: Prisma.VariantGetPayload<typeof VariantSelect>[] | undefined,
  main_language: string,
  lang_en: string
): StatisticDetails['variants'] {
  if (!variants?.length) return []

  return variants.map((variant) => ({
    id: variant.id,
    updated_at: dateToISOString(variant.last_updated),
    level_of_detail: {
      name: [
        ...getLocalizedName(main_language, variant.level_of_detail),
        ...getLocalizedName(lang_en, variant.level_of_detail_en),
      ],
    },
    created_at: dateToISOString(variant.date_created),
    cancelled: variant.cancelled,
    frequency: {
      name: [
        ...getLocalizedName(main_language, variant.frequency.name),
        ...getLocalizedName(lang_en, variant.frequency.name_en),
      ],
    },
    revision: variant.revision,
  }))
}

export async function getStatisticByShortname(shortname: string, prisma: StatisticPrisma): Promise<StatisticDetails> {
  const statistic = await prisma.statistic.findFirst({
    where: { shortname: { name: sanitize(shortname) } },
    include: {
      shortname: { select: { name: true } },
      responsiblePersons: { select: { email: true, username: true } },
      related_statistic: { select: { language: true, name: true, name_en: true, shortname: true } },
      statistic_region_levels: {
        select: { region_level: { select: { name: true } } },
      },
      variants: VariantSelect,
    },
  })

  if (!statistic) return Promise.reject({ status: 404, statregError: 'Shortname not found' })

  const main_language = statistic.language
  const division_code = statistic.division_code
  const related_statistic = statistic.related_statistic

  return {
    version: statistic.version,
    shortname: statistic.shortname.name,
    approval_status: statistic.desk_appoval_status ?? undefined,
    main_language,
    division: {
      code: division_code,
      name: [
        ...getLocalizedName(main_language, getDivisionFromCode(Number(division_code))?.name),
        ...getLocalizedName(lang_en, getDivisionFromCode(Number(division_code), lang_en)?.name),
      ],
    },
    first_released_at: dateToISOString(statistic.first_release),
    yearly_reporting: statistic.yearly_reporting,
    status: {
      code: statistic.status,
    },
    previous_topic_codes: statistic.legacy_topic_codes,
    relation: {
      shortname: related_statistic?.shortname?.name,
      name: [
        ...getLocalizedName(related_statistic?.language, related_statistic?.name),
        ...getLocalizedName(lang_en, related_statistic?.name_en),
      ],
    },
    name: [...getLocalizedName(main_language, statistic.name), ...getLocalizedName(lang_en, statistic.name_en)],
    updated_at: dateToISOString(statistic.last_updated),
    comment: statistic.comment,
    created_at: dateToISOString(statistic.date_created),
    variants: parseStatisticVariants(statistic.variants, main_language, lang_en),
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
    statistic_region_levels:
      statistic.statistic_region_levels?.map(({ region_level }) =>
        getLocalizedName(main_language, region_level.name)
      ) ?? [],
  }
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
    approval_status,
    relation,
    previous_topic_codes,
    yearly_reporting,
    first_released_at,
    main_language,
    comment,
  } = body

  const nameNorwegian = name?.find((obj) => obj.language_code == main_language)?.text
  const nameEnglish = name?.find((obj) => obj.language_code == 'en')?.text
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
      name: nameNorwegian,
      name_en: nameEnglish,
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
    include: {
      shortname: { select: { name: true } },
      responsiblePersons: { select: { email: true, username: true } },
      related_statistic: { select: { language: true, name: true, name_en: true, shortname: true } },
      statistic_region_levels: {
        select: { region_level: { select: { name: true } } },
      },
      variants: VariantSelect,
    },
  })

  //TODO MIM-2591: Refactor into mapping function
  return {
    version: updatedStatistic.version,
    shortname: updatedStatistic.shortname.name,
    approval_status: updatedStatistic.desk_appoval_status ?? undefined,
    main_language,
    division: {
      code: updatedStatistic.division_code,
      name: [
        ...getLocalizedName(main_language, getDivisionFromCode(Number(updatedStatistic.division_code))?.name),
        ...getLocalizedName(lang_en, getDivisionFromCode(Number(updatedStatistic.division_code), lang_en)?.name),
      ],
    },
    first_released_at: dateToISOString(updatedStatistic.first_release),
    yearly_reporting: updatedStatistic.yearly_reporting,
    status: {
      code: updatedStatistic.status,
    },
    previous_topic_codes: updatedStatistic.legacy_topic_codes,
    relation: {
      shortname: updatedStatistic.related_statistic?.shortname?.name,
      name: [
        ...getLocalizedName(updatedStatistic.related_statistic?.language, updatedStatistic.related_statistic?.name),
        ...getLocalizedName(lang_en, updatedStatistic.related_statistic?.name_en),
      ],
    },
    name: [
      ...getLocalizedName(main_language, updatedStatistic.name),
      ...getLocalizedName(lang_en, updatedStatistic.name_en),
    ],
    updated_at: dateToISOString(updatedStatistic.last_updated),
    comment: updatedStatistic.comment,
    created_at: dateToISOString(updatedStatistic.date_created),
    variants: parseStatisticVariants(updatedStatistic.variants, updatedStatistic.language, lang_en),
    contacts: await fetchUsers(updatedStatistic.responsiblePersons).then((users) =>
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
    statistic_region_levels:
      updatedStatistic.statistic_region_levels?.map(({ region_level }) =>
        getLocalizedName(main_language, region_level.name)
      ) ?? [],
  }
}
