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
  console.log('Created from seed: \n' + JSON.stringify(stat1, null, 2))

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

  console.log('Created from seed: \n' + freq1)
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
