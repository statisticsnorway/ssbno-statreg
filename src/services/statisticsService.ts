import { Statistic } from '@/generated/prisma/client'
import { prisma } from '../lib/prisma'

export async function getAllStatistics(): Promise<Statistic[]> {
  const statistics = await prisma.statistic.findMany()

  // TODO: Link shortname and division to their respective tables and return the correct values instead of hardcoded ones
  return statistics.map((statistic) => ({
    version: statistic.version,
    shortname: statistic.shortname,
    desk_appoval_status: statistic.desk_appoval_status,
    main_language: statistic.language,
    division: {
      id: statistic.division_id,
      name: [
        {
          language_code: 'string',
          text: 'string',
        },
      ],
    },
    first_released_at: statistic.first_release,
    yearly_reporting: statistic.yearly_reporting,
    status: [
      {
        language_code: statistic.language,
        text: statistic.status,
      },
    ],
    name: [
      {
        language_code: statistic.language,
        text: statistic.name,
      },
      {
        language_code: 'en',
        text: statistic.name_en,
      },
    ],
  }))
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
