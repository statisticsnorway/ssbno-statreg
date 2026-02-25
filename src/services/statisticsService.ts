import type { StatisticListing } from '@/types/index'
import { getLocalizedName } from '@/lib/utils'
import { type PrismaClient } from '@/generated/prisma/client'

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
