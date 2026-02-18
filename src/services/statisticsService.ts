import type { StatisticListing } from '@/types/index'
import { prisma } from '@/lib/prisma'
import { getDivisionFromCode } from '@/services/klassService'
import { getLocalizedName } from '@/lib/utils'

export async function getAllStatistics({ start = 0, count = 10 }): Promise<StatisticListing[]> {
  const statistics = await prisma.statistic.findMany({
    skip: start,
    take: count,
    omit: {
      id: true,
      dir_appoval_status: true,
      search_phrases: true,
      search_phrases_en: true,
      priority: true,
      relation_id: true,
      last_updated: true,
      date_created: true,
      legacy_topic_codes: true,
    },
    include: {
      shortname: { select: { name: true } },
    },
  })

  return statistics.map((statistic) => {
    const main_language = statistic.language
    const lang_en = 'en'

    const division_code = Number(statistic.division_code)
    const division = getDivisionFromCode(division_code)
    const division_en = getDivisionFromCode(division_code, lang_en)

    return {
      version: statistic.version,
      shortname: {
        id: statistic.shortname_id,
        name: statistic.shortname.name,
      },
      desk_appoval_status: statistic.desk_appoval_status,
      main_language,
      division: {
        id: division_code,
        name: [...getLocalizedName(main_language, division?.name), ...getLocalizedName(lang_en, division_en?.name)],
      },
      first_released_at: statistic.first_release ? statistic.first_release.toISOString() : null,
      yearly_reporting: statistic.yearly_reporting,
      status: [
        {
          language_code: main_language,
          text: statistic.status,
        },
      ],
      name: [
        {
          language_code: main_language,
          text: statistic.name,
        },
        ...getLocalizedName(lang_en, statistic.name_en),
      ],
    }
  })
}

export function getStatisticByShortname(shortname: string) {
  return {
    id: 1234,
    shortname: shortname,
    name: 'Hardkodet statistikk: ' + shortname,
    nameEN: 'English name',
    dateCreated: new Date(),
    lang: 'nb',
    ownerCode: '723',
    owner: 'Seksjon for formidlingsplatform',
    status: 'A',
    variants: 'År',
    annualReporting: false,
    startYear: '2015',
    firstReleaseStatistic: '2018-12-03T07:00:00Z',
    changes: [],
  }
}
