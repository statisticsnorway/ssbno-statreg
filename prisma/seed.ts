import { PrismaPg } from '@prisma/adapter-pg'
import { env } from 'prisma/config'
import process from 'node:process'

import { PrismaClient } from '../src/generated/prisma/client.js'
import { Env } from '../prisma.config.js'
// import { connect } from 'node:http2'

const adapter = new PrismaPg({
  connectionString: env<Env>('NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_URL'),
})

const prisma = await new PrismaClient({ adapter })

async function main() {
  const freq1 = await prisma.frequency.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      code: 'W',
      name: 'Week',
      version: 1,
    },
  })
  const freq2 = await prisma.frequency.upsert({
    where: { id: '2' },
    update: {},
    create: {
      id: '2',
      code: 'Y',
      name: 'Year',
      version: 1,
    },
  })
  const freq3 = await prisma.frequency.upsert({
    where: { id: '3' },
    update: {},
    create: {
      id: '3',
      code: 'M',
      name: 'Month',
      version: 1,
    },
  })

  console.log('Created frequency from seed: \n' + freq1 + freq2 + freq3)

  const stat1 = await prisma.statistic.upsert({
    where: { id: '3663' },
    update: {},
    create: {
      id: '3663',
      version: '18',
      shortname: {
        create: {
          id: '5350',
          version: 0,
          name: 'energ',
          last_updated: '2010-11-05T09:05:19.000Z',
          date_created: '2010-11-05T09:05:19.000Z',
        },
      },
      dir_appoval_status: 'GODKJENT',
      search_phrases:
        'energi, energiproduksjon, energibruk, energibruk etter næring, energiforbruk i husholdninger, energivarer (for eksempel råolje, bensin, naturgass), import, eksport, strømpriser, energipriser',
      priority: 0,
      desk_appoval_status: 'GODKJENT',
      language: 'nb',
      search_phrases_en:
        'energy production, energy consumption, energy consumption by industry, energy consumption in households, energy goods (for example crude oil, petrol, natural gas), import, export, electricity prices, energy prices',
      division: {
        create: {
          id: '76543',
          version: '1234',
          name: 'Seksjon for energi-, miljø- og transportstatistikk',
          code: '425',
          name_en: 'Division for Energy, Environmental and Transport Statistics',
        },
      },
      first_release: '1976-01-01T00:00:00.000Z',
      yearly_reporting: false,
      status: 'SA',
      legacy_topic_codes: '01.03.10',
      name: 'Energiregnskap og energibalanse',
      last_updated: '2020-06-12T09:24:15.569Z',
      comment: 'videreføres av energibalanse',
      name_en: 'Energy account and energy balance',
      date_created: '2010-11-05T09:02:23.626Z',
    },
  })

  const variant1 = await prisma.variant.upsert({
    where: { id: 207611 },
    update: {},
    create: {
      id: '207611',
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: {
          id: '1',
        },
      },
      statistic: {
        connect: {
          id: '3663',
        },
      },
    },
  })

  const release1 = await prisma.release.upsert({
    where: { id: '210444' },
    update: {},
    create: {
      id: '210444',
      version: 2,
      publish_time: '2026-01-26T08:00:00Z',
      has_versions: true,
      last_updated: '2025-10-28T08:57:35.498Z',
      comment: 'Desken melder for fag. 3mnd.',
      period_from: '2025-01-01T00:00:00Z',
      period_to: '2025-12-31T00:00:00Z',
      desk_appoval_status: 'GODKJENT',
      cancelled: false,
      date_created: '2025-10-28T08:40:32.352Z',
      release_date_precision: 'dag',
      variant: {
        connect: { id: '207611' },
      },
    },
  })

  console.log('Created variant from seed: \n' + JSON.stringify(variant1, null, 2))

  console.log('Created stat from seed: \n' + JSON.stringify(stat1, null, 2))

  console.log('Created release from seed: \n' + JSON.stringify(release1, null, 2))

  const stat2 = await prisma.statistic.upsert({
    where: { id: '4000' },
    update: {},
    create: {
      id: '4000',
      version: '1',
      shortname: {
        create: {
          id: '6000',
          version: 0,
          name: 'befolk',
          last_updated: '2015-01-01T00:00:00.000Z',
          date_created: '2015-01-01T00:00:00.000Z',
        },
      },
      dir_appoval_status: 'GODKJENT',
      search_phrases: 'befolkning, demografi, fødsler, dødsfall, migrasjon',
      priority: 0,
      desk_appoval_status: 'GODKJENT',
      language: 'nb',
      search_phrases_en: 'population, demography, births, deaths, migration',
      division: {
        create: {
          id: '80000',
          version: '1',
          name: 'Seksjon for befolkningsstatistikk',
          code: '101',
          name_en: 'Division for Population Statistics',
        },
      },
      first_release: '1900-01-01T00:00:00.000Z',
      yearly_reporting: true,
      status: 'SA',
      legacy_topic_codes: '02.01.01',
      name: 'Befolkning og demografi',
      last_updated: '2023-01-01T10:00:00.000Z',
      comment: 'omfatter befolkningsstørrelse og sammensetning',
      name_en: 'Population and demography',
      date_created: '2015-01-01T00:00:00.000Z',
    },
  })

  console.log('Created stat from seed: \n' + JSON.stringify(stat2, null, 2))

  const stat3 = await prisma.statistic.upsert({
    where: { id: '4100' },
    update: {},
    create: {
      id: '4100',
      version: '1',
      shortname: {
        create: {
          id: '6101',
          version: 0,
          name: 'handel',
          last_updated: '2016-06-01T00:00:00.000Z',
          date_created: '2016-06-01T00:00:00.000Z',
        },
      },
      dir_appoval_status: 'GODKJENT',
      search_phrases: 'utenrikshandel, import, eksport, varestrøm',
      priority: 0,
      desk_appoval_status: 'GODKJENT',
      language: 'nb',
      search_phrases_en: 'foreign trade, import, export, goods flow',
      division: {
        create: {
          id: '80010',
          version: '1',
          name: 'Seksjon for utenriks- og næringsstatistikk',
          code: '102',
          name_en: 'Division for Trade and Business Statistics',
        },
      },
      first_release: '1950-01-01T00:00:00.000Z',
      yearly_reporting: false,
      status: 'SA',
      legacy_topic_codes: '03.02.05',
      name: 'Utenrikshandel og varestrøm',
      last_updated: '2024-05-10T12:00:00.000Z',
      comment: 'omhandler import og eksport av varer',
      name_en: 'Foreign trade and goods flow',
      date_created: '2016-06-01T00:00:00.000Z',
    },
  })

  console.log('Created stat from seed: \n' + JSON.stringify(stat3, null, 2))

  const stat4 = await prisma.statistic.upsert({
    where: { id: '4200' },
    update: {},
    create: {
      id: '4200',
      version: '1',
      shortname: {
        create: {
          id: '6200',
          version: 0,
          name: 'syssel',
          last_updated: '2018-03-01T00:00:00.000Z',
          date_created: '2018-03-01T00:00:00.000Z',
        },
      },
      dir_appoval_status: 'GODKJENT',
      search_phrases: 'arbeid, sysselsetting, arbeidsledighet, sysselsettingsgrad',
      priority: 0,
      desk_appoval_status: 'GODKJENT',
      language: 'nb',
      search_phrases_en: 'employment, labor force, unemployment, employment rate',
      division: {
        create: {
          id: '80020',
          version: '1',
          name: 'Seksjon for arbeids- og lønnsstatistikk',
          code: '103',
          name_en: 'Division for Labour and Wage Statistics',
        },
      },
      first_release: '1960-01-01T00:00:00.000Z',
      yearly_reporting: true,
      status: 'SA',
      legacy_topic_codes: '04.01.01',
      name: 'Sysselsetting og arbeidsledighet',
      last_updated: '2022-11-01T09:00:00.000Z',
      comment: 'dekker sysselsettingsnivå og ledighetstall',
      name_en: 'Employment and unemployment',
      date_created: '2018-03-01T00:00:00.000Z',
    },
  })

  console.log('Created stat from seed: \n' + JSON.stringify(stat4, null, 2))

  const stat5 = await prisma.statistic.upsert({
    where: { id: '4300' },
    update: {},
    create: {
      id: '4300',
      version: '1',
      shortname: {
        create: {
          id: '6300',
          version: 0,
          name: 'helse',
          last_updated: '2019-07-01T00:00:00.000Z',
          date_created: '2019-07-01T00:00:00.000Z',
        },
      },
      dir_appoval_status: 'GODKJENT',
      search_phrases: 'helse, sykdom, helsetjenester, forekomst',
      priority: 0,
      desk_appoval_status: 'GODKJENT',
      language: 'nb',
      search_phrases_en: 'health, disease, health services, prevalence',
      division: {
        create: {
          id: '80030',
          version: '1',
          name: 'Seksjon for helse- og omsorgsstatistikk',
          code: '104',
          name_en: 'Division for Health and Care Statistics',
        },
      },
      first_release: '1970-01-01T00:00:00.000Z',
      yearly_reporting: true,
      status: 'SA',
      legacy_topic_codes: '05.01.01',
      name: 'Helse og helsetjenester',
      last_updated: '2021-09-01T08:30:00.000Z',
      comment: 'statistikk over befolkningens helse og tjenestebruk',
      name_en: 'Health and health services',
      date_created: '2019-07-01T00:00:00.000Z',
    },
  })

  console.log('Created stat from seed: \n' + JSON.stringify(stat5, null, 2))

await main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
