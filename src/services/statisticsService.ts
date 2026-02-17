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
      division: { select: { code: true, name: true } },
      shortname: { select: { name: true } },
    },
  })

  return statistics.map((statistic) => {
    const main_language = statistic.language

    const division_code = statistic.division.code
    const division = getDivisionFromCode(Number(division_code))
    const division_en = getDivisionFromCode(Number(division_code), 'en')

    return {
      version: statistic.version.toString(),
      shortname: {
        id: statistic.shortname_id.toString(),
        name: statistic.shortname.name,
      },
      desk_appoval_status: statistic.desk_appoval_status,
      main_language,
      division: {
        id: division_code,
        name: [
          ...(division?.name ? [{ language_code: main_language, text: division.name }] : []),
          ...(division_en?.name
            ? [
                {
                  language_code: 'en',
                  text: division_en.name,
                },
              ]
            : []),
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
      name: [
        {
          language_code: main_language,
          text: statistic.name,
        },
        ...(statistic.name_en
          ? [
              {
                language_code: 'en',
                text: statistic.name_en,
              },
            ]
          : []),
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
