import { describe, mock, test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { getAllStatistics, getStatisticByShortname } from '../src/services/statisticsService'

let prismaMock: any
let statisticsResult: object

function setStatisticsResult(next: object) {
  statisticsResult = next
}

describe('statisticService', async () => {
  describe('getAllStatistics ', async () => {
    beforeEach(() => {
      prismaMock = {
        statistic: {
          findMany: mock.fn(() => Promise.resolve(statisticsResult)),
        },
      }
    })

    afterEach(() => {
      mock.restoreAll()
    })

    test('getAllStatistics returns mocked data', async () => {
      setStatisticsResult(mockStatisticsPrismaResult)

      const result = await getAllStatistics({ start: 1, count: 2 }, prismaMock)

      assert.deepEqual(result, mockedStatisticsResult)
      assert.equal(prismaMock.statistic.findMany.mock.calls[0].arguments[0]['skip'], 1)
      assert.equal(prismaMock.statistic.findMany.mock.calls[0].arguments[0]['take'], 2)
    })

    test('getAllStatistics uses default start and count if not provided', async () => {
      setStatisticsResult(mockStatisticsPrismaResult)

      const result = await getAllStatistics({}, prismaMock)

      assert.deepEqual(result, mockedStatisticsResult)
      assert.equal(prismaMock.statistic.findMany.mock.calls[0].arguments[0]['skip'], 0)
      assert.equal(prismaMock.statistic.findMany.mock.calls[0].arguments[0]['take'], 10)
    })

    test('getAllStatistics returns empty list if no results', async () => {
      setStatisticsResult([])

      const result = await getAllStatistics({}, prismaMock)

      assert.deepEqual(result, [])
    })
  })

  describe('getStatisticByShortname', async () => {
    beforeEach(() => {
      prismaMock = {
        statistic: {
          findFirst: mock.fn(() => Promise.resolve(statisticsResult)),
        },
      }
    })

    afterEach(() => {
      mock.restoreAll()
    })

    test('getStatisticByShortname returns mocked data', async () => {
      setStatisticsResult(mockStatisticsDetailedPrismaResult)

      const result = await getStatisticByShortname('energ', prismaMock)

      assert.deepEqual(result, mockedStatisticDetailedResult)
    })
  })
})

////////////// MOCK DATA ////////////////////////////////
const mockStatisticsPrismaResult = [
  {
    language: 'nb',
    status: 'SA',
    name: 'Energiregnskap og energibalanse',
    name_en: 'Energy account and energy balance',
    shortname: { name: 'energ' },
    responsiblePersons: [
      {
        username: 'abc',
        email: 'alice@ssb.no',
      },
    ],
  },
  {
    language: 'nb',
    status: 'SA',
    name: 'Befolkning og demografi',
    name_en: 'Population and demography',
    shortname: { name: 'befolk' },
    responsiblePersons: [
      {
        username: 'bcd',
        email: 'bob@ssb.no',
      },
    ],
  },
]

const mockStatisticsDetailedPrismaResult = {
  id: 1,
  version: 18,
  shortname_id: 1,
  dir_appoval_status: 'GODKJENT',
  search_phrases:
    'energi, energiproduksjon, energibruk, energibruk etter næring, energiforbruk i husholdninger, energivarer (for eksempel råolje, bensin, naturgass), import, eksport, strømpriser, energipriser',
  priority: 0,
  desk_appoval_status: 'GODKJENT',
  language: 'nb',
  search_phrases_en:
    'energy production, energy consumption, energy consumption by industry, energy consumption in households, energy goods (for example crude oil, petrol, natural gas), import, export, electricity prices, energy prices',
  division_code: '425',
  division_id: null,
  first_release: new Date('1976-01-01T00:00:00.000Z'),
  yearly_reporting: false,
  status: 'SA',
  related_statistic_id: null,
  name: 'Energiregnskap og energibalanse',
  last_updated: new Date('2020-06-12T09:24:15.569Z'),
  comment: 'videreføres av energibalanse',
  name_en: 'Energy account and energy balance',
  date_created: new Date('2010-11-05T09:02:23.626Z'),
  legacy_topic_codes: '01.03.10',
  shortname: {
    name: 'energ',
  },
  responsiblePersons: [
    {
      username: 'abc',
      email: 'alice@ssb.no',
    },
  ],
  related_statistic: null,
  statistic_region_levels: [
    {
      region_level: {
        name: 'Kommune',
      },
    },
    {
      region_level: {
        name: 'Fylke',
      },
    },
  ],
  variants: [
    {
      version: 1,
      last_updated: new Date('2025-06-20T10:39:51.621Z'),
      date_created: new Date('2025-06-20T10:39:51.621Z'),
      cancelled: false,
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      frequency: {
        name: 'Uke',
        name_en: 'Week',
      },
    },
    {
      version: 1,
      last_updated: new Date('2025-06-20T10:39:51.621Z'),
      date_created: new Date('2025-06-20T10:39:51.621Z'),
      cancelled: false,
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      frequency: {
        name: 'År',
        name_en: 'Year',
      },
    },
  ],
}

const mockedStatisticsResult = [
  {
    shortname: 'energ',
    main_language: 'nb',
    status: { code: 'SA' },
    name: [
      { language_code: 'nb', text: 'Energiregnskap og energibalanse' },
      { language_code: 'en', text: 'Energy account and energy balance' },
    ],
    contacts: [{ username: 'abc', email: 'alice@ssb.no' }],
  },
  {
    shortname: 'befolk',
    main_language: 'nb',
    status: { code: 'SA' },
    name: [
      { language_code: 'nb', text: 'Befolkning og demografi' },
      { language_code: 'en', text: 'Population and demography' },
    ],
    contacts: [{ username: 'bcd', email: 'bob@ssb.no' }],
  },
]

const mockedStatisticDetailedResult = {
  version: 18,
  shortname: 'energ',
  approval_status: 'GODKJENT',
  main_language: 'nb',
  division: {
    code: '425',
    name: [
      // Skip division test since it's covered by klassService.test.ts
      // {
      //   language_code: 'nb',
      //   text: 'Seksjon for energi-, miljø- og transportstatistikk',
      // },
    ],
  },
  first_released_at: '1976-01-01T00:00:00.000Z',
  yearly_reporting: false,
  status: {
    code: 'SA',
  },
  previous_topic_codes: '01.03.10',
  relation: {
    shortname: undefined,
    name: [],
  },
  name: [
    {
      language_code: 'nb',
      text: 'Energiregnskap og energibalanse',
    },
    {
      language_code: 'en',
      text: 'Energy account and energy balance',
    },
  ],
  updated_at: '2020-06-12T09:24:15.569Z',
  comment: 'videreføres av energibalanse',
  created_at: '2010-11-05T09:02:23.626Z',
  variants: [
    {
      version: 1,
      updated_at: '2025-06-20T10:39:51.621Z',
      level_of_detail: [],
      created_at: '2025-06-20T10:39:51.621Z',
      cancelled: false,
      frequency: {
        name: [
          {
            language_code: 'nb',
            text: 'Uke',
          },
          {
            language_code: 'en',
            text: 'Week',
          },
        ],
      },
      revision: 'I',
    },
    {
      version: 1,
      updated_at: '2025-06-20T10:39:51.621Z',
      level_of_detail: [],
      created_at: '2025-06-20T10:39:51.621Z',
      cancelled: false,
      frequency: {
        name: [
          {
            language_code: 'nb',
            text: 'År',
          },
          {
            language_code: 'en',
            text: 'Year',
          },
        ],
      },
      revision: 'I',
    },
  ],
  contacts: [
    {
      name: undefined,
      email: 'alice@ssb.no',
    },
  ],
  statistic_region_levels: [
    [
      {
        language_code: 'nb',
        text: 'Kommune',
      },
    ],
    [
      {
        language_code: 'nb',
        text: 'Fylke',
      },
    ],
  ],
}
