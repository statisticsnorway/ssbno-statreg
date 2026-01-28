import { PrismaPg } from '@prisma/adapter-pg'
import { env } from 'prisma/config'
import process from 'node:process'

import { PrismaClient } from '../src/generated/prisma/client.js'
import { Env } from '../prisma.config.js'

const adapter = new PrismaPg({
  connectionString: env<Env>('STATREG_DB_URL_CONNECTION_STRING'),
})

const prisma = new PrismaClient({ adapter })

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

  const shortname1 = await prisma.shortname.upsert({
    where: { id: '101' },
    update: {},
    create: {
      id: '101',
      version: 0,
      name: 'energ',
      last_updated: '2010-11-05T09:05:19.000Z',
      date_created: '2010-11-05T09:05:19.000Z',
    },
  })

  const shortname2 = await prisma.shortname.upsert({
    where: { id: '102' },
    update: {},
    create: {
      id: '102',
      version: 0,
      name: 'befolk',
      last_updated: '2015-01-01T00:00:00.000Z',
      date_created: '2015-01-01T00:00:00.000Z',
    },
  })

  const shortname3 = await prisma.shortname.upsert({
    where: { id: '103' },
    update: {},
    create: {
      id: '103',
      version: 0,
      name: 'kpi',
      last_updated: '2010-11-05T09:05:19.000Z',
      date_created: '2010-11-05T09:05:19.000Z',
    },
  })
  const shortname4 = await prisma.shortname.upsert({
    where: { id: '104' },
    update: {},
    create: {
      id: '104',
      version: 0,
      name: 'syssel',
      last_updated: '2018-03-01T00:00:00.000Z',
      date_created: '2018-03-01T00:00:00.000Z',
    },
  })

  const shortname5 = await prisma.shortname.upsert({
    where: { id: '105' },
    update: {},
    create: {
      id: '105',
      version: 0,
      name: 'helse',
      last_updated: '2019-07-01T00:00:00.000Z',
      date_created: '2019-07-01T00:00:00.000Z',
    },
  })

  console.log('Created shortnames from seed: \n' + shortname1 + shortname2 + shortname3 + shortname4 + shortname5)

  const stat1 = await prisma.statistic.upsert({
    where: { id: '4001' },
    update: {},
    create: {
      id: '4001',
      version: '18',
      shortname: {
        connect: { id: '101' },
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

  console.log('Created stat from seed: \n' + JSON.stringify(stat1, null, 2))

  const stat2 = await prisma.statistic.upsert({
    where: { id: '4002' },
    update: {},
    create: {
      id: '4002',
      version: '1',
      shortname: {
        connect: { id: '102' },
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
    where: { id: '4003' },
    update: {},
    create: {
      id: '4003',
      version: '1',
      shortname: {
        connect: { id: '103' },
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
    where: { id: '4004' },
    update: {},
    create: {
      id: '4004',
      version: '1',
      shortname: {
        connect: { id: '104' },
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
    where: { id: '4005' },
    update: {},
    create: {
      id: '4005',
      version: '1',
      shortname: {
        connect: { id: '105' },
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

  const variant1a = await prisma.variant.upsert({
    where: { id: 9001 },
    update: {},
    create: {
      id: '9001',
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
          id: '4001',
        },
      },
    },
  })

  console.log('Created variant from seed: \n' + JSON.stringify(variant1a, null, 2))

  const variant1b = await prisma.variant.upsert({
    where: { id: 9002 },
    update: {},
    create: {
      id: '9002',
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: {
          id: '2',
        },
      },
      statistic: {
        connect: {
          id: '4001',
        },
      },
    },
  })

  console.log('Created variant from seed: \n' + JSON.stringify(variant1b, null, 2))

  // Added variants for statistics 4002, 4003, 4004, 4005
  const variant2a = await prisma.variant.upsert({
    where: { id: 9003 },
    update: {},
    create: {
      id: '9003',
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { id: '3' },
      },
      statistic: {
        connect: { id: '4002' },
      },
    },
  })

  console.log('Created variant from seed: \n' + JSON.stringify(variant2a, null, 2))

  const variant2b = await prisma.variant.upsert({
    where: { id: 9013 },
    update: {},
    create: {
      id: '9013',
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { id: '1' },
      },
      statistic: {
        connect: { id: '4002' },
      },
    },
  })

  console.log('Created variant from seed: \n' + JSON.stringify(variant2b, null, 2))

  const variant3a = await prisma.variant.upsert({
    where: { id: 9004 },
    update: {},
    create: {
      id: '9004',
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { id: '1' },
      },
      statistic: {
        connect: { id: '4003' },
      },
    },
  })

  console.log('Created variant from seed: \n' + JSON.stringify(variant3a, null, 2))

  const variant3b = await prisma.variant.upsert({
    where: { id: 9014 },
    update: {},
    create: {
      id: '9014',
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { id: '2' },
      },
      statistic: {
        connect: { id: '4003' },
      },
    },
  })

  console.log('Created variant from seed: \n' + JSON.stringify(variant3b, null, 2))

  const variant4a = await prisma.variant.upsert({
    where: { id: 9005 },
    update: {},
    create: {
      id: '9005',
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { id: '2' },
      },
      statistic: {
        connect: { id: '4004' },
      },
    },
  })

  console.log('Created variant from seed: \n' + JSON.stringify(variant4a, null, 2))

  const variant4b = await prisma.variant.upsert({
    where: { id: 9015 },
    update: {},
    create: {
      id: '9015',
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { id: '3' },
      },
      statistic: {
        connect: { id: '4004' },
      },
    },
  })

  console.log('Created variant from seed: \n' + JSON.stringify(variant4b, null, 2))

  const variant5a = await prisma.variant.upsert({
    where: { id: 9006 },
    update: {},
    create: {
      id: '9006',
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { id: '3' },
      },
      statistic: {
        connect: { id: '4005' },
      },
    },
  })

  console.log('Created variant from seed: \n' + JSON.stringify(variant5a, null, 2))

  const variant5b = await prisma.variant.upsert({
    where: { id: 9016 },
    update: {},
    create: {
      id: '9016',
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { id: '1' },
      },
      statistic: {
        connect: { id: '4005' },
      },
    },
  })

  console.log('Created variant from seed: \n' + JSON.stringify(variant5b, null, 2))

  const release1a = await prisma.release.upsert({
    where: { id: '6601' },
    update: {},
    create: {
      id: '6601',
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
        connect: { id: '9001' },
      },
    },
  })

  console.log('Created release from seed: \n' + JSON.stringify(release1a, null, 2))

  const release1b = await prisma.release.upsert({
    where: { id: '6602' },
    update: {},
    create: {
      id: '6602',
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
        connect: { id: '9001' },
      },
    },
  })

  console.log('Created release from seed: \n' + JSON.stringify(release1b, null, 2))

  const release1c = await prisma.release.upsert({
    where: { id: '6603' },
    update: {},
    create: {
      id: '6603',
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
        connect: { id: '9001' },
      },
    },
  })

  console.log('Created release from seed: \n' + JSON.stringify(release1c, null, 2))

  const release2a = await prisma.release.upsert({
    where: { id: '6611' },
    update: {},
    create: {
      id: '6611',
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
        connect: { id: '9002' },
      },
    },
  })

  console.log('Created release from seed: \n' + JSON.stringify(release2a, null, 2))

  const release2b = await prisma.release.upsert({
    where: { id: '6612' },
    update: {},
    create: {
      id: '6612',
      version: 2,
      publish_time: '2026-01-23T08:00:00Z',
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
        connect: { id: '9002' },
      },
    },
  })

  console.log('Created release from seed: \n' + JSON.stringify(release2b, null, 2))

  const release2c = await prisma.release.upsert({
    where: { id: '6613' },
    update: {},
    create: {
      id: '6613',
      version: 2,
      publish_time: '2026-03-26T08:00:00Z',
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
        connect: { id: '9002' },
      },
    },
  })

  console.log('Created release from seed: \n' + JSON.stringify(release2c, null, 2))

  const release3a = await prisma.release.upsert({
    where: { id: '6621' },
    update: {},
    create: {
      id: '6621',
      version: 2,
      publish_time: '2026-05-26T08:00:00Z',
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
        connect: { id: '9014' },
      },
    },
  })

  console.log('Created release from seed: \n' + JSON.stringify(release3a, null, 2))

  const calendar_date1 = await prisma.calender_date.upsert({
    where: { id: 11001 },
    update: {},
    create: {
      id: 11001,
      version: 0,
      comment: 'Første dag etter feriestengt uke',
      day: '2026-07-20T00:00:00Z',
    },
  })

  console.log('Created calendar_date from seed: \n' + JSON.stringify(calendar_date1, null, 2))

  const calendar_date2 = await prisma.calender_date.upsert({
    where: { id: 11002 },
    update: {},
    create: {
      id: 11002,
      version: 0,
      comment: 'Første dag etter påske',
      day: '2026-04-22T00:00:00Z',
    },
  })

  console.log('Created calendar_date from seed: \n' + JSON.stringify(calendar_date2, null, 2))

  const calendar_date3 = await prisma.calender_date.upsert({
    where: { id: 11003 },
    update: {},
    create: {
      id: 11003,
      version: 0,
      comment: 'Julaften',
      day: '2026-12-24T00:00:00Z',
    },
  })

  console.log('Created calendar_date from seed: \n' + JSON.stringify(calendar_date3, null, 2))

  const calendar_date4 = await prisma.calender_date.upsert({
    where: { id: 11004 },
    update: {},
    create: {
      id: 11004,
      version: 0,
      comment: 'Nyttårsaften',
      day: '2026-12-31T00:00:00Z',
    },
  })

  console.log('Created calendar_date from seed: \n' + JSON.stringify(calendar_date4, null, 2))
}

