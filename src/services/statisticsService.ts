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

export async function getStatisticByShortname(shortname: string, prisma: StatisticPrisma): Promise<StatisticDetails> {
  const statistic = await prisma.statistic.findFirst({
    where: { shortname: { name: shortname } },
    include: {
      shortname: { select: { name: true } },
      responsiblePersons: { select: { email: true } },
    },
  })

  if (!statistic) throw new Error('Statistic not found')

  const main_language = statistic.language
  const lang_en = 'en'

  const division_code = statistic.division_code

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
    status: [
      {
        language_code: main_language,
        text: statistic.status,
      },
    ],
    previous_topic_codes: statistic.legacy_topic_codes,
    relation: {
      id: 'string',
      name: [
        {
          language_code: 'string',
          text: 'string',
        },
      ],
    },
    name: [...getLocalizedName(main_language, statistic.name), ...getLocalizedName(lang_en, statistic.name_en)],
    updated_at: dateToISOString(statistic.last_updated),
    comment: statistic.comment,
    created_at: dateToISOString(statistic.date_created),
    contacts: statistic.responsiblePersons,
    statistic_region_levels: [
      [
        {
          language_code: 'string',
          text: 'string',
        },
      ],
    ],
  }
}
