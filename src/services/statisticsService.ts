import type { StatisticListing, StatisticDetails } from '@/types/index'
import { getLocalizedName, dateToISOString } from '@/lib/utils'
import { type PrismaClient } from '@/generated/prisma/client'
import { getDivisionFromCode } from '@/services/klassService'

type StatisticPrisma = Pick<PrismaClient, 'statistic'>

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
    const lang_en = 'en'

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

function parseStatisticVariants(variants) {
  if (!variants?.length) return

  return variants.map((variant) => ({
    version: variant.version,
    updated_at: dateToISOString(variant.last_updated),
    level_of_detail: [
      {
        language_code: 'nb',
        text: variant.level_of_detail,
      },
      {
        language_code: 'en',
        text: variant.level_of_detail_en,
      },
    ],
    created_at: dateToISOString(variant.date_created),
    cancelled: variant.cancelled,
    frequency: {
      name: [...getLocalizedName('nb', variant.frequency.name), ...getLocalizedName('en', variant.frequency.name_en)],
    },
    revision: variant.revision,
  }))
}

export async function getStatisticByShortname(shortname: string, prisma: StatisticPrisma): Promise<StatisticDetails> {
  const statistic = await prisma.statistic.findFirst({
    where: { shortname: { name: shortname } },
    include: {
      shortname: { select: { name: true } },
      responsiblePersons: { select: { email: true } },
      statistic: { select: { language: true, name: true, name_en: true, shortname: true } },
      statistic_region_levels: {
        select: { region_level: { select: { name: true } } },
      },
      variants: {
        omit: { id: true, statistic_id: true, freq_id: true },
        include: {
          frequency: { select: { name: true, name_en: true } },
        },
      },
    },
  })

  if (!statistic) throw new Error('Statistic not found')

  const main_language = statistic.language
  const lang_en = 'en'

  const division_code = statistic.division_code
  const related_statistic = statistic.statistic

  return {
    version: statistic.version,
    shortname: statistic.shortname.name,
    approval_status: statistic.desk_appoval_status,
    main_language,
    division: {
      code: division_code,
      name: [
        ...getLocalizedName(main_language, getDivisionFromCode(Number(division_code))?.name),
        ...getLocalizedName(lang_en, getDivisionFromCode(Number(division_code), 'en')?.name),
      ],
    },
    first_released_at: dateToISOString(statistic.first_release),
    yearly_reporting: statistic.yearly_reporting,
    status: {
      code: statistic.status,
    },
    previous_topic_codes: statistic.legacy_topic_codes,
    // TODO: Add to seed
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
    variants: parseStatisticVariants(statistic.variants),
    contacts: statistic.responsiblePersons,
    statistic_region_levels: [], // TODO: Add to seed
  }
}