const region_level1 = await prisma.region_level.upsert({
  where: { id: 7 },
  update: {},
  create: {
    id: 7,
    version: 136,
    name: 'Kommune',
    code: 'K',
  },
})

console.log('Created region_level from seed: \n' + JSON.stringify(region_level1, null, 2))

const region_level2 = await prisma.region_level.upsert({
  where: { id: 8 },
  update: {},
  create: {
    id: 8,
    version: 239,
    name: 'Fylke',
    code: 'F',
  },
})

console.log('Created region_level from seed: \n' + JSON.stringify(region_level2, null, 2))

const region_level3 = await prisma.region_level.upsert({
  where: { id: 9 },
  update: {},
  create: {
    id: 9,
    version: 47,
    name: 'Landsdel',
    code: 'LD',
  },
})

console.log('Created region_level from seed: \n' + JSON.stringify(region_level3, null, 2))

const region_level4 = await prisma.region_level.upsert({
  where: { id: 10 },
  update: {},
  create: {
    id: 10,
    version: 489,
    name: 'Land',
    code: 'L',
  },
})

console.log('Created region_level from seed: \n' + JSON.stringify(region_level4, null, 2))

const region_level5 = await prisma.region_level.upsert({
  where: { id: 11 },
  update: {},
  create: {
    id: 11,
    version: 25,
    name: 'Bydel og krets',
    code: 'BD',
  },
})

console.log('Created region_level from seed: \n' + JSON.stringify(region_level5, null, 2))

await main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
