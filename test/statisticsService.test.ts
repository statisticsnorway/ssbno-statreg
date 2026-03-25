import { describe, mock, test, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

let prismaMock: any
let statisticsResult: object | null

function setStatisticsResult(next: object | null) {
  statisticsResult = next
}

// TODO MIM-2592: Add unit tests for updateStatistic()

describe('statisticService ', async () => {
  const fetchUsersMock: any = mock.fn(async () => [
    {
      lookupEmail: 'bob@ssb.no',
      user: {
        displayName: 'Bob',
        username: 'bcd',
        email: 'bob@ssb.no',
        businessPhone: '11223344',
      },
    },
  ])

  const fetchDivisionMock = mock.fn((code: number, language?: string) => {
    if (code === 104 && language === 'en') return { code: 104, name: 'Division A1' }
    if (code === 104) return { code: 104, name: 'Seksjon A1' }
  })

  let getStatisticByShortname: Function
  let getAllStatistics: Function
  let parseStatisticVariants: Function

  before(async () => {
    // eslint-disable-next-line no-unused-vars
    const entraUser = await import('@/services/entraUserService').then(({ fetchUsers: _, ...rest }) => rest)
    mock.module('@/services/entraUserService', {
      namedExports: {
        fetchUsers: fetchUsersMock,
        entraUser,
      },
    })

    // eslint-disable-next-line no-unused-vars
    const klassService = await import('@/services/klassService').then(({ getDivisionFromCode: _, ...rest }) => rest)
    mock.module('@/services/klassService', {
      namedExports: {
        getDivisionFromCode: fetchDivisionMock,
        klassService,
      },
    })
    ;({ getAllStatistics, getStatisticByShortname, parseStatisticVariants } =
      await import('@/services/statisticsService'))
  })

  beforeEach(async () => {
    prismaMock = {
      statistic: {
        findMany: mock.fn(() => Promise.resolve(statisticsResult)),
        findFirst: mock.fn(() => Promise.resolve(statisticsResult)),
      },
    }
  })

  describe('getAllStatistics ', async () => {
    test('returns mocked data', async () => {
      setStatisticsResult(mockStatisticsPrismaResult)

      const result = await getAllStatistics({ start: 1, count: 2 }, prismaMock)

      assert.deepEqual(result, mockedStatisticsResult)
      assert.equal(prismaMock.statistic.findMany.mock.calls[0].arguments[0]['skip'], 1)
      assert.equal(prismaMock.statistic.findMany.mock.calls[0].arguments[0]['take'], 2)
    })

    test('uses default start and count if not provided', async () => {
      setStatisticsResult(mockStatisticsPrismaResult)

      const result = await getAllStatistics({}, prismaMock)

      assert.deepEqual(result, mockedStatisticsResult)
      assert.equal(prismaMock.statistic.findMany.mock.calls[0].arguments[0]['skip'], 0)
      assert.equal(prismaMock.statistic.findMany.mock.calls[0].arguments[0]['take'], 10)
    })

    test('returns empty list if no results', async () => {
      setStatisticsResult([])

      const result = await getAllStatistics({}, prismaMock)

      assert.deepEqual(result, [])
    })
  })

  describe('getStatisticByShortname', async () => {
    test('returns mocked data', async () => {
      setStatisticsResult(mockStatisticsDetailedPrismaResult)

      const result = await getStatisticByShortname('helse', prismaMock)

      assert.deepEqual(result, mockedStatisticDetailedResult)
    })

    test('throws Error when shortname is not found', async () => {
      setStatisticsResult(null)
      await assert.rejects(() => getStatisticByShortname('', prismaMock), { statregError: 'Shortname not found' })
    })

    test('returns undefined division name when division does not exist', async () => {
      setStatisticsResult({ ...mockStatisticsDetailedPrismaResult, division_code: '105' })

      const result = await getStatisticByShortname('helse', prismaMock)

      assert.deepEqual(result, { ...mockedStatisticDetailedResult, division: { code: '105', name: [] } })
    })

    test('returns only email when user is not found', async () => {
      setStatisticsResult(mockStatisticsDetailedPrismaResult)
      fetchUsersMock.mock.mockImplementationOnce(async () => [
        { lookupEmail: 'bob@ssb.no', user: null, error: 'User not found' },
      ])

      const result = await getStatisticByShortname('helse', prismaMock)

      assert.deepEqual(result, {
        ...mockedStatisticDetailedResult,
        contacts: [{ username: undefined, email: 'bob@ssb.no', name: undefined }],
      })
    })

    test('returns empty contact array when responsible persons is empty', async () => {
      setStatisticsResult({ ...mockStatisticsDetailedPrismaResult, responsiblePersons: [] })
      fetchUsersMock.mock.mockImplementationOnce(async () => [])

      const result = await getStatisticByShortname('helse', prismaMock)

      assert.deepEqual(result, {
        ...mockedStatisticDetailedResult,
        contacts: [],
      })
    })
  })

  describe('parseStatisticVariants', async () => {
    test('returns parsed variants array', () => {
      const result = parseStatisticVariants(
        [
          {
            id: 1,
            last_updated: new Date('2025-06-20T10:39:51.621Z'),
            date_created: new Date('2025-06-20T10:39:51.621Z'),
            cancelled: false,
            revision: 'I',
            level_of_detail: 'Kommentar',
            level_of_detail_en: null,
            frequency: {
              name: 'Måned',
              name_en: 'Month',
            },
          },
        ],
        'nb',
        'en'
      )

      assert.deepEqual(result, [
        {
          id: 1,
          updated_at: '2025-06-20T10:39:51.621Z',
          level_of_detail: { name: [{ language_code: 'nb', text: 'Kommentar' }] },
          created_at: '2025-06-20T10:39:51.621Z',
          cancelled: false,
          frequency: {
            name: [
              { language_code: 'nb', text: 'Måned' },
              { language_code: 'en', text: 'Month' },
            ],
          },
          revision: 'I',
        },
      ])
    })

    test('returns empty array when variants is empty', () => {
      const result = parseStatisticVariants([], 'nb', 'en')

      assert.deepEqual(result, [])
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
  id: 5,
  version: 1,
  shortname_id: 5,
  dir_appoval_status: 'GODKJENT',
  search_phrases: 'helse, sykdom, helsetjenester, forekomst',
  priority: 0,
  desk_appoval_status: 'GODKJENT',
  language: 'nb',
  search_phrases_en: 'health, disease, health services, prevalence',
  division_code: '104',
  division_id: null,
  first_release: new Date('1970-01-01T00:00:00.000Z'),
  yearly_reporting: true,
  status: 'SA',
  related_statistic_id: 3,
  name: 'Helse og helsetjenester',
  last_updated: new Date('2021-09-01T08:30:00.000Z'),
  comment: 'statistikk over befolkningens helse og tjenestebruk',
  name_en: 'Health and health services',
  date_created: new Date('2019-07-01T00:00:00.000Z'),
  legacy_topic_codes: '05.01.01',
  shortname: {
    name: 'helse',
  },
  responsiblePersons: [
    {
      username: 'bcd',
      email: 'bob@ssb.no',
    },
  ],
  related_statistic: {
    language: 'nb',
    name: 'Utenrikshandel og varestrøm',
    name_en: 'Foreign trade and goods flow',
    shortname: {
      id: 3,
      version: 0,
      name: 'kpi',
      last_updated: new Date('2010-11-05T09:05:19.000Z'),
      date_created: new Date('2010-11-05T09:05:19.000Z'),
    },
  },
  statistic_region_levels: [
    {
      region_level: {
        name: 'Bydel og krets',
      },
    },
  ],
  variants: [
    {
      id: 1,
      last_updated: new Date('2025-06-20T10:39:51.621Z'),
      date_created: new Date('2025-06-20T10:39:51.621Z'),
      cancelled: false,
      revision: 'I',
      level_of_detail: null,
      level_of_detail_en: null,
      frequency: {
        name: 'Måned',
        name_en: 'Month',
      },
    },
    {
      id: 2,
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
  version: 1,
  shortname: 'helse',
  approval_status: 'GODKJENT',
  main_language: 'nb',
  division: {
    code: '104',
    name: [
      { language_code: 'nb', text: 'Seksjon A1' },
      { language_code: 'en', text: 'Division A1' },
    ],
  },
  first_released_at: '1970-01-01T00:00:00.000Z',
  yearly_reporting: true,
  status: { code: 'SA' },
  previous_topic_codes: '05.01.01',
  relation: {
    shortname: 'kpi',
    name: [
      { language_code: 'nb', text: 'Utenrikshandel og varestrøm' },
      { language_code: 'en', text: 'Foreign trade and goods flow' },
    ],
  },
  name: [
    { language_code: 'nb', text: 'Helse og helsetjenester' },
    { language_code: 'en', text: 'Health and health services' },
  ],
  updated_at: '2021-09-01T08:30:00.000Z',
  comment: 'statistikk over befolkningens helse og tjenestebruk',
  created_at: '2019-07-01T00:00:00.000Z',
  variants: [
    {
      id: 1,
      updated_at: '2025-06-20T10:39:51.621Z',
      level_of_detail: { name: [] },
      created_at: '2025-06-20T10:39:51.621Z',
      cancelled: false,
      frequency: {
        name: [
          { language_code: 'nb', text: 'Måned' },
          { language_code: 'en', text: 'Month' },
        ],
      },
      revision: 'I',
    },
    {
      id: 2,
      updated_at: '2025-06-20T10:39:51.621Z',
      level_of_detail: { name: [] },
      created_at: '2025-06-20T10:39:51.621Z',
      cancelled: false,
      frequency: {
        name: [
          { language_code: 'nb', text: 'Uke' },
          { language_code: 'en', text: 'Week' },
        ],
      },
      revision: 'I',
    },
  ],
  contacts: [{ username: undefined, name: 'Bob', email: 'bob@ssb.no' }],
  statistic_region_levels: [[{ language_code: 'nb', text: 'Bydel og krets' }]],
}
