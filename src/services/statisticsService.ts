import { Statistic } from '@/generated/prisma/client'
import { prisma } from '../lib/prisma'

export async function getAllStatistics(): Promise<Statistic[]> {
  const statistics = await prisma.statistic.findMany({
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
    include: { shortname: { select: { name: true } }, division: { select: { name: true, name_en: true } } },
  })

  console.log(statistics)

  return statistics.map((statistic) => {
    const main_language = statistic.language // Either nb or nn
    return {
      version: statistic.version,
      shortname: {
        id: statistic.shortname_id,
        name: statistic.shortname.name,
      },
      desk_appoval_status: statistic.desk_appoval_status,
      main_language,
      division: {
        id: statistic.division_id,
        name: [
          {
            language_code: main_language,
            text: statistic.division.name,
          },
          {
            language_code: 'en',
            text: statistic.division.name_en,
          },
        ],
      },
      first_released_at: statistic.first_release,
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
        {
          language_code: 'en',
          text: statistic.name_en,
        },
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
