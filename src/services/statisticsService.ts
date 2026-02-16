import type { StatisticListing } from '@/types/index'
import { prisma } from '@/lib/prisma'
import { getDivisionFromCode } from '@/services/klassService'

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
      division: { select: { code: true } },
      shortname: { select: { name: true } },
    },
  })

  return statistics.map((statistic) => {
    const main_language = statistic.language
    const lang_en = 'en'

    const name = [
      {
        language_code: main_language,
        text: statistic.name,
      },
    ]

    if (statistic.name_en)
      name.push({
        language_code: lang_en,
        text: statistic.name_en,
      })

    const divisionCode = statistic.division.code
    const division = getDivisionFromCode(Number(statistic.division.code))

    return {
      version: statistic.version.toString(),
      shortname: {
        id: statistic.shortname_id.toString(),
        name: statistic.shortname.name,
      },
      desk_appoval_status: statistic.desk_appoval_status,
      main_language,
      division: {
        id: divisionCode,
        name: [
          {
            language_code: main_language,
            text: division[0]?.name,
          },
          // TODO: Fetch english; klass service does not support this atm
          // {
          //   language_code: lang_en,
          //   text: statistic.division.name_en,
          // },
        ],
      },
      first_released_at: statistic.first_release ? statistic.first_release.toISOString() : null,
      yearly_reporting: statistic.yearly_reporting,
      status: [
        {
          language_code: main_language,
          text: statistic.status,
        },
      ],
      name,
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
