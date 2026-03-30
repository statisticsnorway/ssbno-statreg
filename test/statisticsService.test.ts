import { describe, mock, test, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { ApprovalStatus } from '@/types/enums'
import { Users } from '@/types/entra'

let prismaMock: any
let statisticsResult: object | null
let now: Date

function setStatisticsResult(next: object | null) {
  statisticsResult = next
}

describe('statisticService ', async () => {
  const fetchUsersMock: any = mock.fn(async (users: Users[]) => {
    if (!users?.length) return []
    return [
      {
        lookupEmail: 'bob@ssb.no',
        user: {
          displayName: 'Bob',
          username: 'bcd',
          email: 'bob@ssb.no',
          businessPhone: '11223344',
        },
      },
    ]
  })

  const fetchDivisionMock = mock.fn((code: number, language?: string) => {
    if (code === 104 && language === 'en') return { code: 104, name: 'Division A1' }
    if (code === 104) return { code: 104, name: 'Seksjon A1' }
  })

  let getStatisticByShortname: Function
  let getAllStatistics: Function
  let updateStatistic: Function
  let createStatistic: Function
  let parseStatisticVariants: Function
  let StatisticsDetailedIncludes: any

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
    ;({
      getAllStatistics,
      getStatisticByShortname,
      parseStatisticVariants,
      updateStatistic,
      createStatistic,
      StatisticsDetailedIncludes,
    } = await import('@/services/statisticsService'))
  })

  beforeEach(async () => {
    prismaMock = {
      statistic: {
        findMany: mock.fn(() => Promise.resolve(statisticsResult)),
        findFirst: mock.fn(() => Promise.resolve(statisticsResult)),
        update: mock.fn(() => Promise.resolve(statisticsResult)),
        create: mock.fn(() => Promise.resolve(statisticsResult)),
      },
      shortname: {
        findUnique: mock.fn(() => Promise.resolve({ name: 'kpi', id: 1 })),
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

  describe('getStatisticByShortname ', async () => {
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

      assert.deepEqual(result, { ...mockedStatisticDetailedResult, division: { code: '105', name: undefined } })
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

  describe('updateStatistics ', async () => {
    test('returns mocked data', async () => {
      const input = {
        division: '105',
        status: { code: 'SP' },
        name: 'Helse',
        name_en: 'Health',
        approval_status: 'FORSLAG',
        relation: '2',
        previous_topic_codes: '05.01.02',
        yearly_reporting: false,
        first_released_at: '2026-03-25T08:30:00.000Z',
        main_language: 'nn',
        comment: 'Beskrivelse av endring',
      }

      setStatisticsResult({
        ...mockStatisticsDetailedPrismaResult,
        division_code: input.division,
        name: input.name,
        name_en: input.name_en,
        status: input.status.code,
        desk_appoval_status: input.approval_status,
        language: input.main_language,
        previous_topic_codes: input.previous_topic_codes,
        yearly_reporting: input.yearly_reporting,
        first_released_at: input.first_released_at,
        comment: input.comment,
        related_statistic: {
          language: 'nb',
          name: 'Befolkning og demografi',
          name_en: 'Foreign trade and goods flow',
          shortname: {
            name: 'befolk',
          },
        },
      })

      const result = await updateStatistic('helse', input, prismaMock)

      assert.deepStrictEqual(prismaMock.statistic.update.mock.callCount(), 1)
      assert.deepStrictEqual(prismaMock.statistic.update.mock.calls[0].arguments[0], {
        ...mockUpdateStatisticPrismaUpdateData,
        include: StatisticsDetailedIncludes,
      })
      assert.deepStrictEqual(result, {
        ...mockedStatisticDetailedResult,
        division: { code: input.division, name: undefined },
        main_language: input.main_language,
        yearly_reporting: input.yearly_reporting,
        approval_status: input.approval_status,
        comment: input.comment,
        name: 'Helse',
        name_en: 'Health',
        relation: {
          shortname: 'befolk',
          name: 'Befolkning og demografi',
          name_en: 'Foreign trade and goods flow',
        },
        status: input.status,
        // TODO MIM-2595: Make adjustments if necessary on handle removal and addition of region level task
        statistic_region_levels: [{ name: 'Bydel og krets', code: 'BD' }],
      })
    })

    // TODO MIM-2593: input validation for main_language and name, and undefined values

    test('throws Error when shortname is not found', async () => {
      setStatisticsResult(null)

      await assert.rejects(() => updateStatistic('test', {}, prismaMock), {
        status: 404,
        statregError: `Shortname test not found`,
      })
      assert.deepStrictEqual(prismaMock.statistic.update.mock.callCount(), 0)
    })
  })

  describe('createStatistic ', () => {
    beforeEach(() => {
      now = new Date('2026-03-23T08:00:00Z')
    })

    test('creates a new statistic and returns mapped results', async () => {
      setStatisticsResult({
        ...mockedStatisticCreatedPrismaResult,
        id: 1,
        version: 1,
        desk_appoval_status: ApprovalStatus.PENDING,
      })

      const result = await createStatistic(
        prismaMock,
        'kpi',
        { name: 'Konsumprisindeksen', division: '723', first_released_at: '2024-04-01' },
        now
      )

      assert.deepStrictEqual(prismaMock.statistic.create.mock.callCount(), 1)
      assert.deepStrictEqual(prismaMock.statistic.create.mock.calls[0].arguments[0], {
        data: {
          name: 'Konsumprisindeksen',
          priority: 1,
          name_en: undefined,
          yearly_reporting: false,
          status: 'K',
          division_code: '723',
          first_release: new Date('2024-04-01T00:00:00.000Z'),
          comment: 'Create statistic with shortname: kpi',
          language: 'nb',
          date_created: now,
          last_updated: now,
          desk_appoval_status: ApprovalStatus.PENDING,
          shortname: {
            connect: {
              name: 'kpi',
            },
          },
        },
        include: StatisticsDetailedIncludes,
      })
      assert.deepStrictEqual(result, {
        ...mockedStatisticCreatedResponse,
      })
    })

    test('returns 400 if request body is empty', async () => {
      await assert.rejects(() => createStatistic(prismaMock, 'kpi', undefined, now), {
        statregError: 'Norwegian name is required',
      })
      assert.strictEqual(prismaMock.statistic.create.mock.callCount(), 0)
    })

    test('returns 400 if any of the required fields are missing', async () => {
      // TODO: Add more fields to this test when validation logic are in place
      await assert.rejects(() => createStatistic(prismaMock, 'kpi', {}, now), {
        statregError: 'Norwegian name is required',
      })
      assert.strictEqual(prismaMock.statistic.create.mock.callCount(), 0)
    })
  })

  describe('parseStatisticVariants ', async () => {
    test('returns parsed variants array', () => {
      const result = parseStatisticVariants([
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
            code: 'M',
          },
        },
      ])

      assert.deepEqual(result, [
        {
          id: 1,
          updated_at: '2025-06-20T10:39:51.621Z',
          level_of_detail: { name: 'Kommentar', name_en: '' },
          created_at: '2025-06-20T10:39:51.621Z',
          cancelled: false,
          frequency: {
            code: 'M',
            name: 'Måned',
          },
          revision: 'I',
        },
      ])
    })

    test('returns empty array when variants is empty', () => {
      const result = parseStatisticVariants([])

      assert.deepEqual(result, [])
    })
  })

  describe('mapStatisticDetails ', async () => {
    // TODO: Add tests for mapping function
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
      name: 'kpi',
    },
  },
  statistic_region_levels: [
    {
      region_level: {
        name: 'Bydel og krets',
        code: 'BD',
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
        code: 'M',
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
        code: 'W',
      },
    },
  ],
}

const mockedStatisticsResult = [
  {
    shortname: 'energ',
    main_language: 'nb',
    status: { code: 'SA' },
    name: 'Energiregnskap og energibalanse',
    name_en: 'Energy account and energy balance',
    contacts: [{ username: 'abc', email: 'alice@ssb.no' }],
  },
  {
    shortname: 'befolk',
    main_language: 'nb',
    status: { code: 'SA' },
    name: 'Befolkning og demografi',
    name_en: 'Population and demography',
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
    name: 'Seksjon A1',
  },
  first_released_at: '1970-01-01T00:00:00.000Z',
  yearly_reporting: true,
  status: { code: 'SA' },
  previous_topic_codes: '05.01.01',
  relation: {
    shortname: 'kpi',
    name: 'Utenrikshandel og varestrøm',
    name_en: 'Foreign trade and goods flow',
  },
  name: 'Helse og helsetjenester',
  name_en: 'Health and health services',
  updated_at: '2021-09-01T08:30:00.000Z',
  comment: 'statistikk over befolkningens helse og tjenestebruk',
  created_at: '2019-07-01T00:00:00.000Z',
  variants: [
    {
      id: 1,
      updated_at: '2025-06-20T10:39:51.621Z',
      level_of_detail: { name: '', name_en: '' },
      created_at: '2025-06-20T10:39:51.621Z',
      cancelled: false,
      frequency: {
        name: 'Måned',
        code: 'M',
      },
      revision: 'I',
    },
    {
      id: 2,
      updated_at: '2025-06-20T10:39:51.621Z',
      level_of_detail: {
        name: '',
        name_en: '',
      },
      created_at: '2025-06-20T10:39:51.621Z',
      cancelled: false,
      frequency: {
        name: 'Uke',
        code: 'W',
      },
      revision: 'I',
    },
  ],
  contacts: [{ username: undefined, name: 'Bob', email: 'bob@ssb.no' }],
  statistic_region_levels: [{ name: 'Bydel og krets', code: 'BD' }],
}

const mockUpdateStatisticPrismaUpdateData = {
  data: {
    comment: 'Beskrivelse av endring',
    desk_appoval_status: 'FORSLAG',
    division_code: '105',
    first_release: '2026-03-25T08:30:00.000Z',
    language: 'nn',
    legacy_topic_codes: '05.01.02',
    name: 'Helse',
    name_en: 'Health',
    related_statistic_id: 2,
    statistic_region_levels: {},
    status: 'SP',
    yearly_reporting: false,
  },
  where: {
    id: 5,
  },
}

const mockedStatisticCreatedResponse = {
  version: 1,
  shortname: 'kpi',
  approval_status: 'FORSLAG',
  main_language: 'nb',
  division: {
    code: undefined,
    name: undefined,
  },
  first_released_at: '1970-01-01T00:00:00.000Z',
  yearly_reporting: false,
  status: { code: 'K' },
  previous_topic_codes: '',
  relation: {},
  name: 'Konsumprisindeksen',
  name_en: '',
  updated_at: '2026-03-23T08:00:00.000Z',
  comment: '',
  created_at: '2026-03-23T08:00:00.000Z',
  variants: [],
  contacts: [],
  statistic_region_levels: [],
}

const mockedStatisticCreatedPrismaResult = {
  id: 5,
  version: 1,
  desk_appoval_status: 'FORSLAG',
  language: 'nb',
  division_code: undefined,
  first_release: new Date('1970-01-01T00:00:00.000Z'),
  yearly_reporting: false,
  status: 'K',
  related_statistic_id: undefined,
  name: 'Konsumprisindeksen',
  last_updated: new Date('2026-03-23T08:00:00Z'),
  comment: '',
  name_en: '',
  date_created: new Date('2026-03-23T08:00:00Z'),
  legacy_topic_codes: '',
  shortname: {
    name: 'kpi',
  },
  responsiblePersons: [],
  related_statistic: {},
  statistic_region_levels: [],
  variants: [],
}
