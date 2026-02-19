import type { StatisticListing } from '@/types/index'
import { prisma } from '@/lib/prisma'
import { getLocalizedName } from '@/lib/utils'

export async function getAllStatistics({ start = 0, count = 10 }): Promise<StatisticListing[]> {
  const statistics = await prisma.statistic.findMany({
    skip: start,
    take: count,
    omit: {
      id: true,
      desk_appoval_status: true,
      dir_appoval_status: true,
      division_code: true,
      search_phrases: true,
      search_phrases_en: true,
      priority: true,
      relation_id: true,
      last_updated: true,
      date_created: true,
      legacy_topic_codes: true,
      first_release: true,
      yearly_reporting: true,
      version: true,
    },
    include: {
      shortname: { select: { name: true } },
      responsiblePersons: { select: { username: true } },
    },
  })

  return statistics.map((statistic) => {
    const main_language = statistic.language
    const lang_en = 'en'

    return {
      shortname: statistic.shortname.name,
      main_language,
      status: [...getLocalizedName(main_language, statistic.status)],
      name: [...getLocalizedName(main_language, statistic.name), ...getLocalizedName(lang_en, statistic.name_en)],
      contacts: statistic.responsiblePersons.map(({ username }) => username),
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
