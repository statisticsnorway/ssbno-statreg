import { PrismaPg } from '@prisma/adapter-pg'
import { env } from 'prisma/config'
import process from 'node:process'

import { PrismaClient } from '../src/generated/prisma/client.js'
import { Env } from '../prisma.config.js'

const adapter = new PrismaPg({
  connectionString: env<Env>('NAIS_DATABASE_SSBNO_STATREG_API_STATREG_DB_URL'),
})

const prisma = await new PrismaClient({ adapter })

async function main() {
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

  console.log('Created stat from seed: \n' + JSON.stringify(stat1, null, 2))
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

  const freq1 = await prisma.frequency.upsert({
    where: { id: '234' },
    update: {},
    create: {
      id: '234',
      code: 'W',
      name: 'Week',
      version: 1,
    },
  })
  const freq2 = await prisma.frequency.upsert({
    where: { id: '235' },
    update: {},
    create: {
      id: '235',
      code: 'Y',
      name: 'Year',
      version: 1,
    },
  })
  const freq3 = await prisma.frequency.upsert({
    where: { id: '236' },
    update: {},
    create: {
      id: '236',
      code: 'M',
      name: 'Month',
      version: 1,
    },
  })

  console.log('Created frequency from seed: \n' + freq1 + freq2 + freq3)
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

/* 
  {
    "id": "3673",
    "version": "16",
    "kortnavn_id": "3672",
    "dir_flyt": "GODKJENT",
    "triggerord": "CNG (komprimert naturgass), LNG (nedkjølt naturgass), rørgass",
    "prioritet": "0",
    "desk_flyt": "GODKJENT",
    "sprak": "nb",
    "triggerord_en": "CNG (compressed natural gas), LNG (liquified natural gas), piped gas",
    "eierseksjon_id": "3661",
    "forstegangspublisering": "2003-01-01T00:00:00.000Z",
    "arsrapportering": "0",
    "status": "SA",
    "gamle_emnekoder": "01.03.10",
    "relasjon_id": "81988",
    "statistikknavn": "Naturgass, innenlands forbruk ",
    "last_updated": "2020-06-12T09:16:47.978Z",
    "intern_kommentar": "videreføres av energibalanse",
    "statistikknavn_en": "Natural gas, domestic use",
    "date_created": "2010-11-05T09:02:25.829Z"
  },
  {
    "id": "3678",
    "version": "14",
    "kortnavn_id": "3677",
    "dir_flyt": "GODKJENT",
    "triggerord": "energikilder, elektrisitet, stasjonær energibruk, mobil energibruk",
    "prioritet": "0",
    "desk_flyt": "GODKJENT",
    "sprak": "nb",
    "triggerord_en": "energy sources, electricity, stationary energy consumption, mobile energy consumption",
    "eierseksjon_id": "3661",
    "forstegangspublisering": "2005-01-01T00:00:00.000Z",
    "arsrapportering": "0",
    "status": "UT",
    "gamle_emnekoder": "01.03.10",
    "relasjon_id": null,
    "statistikknavn": "Energibruk i kommunene (opphørt)",
    "last_updated": "2019-09-06T13:22:47.690Z",
    "intern_kommentar": "ny kontakt",
    "statistikknavn_en": "Energy use by municipality (discontinued)",
    "date_created": "2010-11-05T09:02:26.314Z"
  },
  {
    "id": "3683",
    "version": "13",
    "kortnavn_id": "3682",
    "dir_flyt": "GODKJENT",
    "triggerord": "energi, næringsbygg, yrkesbygg, elektrisk kraft, fyringsolje, gass, ved og pellets, oppvarmingsutstyr (for eksempel sentralvarme, fjernvarme, varmepumpe)",
    "prioritet": "0",
    "desk_flyt": "GODKJENT",
    "sprak": "nb",
    "triggerord_en": "industrial buildings, non-residential buildings, electric power, heating oil, gas, wood and pellets, heating equipment (for example central heating, district heating, heat pump)",
    "eierseksjon_id": "3661",
    "forstegangspublisering": "2008-01-01T00:00:00.000Z",
    "arsrapportering": "0",
    "status": "IA",
    "gamle_emnekoder": "01.03.10",
    "relasjon_id": null,
    "statistikknavn": "Energibruk i tjenesteytende næringer (opphørt)",
    "last_updated": "2019-09-06T13:27:38.105Z",
    "intern_kommentar": "ny kontakt",
    "statistikknavn_en": "Energy consumption in service industries (discontinued)",
    "date_created": "2010-11-05T09:02:26.986Z"
  } 
    */
