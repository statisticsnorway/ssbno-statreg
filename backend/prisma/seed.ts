import process from 'node:process'
import { prisma } from '../src/lib/prisma'

async function main() {
  const freq1 = await prisma.frequency.upsert({
    where: { code: 'W' },
    update: {},
    create: {
      code: 'W',
      name_en: 'Week (W)',
      name: 'Uke (W)',
      version: 1,
    },
  })

  console.log('Created frequency from seed: \n' + JSON.stringify(freq1, null, 2))

  const freq2 = await prisma.frequency.upsert({
    where: { code: 'Y' },
    update: {},
    create: {
      code: 'Y',
      name_en: 'Year',
      name: 'År',
      version: 1,
    },
  })

  console.log('Created frequency from seed: \n' + JSON.stringify(freq2, null, 2))

  const freq3 = await prisma.frequency.upsert({
    where: { code: 'M' },
    update: {},
    create: {
      code: 'M',
      name_en: 'Month',
      name: 'Måned',
      version: 1,
    },
  })

  console.log('Created frequency from seed: \n' + JSON.stringify(freq3, null, 2))

  const freq4 = await prisma.frequency.upsert({
    where: { code: 'U' },
    update: {},
    create: {
      code: 'U',
      name_en: 'Week (U)',
      name: 'Uke (U)',
      version: 1,
    },
  })

  console.log('Created frequency from seed: \n' + JSON.stringify(freq4, null, 2))

  const shortname1 = await prisma.shortname.upsert({
    where: { name: 'energ' },
    update: {},
    create: {
      version: 0,
      name: 'energ',
      last_updated: '2010-11-05T09:05:19.000Z',
      date_created: '2010-11-05T09:05:19.000Z',
    },
  })

  const shortname2 = await prisma.shortname.upsert({
    where: { name: 'befolk' },
    update: {},
    create: {
      version: 0,
      name: 'befolk',
      last_updated: '2015-01-01T00:00:00.000Z',
      date_created: '2015-01-01T00:00:00.000Z',
    },
  })

  const shortname3 = await prisma.shortname.upsert({
    where: { name: 'kpi' },
    update: {},
    create: {
      version: 0,
      name: 'kpi',
      last_updated: '2010-11-05T09:05:19.000Z',
      date_created: '2010-11-05T09:05:19.000Z',
    },
  })
  const shortname4 = await prisma.shortname.upsert({
    where: { name: 'syssel' },
    update: {},
    create: {
      version: 0,
      name: 'syssel',
      last_updated: '2018-03-01T00:00:00.000Z',
      date_created: '2018-03-01T00:00:00.000Z',
    },
  })

  const shortname5 = await prisma.shortname.upsert({
    where: { name: 'helse' },
    update: {},
    create: {
      version: 0,
      name: 'helse',
      last_updated: '2019-07-01T00:00:00.000Z',
      date_created: '2019-07-01T00:00:00.000Z',
    },
  })

  console.log('Created shortnames from seed: \n' + shortname1 + shortname2 + shortname3 + shortname4 + shortname5)

  const responsiblePerson1 = await prisma.responsiblePerson.upsert({
    where: { principalName: 'abc@ssb.no' },
    update: {},
    create: {
      principalName: 'abc@ssb.no',
    },
  })

  console.log('Created responsiblePerson1: \n' + JSON.stringify(responsiblePerson1, null, 2))

  const responsiblePerson2 = await prisma.responsiblePerson.upsert({
    where: { principalName: 'bob@ssb.no' },
    update: {},
    create: {
      principalName: 'bob@ssb.no',
    },
  })

  console.log('Created responsiblePerson2: \n' + JSON.stringify(responsiblePerson2, null, 2))

  const responsiblePerson3 = await prisma.responsiblePerson.upsert({
    where: { principalName: 'carol@ssb.no' },
    update: {},
    create: {
      principalName: 'carol@ssb.no',
    },
  })

  console.log('Created responsiblePerson3: \n' + JSON.stringify(responsiblePerson3, null, 2))

  const stat2 = await prisma.statistic.upsert({
    where: { shortname_id: shortname2.id },
    update: {},
    create: {
      version: 1,
      shortname: {
        connect: { name: shortname2.name },
      },
      responsiblePersons: {
        connect: {
          principalName: responsiblePerson2.principalName,
        },
      },
      dir_appoval_status: 'GODKJENT',
      search_phrases: 'befolkning, demografi, fødsler, dødsfall, migrasjon',
      priority: 0,
      desk_appoval_status: 'GODKJENT',
      language: 'nb',
      search_phrases_en: 'population, demography, births, deaths, migration',
      division_code: '101',
      first_release: '1900-01-01T00:00:00.000Z',
      yearly_reporting: true,
      status: 'A',
      legacy_topic_codes: '02.01.01',
      name: 'Befolkning og demografi',
      last_updated: '2023-01-01T10:00:00.000Z',
      comment: 'omfatter befolkningsstørrelse og sammensetning',
      name_en: 'Population and demography',
      date_created: '2015-01-01T00:00:00.000Z',
    },
  })

  console.log('Created stat from seed: \n' + JSON.stringify(stat2, null, 2))

  // Statistics with status SA (Sammenslått) must store the relation id themselves, set on create to satisfy the DB check constraint.
  const stat1 = await prisma.statistic.upsert({
    where: { shortname_id: shortname1.id },
    update: {
      related_statistic: {
        connect: { id: stat2.id },
      },
    },
    create: {
      version: 18,
      shortname: {
        connect: {
          name: shortname1.name,
        },
      },
      responsiblePersons: {
        connect: {
          principalName: responsiblePerson1.principalName,
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
      division_code: '425',
      first_release: '1976-01-01T00:00:00.000Z',
      yearly_reporting: false,
      status: 'SA',
      legacy_topic_codes: '01.03.10',
      name: 'Energiregnskap og energibalanse',
      last_updated: '2020-06-12T09:24:15.569Z',
      comment: 'videreføres av energibalanse',
      name_en: 'Energy account and energy balance',
      date_created: '2010-11-05T09:02:23.626Z',
      related_statistic: {
        connect: { id: stat2.id },
      },
    },
  })

  console.log('Created stat from seed: \n' + JSON.stringify(stat1, null, 2))

  const stat3 = await prisma.statistic.upsert({
    where: { shortname_id: shortname3.id },
    update: {},
    create: {
      version: 1,
      shortname: {
        connect: { name: shortname3.name },
      },
      responsiblePersons: {
        connect: {
          principalName: responsiblePerson1.principalName,
        },
      },
      dir_appoval_status: 'GODKJENT',
      search_phrases: 'utenrikshandel, import, eksport, varestrøm',
      priority: 0,
      desk_appoval_status: 'GODKJENT',
      language: 'nb',
      search_phrases_en: 'foreign trade, import, export, goods flow',
      division_code: '102',
      first_release: '1950-01-01T00:00:00.000Z',
      yearly_reporting: false,
      status: 'A',
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
    where: { shortname_id: shortname4.id },
    update: {},
    create: {
      version: 1,
      shortname: {
        connect: { name: shortname4.name },
      },
      responsiblePersons: {
        connect: {
          principalName: responsiblePerson3.principalName,
        },
      },
      dir_appoval_status: 'GODKJENT',
      search_phrases: 'arbeid, sysselsetting, arbeidsledighet, sysselsettingsgrad',
      priority: 0,
      desk_appoval_status: 'GODKJENT',
      language: 'nb',
      search_phrases_en: 'employment, labor force, unemployment, employment rate',
      division_code: '103',
      first_release: '1960-01-01T00:00:00.000Z',
      yearly_reporting: true,
      status: 'A',
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
    where: { shortname_id: shortname5.id },
    update: {
      related_statistic: {
        connect: { id: stat3.id },
      },
    },
    create: {
      version: 1,
      shortname: {
        connect: { name: shortname5.name },
      },
      responsiblePersons: {
        connect: {
          principalName: responsiblePerson2.principalName,
        },
      },
      dir_appoval_status: 'GODKJENT',
      search_phrases: 'helse, sykdom, helsetjenester, forekomst',
      priority: 0,
      desk_appoval_status: 'GODKJENT',
      language: 'nb',
      search_phrases_en: 'health, disease, health services, prevalence',
      division_code: '104',
      first_release: '1970-01-01T00:00:00.000Z',
      yearly_reporting: true,
      status: 'IA',
      legacy_topic_codes: '05.01.01',
      name: 'Helse og helsetjenester',
      last_updated: '2021-09-01T08:30:00.000Z',
      comment: 'statistikk over befolkningens helse og tjenestebruk',
      name_en: 'Health and health services',
      date_created: '2019-07-01T00:00:00.000Z',
      related_statistic: {
        connect: { id: stat3.id },
      },
    },
  })

  console.log('Created stat from seed: \n' + JSON.stringify(stat5, null, 2))

  // VARIANTS

  const variant1acheck = await prisma.variant.findFirst({
    where: {
      frequency: {
        code: 'W',
      },
      statistic: {
        id: stat1.id,
      },
      revision: 'I',
    },
  })

  const variant1a = await prisma.variant.create({
    data: {
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: {
          code: 'W',
        },
      },
      statistic: {
        connect: {
          id: stat1.id,
        },
      },
    },
  })

  if (!variant1acheck) {
    console.log('Created variant from seed: \n' + JSON.stringify(variant1a, null, 2))
  }

  const variant1bcheck = await prisma.variant.findFirst({
    where: {
      frequency: {
        code: 'Y',
      },
      statistic: {
        id: stat1.id,
      },
      revision: 'I',
    },
  })

  const variant1b = await prisma.variant.create({
    data: {
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: {
          code: 'Y',
        },
      },
      statistic: {
        connect: {
          id: stat1.id,
        },
      },
    },
  })

  if (!variant1bcheck) {
    console.log('Created variant from seed: \n' + JSON.stringify(variant1b, null, 2))
  }

  // Added variants for statistics 4002, 4003, 4004, 4005
  const variant2acheck = await prisma.variant.findFirst({
    where: {
      frequency: {
        code: 'M',
      },
      statistic: {
        id: stat2.id,
      },
      revision: 'I',
    },
  })

  const variant2a = await prisma.variant.create({
    data: {
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { code: 'M' },
      },
      statistic: {
        connect: { id: stat2.id },
      },
    },
  })

  if (!variant2acheck) {
    console.log('Created variant from seed: \n' + JSON.stringify(variant2a, null, 2))
  }

  const variant2bcheck = await prisma.variant.findFirst({
    where: {
      frequency: {
        code: 'W',
      },
      statistic: {
        id: stat2.id,
      },
      revision: 'I',
    },
  })

  const variant2b = await prisma.variant.create({
    data: {
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { code: 'W' },
      },
      statistic: {
        connect: { id: stat2.id },
      },
    },
  })

  if (!variant2bcheck) {
    console.log('Created variant from seed: \n' + JSON.stringify(variant2b, null, 2))
  }

  const variant3acheck = await prisma.variant.findFirst({
    where: {
      frequency: {
        code: 'W',
      },
      statistic: {
        id: stat3.id,
      },
      revision: 'I',
    },
  })

  const variant3a = await prisma.variant.create({
    data: {
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { code: 'W' },
      },
      statistic: {
        connect: { id: stat3.id },
      },
    },
  })

  if (!variant3acheck) {
    console.log('Created variant from seed: \n' + JSON.stringify(variant3a, null, 2))
  }

  const variant3bcheck = await prisma.variant.findFirst({
    where: {
      frequency: {
        code: 'Y',
      },
      statistic: {
        id: stat3.id,
      },
      revision: 'I',
    },
  })

  const variant3b = await prisma.variant.create({
    data: {
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { code: 'Y' },
      },
      statistic: {
        connect: { id: stat3.id },
      },
    },
  })

  if (!variant3bcheck) {
    console.log('Created variant from seed: \n' + JSON.stringify(variant3b, null, 2))
  }

  const variant4acheck = await prisma.variant.findFirst({
    where: {
      frequency: {
        code: 'Y',
      },
      statistic: {
        id: stat4.id,
      },
      revision: 'I',
    },
  })

  const variant4a = await prisma.variant.create({
    data: {
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { code: 'Y' },
      },
      statistic: {
        connect: { id: stat4.id },
      },
    },
  })

  if (!variant4acheck) {
    console.log('Created variant from seed: \n' + JSON.stringify(variant4a, null, 2))
  }

  const variant4bcheck = await prisma.variant.findFirst({
    where: {
      frequency: {
        code: 'Y',
      },
      statistic: {
        id: stat4.id,
      },
      revision: 'I',
    },
  })

  const variant4b = await prisma.variant.create({
    data: {
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { code: 'Y' },
      },
      statistic: {
        connect: { id: stat4.id },
      },
    },
  })

  if (!variant4bcheck) {
    console.log('Created variant from seed: \n' + JSON.stringify(variant4b, null, 2))
  }

  const variant5acheck = await prisma.variant.findFirst({
    where: {
      frequency: {
        code: 'M',
      },
      statistic: {
        id: stat5.id,
      },
      revision: 'I',
    },
  })

  const variant5a = await prisma.variant.create({
    data: {
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { code: 'M' },
      },
      statistic: {
        connect: { id: stat5.id },
      },
    },
  })

  if (!variant5acheck) {
    console.log('Created variant from seed: \n' + JSON.stringify(variant5a, null, 2))
  }

  const variant5bcheck = await prisma.variant.findFirst({
    where: {
      frequency: {
        code: 'W',
      },
      statistic: {
        id: stat5.id,
      },
      revision: 'I',
    },
  })

  const variant5b = await prisma.variant.create({
    data: {
      version: 1,
      last_updated: '2025-06-20T10:39:51.621Z',
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      cancelled: false,
      date_created: '2025-06-20T10:39:51.621Z',
      frequency: {
        connect: { code: 'W' },
      },
      statistic: {
        connect: { id: stat5.id },
      },
    },
  })

  if (!variant5bcheck) {
    console.log('Created variant from seed: \n' + JSON.stringify(variant5b, null, 2))
  }

  // RELEASES

  const release1aCheck = await prisma.release.findFirst({
    where: {
      variant: {
        id: variant1a.id,
      },
      publish_time: '2026-01-26T08:00:00Z',
    },
  })

  const release1a = await prisma.release.create({
    data: {
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
        connect: { id: variant1a.id },
      },
    },
  })

  if (!release1aCheck) {
    console.log('Created release from seed: \n' + JSON.stringify(release1a, null, 2))
  }

  const release1bCheck = await prisma.release.findFirst({
    where: {
      variant: {
        id: variant1b.id,
      },
      publish_time: '2026-01-26T08:00:00Z',
    },
  })

  const release1b = await prisma.release.create({
    data: {
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
        connect: { id: variant1a.id },
      },
    },
  })
  if (!release1bCheck) {
    console.log('Created release from seed: \n' + JSON.stringify(release1b, null, 2))
  }

  const release1cCheck = await prisma.release.findFirst({
    where: {
      variant: {
        id: variant1a.id,
      },
      publish_time: '2026-01-26T08:00:00Z',
    },
  })

  const release1c = await prisma.release.create({
    data: {
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
        connect: { id: variant1a.id },
      },
    },
  })

  if (!release1cCheck) {
    console.log('Created release from seed: \n' + JSON.stringify(release1c, null, 2))
  }

  const release2aCheck = await prisma.release.findFirst({
    where: {
      variant: {
        id: variant2a.id,
      },
      publish_time: '2026-01-26T08:00:00Z',
    },
  })

  const release2a = await prisma.release.create({
    data: {
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
        connect: { id: variant2a.id },
      },
    },
  })

  if (!release2aCheck) {
    console.log('Created release from seed: \n' + JSON.stringify(release2a, null, 2))
  }

  const release2bCheck = await prisma.release.findFirst({
    where: {
      variant: {
        id: variant2b.id,
      },
      publish_time: '2026-01-23T08:00:00Z',
    },
  })

  const release2b = await prisma.release.create({
    data: {
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
        connect: { id: variant2b.id },
      },
    },
  })

  if (!release2bCheck) {
    console.log('Created release from seed: \n' + JSON.stringify(release2b, null, 2))
  }

  const release2cCheck = await prisma.release.findFirst({
    where: {
      variant: {
        id: variant2a.id,
      },
      publish_time: '2026-03-26T08:00:00Z',
    },
  })

  const release2c = await prisma.release.create({
    data: {
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
        connect: { id: variant2a.id },
      },
    },
  })

  if (!release2cCheck) {
    console.log('Created release from seed: \n' + JSON.stringify(release2c, null, 2))
  }

  const release3aCheck = await prisma.release.findFirst({
    where: {
      variant: {
        id: variant3a.id,
      },
      publish_time: '2026-05-26T08:00:00Z',
    },
  })

  const release3a = await prisma.release.create({
    data: {
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
        connect: { id: variant3a.id },
      },
    },
  })

  if (!release3aCheck) {
    console.log('Created release from seed: \n' + JSON.stringify(release3a, null, 2))
  }

  // CALENDAR DATE

  const calendar_date1 = await prisma.calender_date.upsert({
    where: { day: '2026-07-20T00:00:00Z' },
    update: {},
    create: {
      version: 0,
      comment: 'Første dag etter feriestengt uke',
      day: new Date('2026-07-20T00:00:00Z'),
    },
  })

  console.log('Created calendar_date from seed: \n' + JSON.stringify(calendar_date1, null, 2))

  const calendar_date2 = await prisma.calender_date.upsert({
    where: { day: '2026-04-22T00:00:00Z' },
    update: {},
    create: {
      version: 0,
      comment: 'Første dag etter påske',
      day: new Date('2026-04-22T00:00:00Z'),
    },
  })

  console.log('Created calendar_date from seed: \n' + JSON.stringify(calendar_date2, null, 2))

  const calendar_date3 = await prisma.calender_date.upsert({
    where: { day: '2026-12-24T00:00:00Z' },
    update: {},
    create: {
      version: 0,
      comment: 'Julaften',
      day: new Date('2026-12-24T00:00:00Z'),
    },
  })

  console.log('Created calendar_date from seed: \n' + JSON.stringify(calendar_date3, null, 2))

  const calendar_date4 = await prisma.calender_date.upsert({
    where: { day: '2026-12-31T00:00:00Z' },
    update: {},
    create: {
      version: 0,
      comment: 'Nyttårsaften',
      day: new Date('2026-12-31T00:00:00Z'),
    },
  })

  console.log('Created calendar_date from seed: \n' + JSON.stringify(calendar_date4, null, 2))

  // REGION LEVEL

  const region_level1 = await prisma.region_level.upsert({
    where: { code: 'K' },
    update: {},
    create: {
      version: 136,
      name: 'Kommune',
      code: 'K',
    },
  })

  console.log('Created region_level from seed: \n' + JSON.stringify(region_level1, null, 2))

  const region_level2 = await prisma.region_level.upsert({
    where: { code: 'F' },
    update: {},
    create: {
      version: 239,
      name: 'Fylke',
      code: 'F',
    },
  })

  console.log('Created region_level from seed: \n' + JSON.stringify(region_level2, null, 2))

  const region_level3 = await prisma.region_level.upsert({
    where: { code: 'LD' },
    update: {},
    create: {
      version: 47,
      name: 'Landsdel',
      code: 'LD',
    },
  })

  console.log('Created region_level from seed: \n' + JSON.stringify(region_level3, null, 2))

  const region_level4 = await prisma.region_level.upsert({
    where: { code: 'L' },
    update: {},
    create: {
      version: 489,
      name: 'Land',
      code: 'L',
    },
  })

  console.log('Created region_level from seed: \n' + JSON.stringify(region_level4, null, 2))

  const region_level5 = await prisma.region_level.upsert({
    where: { code: 'BD' },
    update: {},
    create: {
      version: 25,
      name: 'Bydel og krets',
      code: 'BD',
    },
  })

  console.log('Created region_level from seed: \n' + JSON.stringify(region_level5, null, 2))

  // STATISTIC REGION LEVEL

  const statistic_region_level1Check = await prisma.statistic_region_level.findFirst({
    where: {
      region_level: {
        id: region_level1.id,
      },
      statistic: {
        id: stat1.id,
      },
    },
  })

  if (!statistic_region_level1Check) {
    const statistic_region_level1 = await prisma.statistic_region_level.create({
      data: {
        region_level: { connect: { id: region_level1.id } },
        statistic: { connect: { id: stat1.id } },
      },
    })

    console.log('Created statistic_region_level from seed: \n' + JSON.stringify(statistic_region_level1, null, 2))
  }

  const statistic_region_level2Check = await prisma.statistic_region_level.findFirst({
    where: {
      region_level: {
        id: region_level2.id,
      },
      statistic: {
        id: stat1.id,
      },
    },
  })

  if (!statistic_region_level2Check) {
    const statistic_region_level2 = await prisma.statistic_region_level.create({
      data: {
        region_level: { connect: { id: region_level2.id } },
        statistic: { connect: { id: stat1.id } },
      },
    })

    console.log('Created statistic_region_level from seed: \n' + JSON.stringify(statistic_region_level2, null, 2))
  }

  const statistic_region_level3Check = await prisma.statistic_region_level.findFirst({
    where: {
      region_level: {
        id: region_level3.id,
      },
      statistic: {
        id: stat3.id,
      },
    },
  })

  if (!statistic_region_level3Check) {
    const statistic_region_level3 = await prisma.statistic_region_level.create({
      data: {
        region_level: { connect: { id: region_level3.id } },
        statistic: { connect: { id: stat3.id } },
      },
    })

    console.log('Created statistic_region_level from seed: \n' + JSON.stringify(statistic_region_level3, null, 2))
  }

  const statistic_region_level4Check = await prisma.statistic_region_level.findFirst({
    where: {
      region_level: {
        id: region_level4.id,
      },
      statistic: {
        id: stat4.id,
      },
    },
  })

  if (!statistic_region_level4Check) {
    const statistic_region_level4 = await prisma.statistic_region_level.create({
      data: {
        region_level: { connect: { id: region_level4.id } },
        statistic: { connect: { id: stat4.id } },
      },
    })

    console.log('Created statistic_region_level from seed: \n' + JSON.stringify(statistic_region_level4, null, 2))
  }

  const statistic_region_level5Check = await prisma.statistic_region_level.findFirst({
    where: {
      region_level: {
        id: region_level5.id,
      },
      statistic: {
        id: stat5.id,
      },
    },
  })

  if (!statistic_region_level5Check) {
    const statistic_region_level5 = await prisma.statistic_region_level.create({
      data: {
        region_level: { connect: { id: region_level5.id } },
        statistic: { connect: { id: stat5.id } },
      },
    })

    console.log('Created statistic_region_level from seed: \n' + JSON.stringify(statistic_region_level5, null, 2))
  }
}

await main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
