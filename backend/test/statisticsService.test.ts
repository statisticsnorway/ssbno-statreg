/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { ApprovalStatus, StatisticStatus, type StatisticUpdate } from '@ssbno-statreg/shared'
import { statisticsAsserts } from '@/lib/asserts'
import {
  getFilteredStatistics,
  getStatisticByShortname,
  parseStatisticVariants,
  mapStatisticDetails,
  parseCreateStatisticInput,
  parseUpdateStatisticInput,
  updateStatistic,
  updateContacts,
  createStatistic,
  StatisticsDetailedIncludes,
  parseDivision,
  parseStatusCode,
  parseRelation,
  buildStatisticFilter,
} from '@/services/statisticsService'

const { getAllUsersFromCacheMock, fetchDivisionMock } = vi.hoisted(() => ({
  getAllUsersFromCacheMock: vi.fn(async () => {
    return {
      'bcd@ssb.no': {
        displayName: 'Bob',
        userPrincipalName: 'bcd@ssb.no',
        mail: 'bob@ssb.no',
        businessPhones: ['11223344'],
      },
    }
  }),
  fetchDivisionMock: vi.fn((code: string, language?: string) => {
    if (code === '104' && language === 'en') return { code: '104', name: 'Division A1' }
    if (code === '104') return { code: '104', name: 'Seksjon A1' }
    if (code === '105') return { code: '105', name: 'Seksjon B1' }
  }),
}))

vi.mock(import('@/lib/cache'), async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/cache')>()
  return {
    ...original,
    getAllUsersFromCache: getAllUsersFromCacheMock,
  }
})

vi.mock(import('@/services/klassService'), async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/klassService')>()
  return {
    ...original,
    getDivisionFromCode: fetchDivisionMock,
  }
})

vi.mock(import('@/lib/utils'), async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/utils')>()
  return {
    ...original,
  }
})

let prismaMock: any
let statisticsResult: object | null
let updateStatisticsResult: object | null

function setStatisticsResult(next: object | null) {
  statisticsResult = next
}

function setUpdateStatisticsResult(next: object | null) {
  updateStatisticsResult = next
}

describe('statisticService', () => {
  beforeEach(() => {
    prismaMock = {
      statistic: {
        findMany: vi.fn(() => Promise.resolve(statisticsResult)),
        findFirst: vi.fn(() => Promise.resolve(statisticsResult)),
        update: vi.fn(() => Promise.resolve(updateStatisticsResult)),
        create: vi.fn(() => Promise.resolve(statisticsResult)),
        count: vi.fn(() => Promise.resolve(statisticsResult ? (statisticsResult as any).length : 0)),
      },
      shortname: {
        findUnique: vi.fn(() => Promise.resolve({ name: 'kpi', id: 1 })),
      },
      responsiblePerson: {
        upsert: vi.fn(),
      },
    }
    statisticsAsserts.assertFilteredShortnamesExist = vi.fn(async () => true) as any
  })

  describe('getAllStatistics ', () => {
    test('returns mocked data', async () => {
      setStatisticsResult(mockStatisticsPrismaResult)

      const result = await getFilteredStatistics({ start: 1, count: 2 }, prismaMock)

      expect(result).toStrictEqual(mockedStatisticsResult)
      expect(prismaMock.statistic.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 1, take: 2 }))
    })

    test('uses default start and count if not provided', async () => {
      setStatisticsResult(mockStatisticsPrismaResult)

      const result = await getFilteredStatistics({}, prismaMock)

      expect(result).toStrictEqual(mockedStatisticsResult)
      expect(prismaMock.statistic.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }))
    })

    test('sorts by field when sort is provided', async () => {
      setStatisticsResult(mockStatisticsPrismaResult)

      const result = await getFilteredStatistics({ sort: 'shortname' }, prismaMock)

      expect(result).toStrictEqual(mockedStatisticsResult)

      expect(prismaMock.statistic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { shortname: { name: 'asc' } } })
      )
    })

    test('uses undefined orderBy when invalid field is passed', async () => {
      setStatisticsResult(mockStatisticsPrismaResult)

      const result = await getFilteredStatistics({ sort: 'invalid_field' }, prismaMock)

      expect(result).toStrictEqual(mockedStatisticsResult)

      expect(prismaMock.statistic.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: undefined }))
    })

    test('returns empty list if no results', async () => {
      setStatisticsResult([])

      const result = await getFilteredStatistics({}, prismaMock)

      expect(result).toStrictEqual({
        statistics: [],
        total: 0,
      })
    })
  })

  describe('getFilteredStatistics ', () => {
    describe('runs without error with different valid input combination: ', () => {
      test.each([
        {
          testCase: 'no filter',
          input: {},
        },
        {
          testCase: 'count',
          input: {
            count: 10,
          },
        },
        {
          testCase: 'start',
          input: {
            start: 0,
          },
        },
        {
          testCase: 'one shortname',
          input: {
            filterByShortnames: ['KPI'],
          },
        },
        {
          testCase: 'several shortnames',
          input: {
            filterByShortnames: ['KPI', 'energ'],
          },
        },
        {
          testCase: 'one contact initial',
          input: {
            filterByContactPrincipalName: ['abc@ssb.no'],
          },
        },
        {
          testCase: 'several contact initials',
          input: {
            filterByContactPrincipalName: ['abc@ssb.no', 'bcd@ssb.no'],
          },
        },
        {
          testCase: 'shortnames and contact initials',
          input: {
            filterByShortnames: ['KPI', 'energ'],
            filterByContactPrincipalName: ['abc@ssb.no'],
          },
        },
        {
          testCase: 'shortnames and sort',
          input: {
            filterByShortnames: ['KPI'],
            sort: 'shortname',
          },
        },
      ])('$testCase', async ({ input }) => {
        setStatisticsResult(mockStatisticsPrismaResult)

        const result = await getFilteredStatistics(input, prismaMock)

        expect(result).toBeTruthy()
      })
    })

    describe('throws error with different invalid input combination: ', () => {
      test('throws when buildStatisticFilter throws', async () => {
        statisticsAsserts.assertFilteredShortnamesExist = vi.fn(async () => {
          throw { status: 404, statregError: "Shortname(s) not found: 'BAD'" }
        })

        await expect(() =>
          getFilteredStatistics({ filterByShortnames: ['BAD', 'KPI'] }, prismaMock)
        ).rejects.toMatchObject({
          status: 404,
          statregError: "Shortname(s) not found: 'BAD'",
        })
      })
    })
  })

  describe('buildStatisticFilter ', () => {
    describe('returns correct where clause for different input combinations: ', () => {
      test.each([
        {
          testCase: 'no filter',
          input: {},
          expectedWhere: {},
        },
        {
          testCase: 'one shortname',
          input: {
            filterByShortnames: ['KPI'],
          },
          expectedWhere: {
            OR: [
              {
                shortname: {
                  name: 'KPI',
                },
              },
            ],
          },
        },
        {
          testCase: 'several shortnames',
          input: {
            filterByShortnames: ['KPI', 'energ'],
          },
          expectedWhere: {
            OR: [
              {
                shortname: {
                  name: 'KPI',
                },
              },
              {
                shortname: {
                  name: 'energ',
                },
              },
            ],
          },
        },
        {
          testCase: 'one contact initial',
          input: {
            filterByContactPrincipalName: ['abc@ssb.no'],
          },
          expectedWhere: {
            responsiblePersons: {
              some: {
                principalName: { in: ['abc@ssb.no'] },
              },
            },
          },
        },
        {
          testCase: 'several contact initials',
          input: {
            filterByContactPrincipalName: ['abc@ssb.no', 'bcd@ssb.no'],
          },
          expectedWhere: {
            responsiblePersons: {
              some: {
                principalName: { in: ['abc@ssb.no', 'bcd@ssb.no'] },
              },
            },
          },
        },
        {
          testCase: 'shortnames and contact initials',
          input: {
            filterByShortnames: ['KPI', 'energ'],
            filterByContactPrincipalName: ['abc@ssb.no'],
          },
          expectedWhere: {
            OR: [
              {
                shortname: {
                  name: 'KPI',
                },
              },
              {
                shortname: {
                  name: 'energ',
                },
              },
            ],
            responsiblePersons: {
              some: {
                principalName: { in: ['abc@ssb.no'] },
              },
            },
          },
        },
      ])('$testCase', async ({ input, expectedWhere }) => {
        const result = await buildStatisticFilter(input, prismaMock)

        expect(result).toStrictEqual(expectedWhere)
      })
    })

    test('throws when shortname does not exist', async () => {
      statisticsAsserts.assertFilteredShortnamesExist = vi.fn(async () => {
        throw { status: 404, statregError: "Shortname(s) not found: 'BAD'" }
      }) as any

      await expect(() =>
        buildStatisticFilter({ filterByShortnames: ['BAD', 'KPI'] }, prismaMock)
      ).rejects.toMatchObject({
        status: 404,
        statregError: "Shortname(s) not found: 'BAD'",
      })
    })
  })

  describe('getStatisticByShortname ', async () => {
    test('returns mocked data', async () => {
      setStatisticsResult(mockStatisticsDetailedPrismaResult)

      const result = await getStatisticByShortname('helse', prismaMock)

      expect(result).toStrictEqual(mockedStatisticDetailedResult)
    })

    test('throws Error when shortname is not found', async () => {
      setStatisticsResult(null)
      await expect(() => getStatisticByShortname('', prismaMock)).rejects.toMatchObject({
        statregError: 'Shortname not found',
      })
    })
  })

  describe('updateStatistics ', async () => {
    let input: any

    beforeEach(() => {
      input = {
        division: '105',
        status: { code: 'SP' },
        name: 'Helse',
        name_en: 'Health',
        approval_status: 'FORSLAG',
        relation: '2',
        previous_topic_codes: '05.01.02',
        yearly_reporting: false,
        first_released_at: '2026-03-25',
        main_language: 'nn',
        comment: 'Beskrivelse av endring',
        statistic_region_levels: [{ code: 'L' }],
      }
    })

    test('returns mocked data', async () => {
      setStatisticsResult({
        id: 5,
        statistic_region_levels: [
          {
            region_level: {
              id: 1,
              code: 'K',
            },
          },
        ],
      })

      setUpdateStatisticsResult({
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

      await updateStatistic('helse', input, prismaMock)

      expect(prismaMock.statistic.update).toHaveBeenCalledExactlyOnceWith({
        ...mockUpdateStatisticPrismaUpdateData,
        include: StatisticsDetailedIncludes,
      })
    })

    test('throws Error when shortname is not found', async () => {
      setStatisticsResult(null)

      await expect(() => updateStatistic('test', input, prismaMock)).rejects.toMatchObject({
        status: 404,
        statregError: 'Shortname test not found',
      })
      expect(prismaMock.statistic.update).toHaveBeenCalledTimes(0)
    })
  })

  describe('updateContacts ', async () => {
    beforeEach(() => {
      prismaMock.statistic.findFirst.mockResolvedValue({ id: 1 })

      getAllUsersFromCacheMock.mockImplementation(async () => ({
        'abc@ssb.no': {
          displayName: 'Alice',
          userPrincipalName: 'abc@ssb.no',
          mail: 'alice@ssb.no',
          businessPhones: [],
        },
        'bcd@ssb.no': {
          displayName: 'Bob',
          userPrincipalName: 'bcd@ssb.no',
          mail: 'bob@ssb.no',
          businessPhones: ['11223344'],
        },
      }))

      prismaMock.responsiblePerson.upsert.mockResolvedValueOnce({ id: 2 }).mockResolvedValueOnce({ id: 3 })

      prismaMock.statistic.update.mockResolvedValue({
        responsiblePersons: [{ principalName: 'abc@ssb.no' }, { principalName: 'bcd@ssb.no' }],
      })
    })

    test('returns updated contacts when valid shortname and principal names are provided', async () => {
      const result = await updateContacts('helse', ['abc@ssb.no', 'bcd@ssb.no'], prismaMock)

      expect(prismaMock.statistic.findFirst).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          where: { shortname: { name: 'helse' } },
        })
      )
      expect(prismaMock.responsiblePerson.upsert).toHaveBeenCalledTimes(2)
      expect(prismaMock.responsiblePerson.upsert).toHaveBeenNthCalledWith(1, {
        where: { principalName: 'abc@ssb.no' },
        create: { principalName: 'abc@ssb.no' },
        update: {},
      })
      expect(prismaMock.responsiblePerson.upsert).toHaveBeenNthCalledWith(2, {
        where: { principalName: 'bcd@ssb.no' },
        create: { principalName: 'bcd@ssb.no' },
        update: {},
      })
      expect(prismaMock.statistic.update).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          where: { id: 1 },
          data: {
            responsiblePersons: {
              set: [{ id: 2 }, { id: 3 }],
            },
          },
        })
      )
      expect(result).toStrictEqual([
        { name: 'Alice', principalName: 'abc@ssb.no' },
        { name: 'Bob', principalName: 'bcd@ssb.no' },
      ])
    })

    test('throws error when shortname is not found', async () => {
      prismaMock.statistic.findFirst.mockResolvedValue(null)

      await expect(() => updateContacts('helse', ['abc@ssb.no'], prismaMock)).rejects.toMatchObject({
        status: 404,
        statregError: "Shortname 'helse' not found",
      })
      expect(prismaMock.responsiblePerson.upsert).toHaveBeenCalledTimes(0)
      expect(prismaMock.statistic.update).toHaveBeenCalledTimes(0)
    })

    test('throws error when statistic is active and new contacts is empty', async () => {
      prismaMock.statistic.findFirst.mockResolvedValue({ id: 1, status: 'Aktiv' })

      await expect(() => updateContacts('helse', [], prismaMock)).rejects.toMatchObject({
        statregError: 'An active statistic needs at least one contact',
      })
      expect(prismaMock.responsiblePerson.upsert).toHaveBeenCalledTimes(0)
      expect(prismaMock.statistic.update).toHaveBeenCalledTimes(0)
    })
  })

  describe('createStatistic ', () => {
    let now: Date
    beforeEach(() => {
      now = new Date('2026-03-23T08:00:00Z')
    })

    test('creates a new statistic when input data is valid', async () => {
      setStatisticsResult({
        ...mockedStatisticCreatedPrismaResult,
        id: 1,
        version: 1,
        desk_appoval_status: ApprovalStatus.PENDING,
        status: 'K',
      })

      await createStatistic(
        prismaMock,
        'kpi',
        {
          name: 'Konsumprisindeksen',
          name_en: 'Consumer price index',
          division: '104',
          first_released_at: '2024-04-01',
          main_language: 'nb',
          status: { code: 'K' },
        },
        now
      )

      expect(prismaMock.statistic.create).toHaveBeenCalledExactlyOnceWith({
        data: {
          name: 'Konsumprisindeksen',
          priority: 1,
          name_en: 'Consumer price index',
          yearly_reporting: false,
          status: 'K',
          division_code: '104',
          first_release: new Date('2024-04-01T00:00:00.000Z'),
          comment: 'Create statistic with shortname: kpi',
          language: 'nb',
          date_created: now,
          last_updated: now,
          desk_appoval_status: ApprovalStatus.ACCEPTED,
          shortname: {
            connect: {
              name: 'kpi',
            },
          },
        },
        include: StatisticsDetailedIncludes,
      })
    })

    test('reject with error message if body is missing', async () => {
      await expect(() => createStatistic(prismaMock, 'kpi', undefined, now)).rejects.toMatchObject({
        statregError: "Field 'status' must be one of these: K, A.",
      })
      expect(prismaMock.statistic.create).toHaveBeenCalledTimes(0)
    })

    test('rejects with error message any of the required fields are missing', async () => {
      await expect(() => createStatistic(prismaMock, 'kpi', { status: { code: 'A' } }, now)).rejects.toMatchObject({
        statregError: 'Missing required field(s): name, name_en, variants, contacts, division, main_language',
      })
      expect(prismaMock.statistic.create).toHaveBeenCalledTimes(0)
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
      ] as any)

      expect(result).toStrictEqual([
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
          revision: {
            code: 'I',
          },
        },
      ])
    })

    test('returns empty array when variants is empty', () => {
      const result = parseStatisticVariants([])

      expect(result).toStrictEqual([])
    })
  })

  describe('mapStatisticDetails ', async () => {
    let input: any
    let expectedResult: any
    let fetchUsersResult: any

    beforeEach(() => {
      input = structuredClone(mockStatisticsDetailedPrismaResult)
      input.responsiblePersons = [{ principalName: 'bcd@ssb.no' }]

      fetchUsersResult = {
        'bcd@ssb.no': {
          displayName: 'Bob',
          userPrincipalName: 'bcd@ssb.no',
          mail: 'bob@ssb.no',
          businessPhones: ['11223344'],
        },
      }
      getAllUsersFromCacheMock.mockImplementation(async () => {
        return fetchUsersResult
      })

      expectedResult = structuredClone(mockedStatisticDetailedResult)
      expectedResult.contacts = [{ principalName: 'bcd@ssb.no', name: 'Bob' }]
    })

    test('returns valid statisticDetails when all conditionals succeed', async () => {
      const result = await mapStatisticDetails(input)

      expect(result).toStrictEqual(expectedResult)
    })

    test('falls back to empty relation object when related statistic is missing', async () => {
      input.related_statistic = null
      expectedResult.relation = {}

      const result = await mapStatisticDetails(input)

      expect(result).toStrictEqual(expectedResult)
    })

    test('falls back to pending approval status when desk approval status is missing', async () => {
      input.desk_appoval_status = null
      expectedResult.approval_status = ApprovalStatus.PENDING

      const result = await mapStatisticDetails(input)

      expect(result).toStrictEqual(expectedResult)
    })

    test('falls back to undefined division name when division lookup does not find a match', async () => {
      input.division_code = '106'
      expectedResult.division = { code: '106', name: undefined }

      const result = await mapStatisticDetails(input)

      expect(result).toStrictEqual(expectedResult)
    })

    test('falls back to empty english name when name_en is missing', async () => {
      input.name_en = null
      expectedResult.name_en = ''

      const result = await mapStatisticDetails(input)

      expect(result).toStrictEqual(expectedResult)
    })

    test('falls back to empty contact array when responsible persons is empty', async () => {
      input.responsiblePersons = []
      fetchUsersResult = {}
      expectedResult.contacts = []

      const result = await mapStatisticDetails(input)

      expect(result).toStrictEqual(expectedResult)
    })

    test('falls back to empty region level code when code is missing', async () => {
      input.statistic_region_levels[0].region_level.code = null
      expectedResult.statistic_region_levels[0].code = ''

      const result = await mapStatisticDetails(input)

      expect(result).toStrictEqual(expectedResult)
    })
  })

  describe('parseCreateStatisticInput ', async () => {
    let input: any
    let expectedResult: any

    beforeEach(() => {
      input = {
        status: { code: 'K' },
        division: '104',
        name: 'Helse og helsetjenester',
        first_released_at: '2024-04-01',
      }

      expectedResult = {
        division: '104',
        name: 'Helse og helsetjenester',
        main_language: 'nb',
        comment: '',
        first_released_at: new Date('2024-04-01T00:00:00.000Z'),
      }
    })

    test('returns validated statistic input when all conditionals succeed', () => {
      const result = parseCreateStatisticInput(input, 'K')

      expect(result).toStrictEqual(expectedResult)
    })

    test('throws error when name is an empty string', () => {
      input.name = ''

      expect(() => parseCreateStatisticInput(input, 'K')).toThrow({
        statregError: "Field 'name' must be a non-empty string.",
      })
    })

    test('throws error when division is not a number', () => {
      input.division = 'division-a'

      expect(() => parseCreateStatisticInput(input, 'K')).toThrow({
        statregError: "Field 'division' must be a number.",
      })
    })

    test('throws error when division lookup does not find a match', () => {
      input.division = '106'

      expect(() => parseCreateStatisticInput(input, 'K')).toThrow({
        statregError: "Field 'division' does not correspond to an existing division.",
      })
    })

    test("throws error main_language is neither 'nb' or 'nn'", () => {
      input.main_language = 'en'
      expectedResult.main_language = 'nb'

      expect(() => parseCreateStatisticInput(input, 'K')).toThrow({
        statregError: "Field 'main_language' must be either 'nb' or 'nn'.",
      })
    })

    test('falls back to empty string when comment is missing', () => {
      input.comment = undefined
      expectedResult.comment = ''

      const result = parseCreateStatisticInput(input, 'K')

      expect(result).toStrictEqual(expectedResult)
    })

    describe('parseUpdateStatisticInput', async () => {
      let input: any
      let expectedResult: any
      const requiredUpdateFields = [
        'division',
        'statistic_region_levels',
        'status',
        'name',
        'name_en',
        'relation',
        'previous_topic_codes',
        'yearly_reporting',
        'first_released_at',
        'main_language',
        'comment',
      ] as (keyof StatisticUpdate)[]

      beforeEach(() => {
        input = {
          division: '104',
          name: 'Helse og helsetjenester',
          name_en: 'Health and health services',
          first_released_at: '2024-04-01',
          main_language: 'nn',
          comment: 'Kommentar om statistikken',
          status: { code: 'SA' },
          relation: 2,
          previous_topic_codes: '05.01.02',
          yearly_reporting: false,
          statistic_region_levels: [],
        }

        expectedResult = {
          division: '104',
          name: 'Helse og helsetjenester',
          name_en: 'Health and health services',
          first_released_at: new Date('2024-04-01T00:00:00.000Z'),
          main_language: 'nn',
          comment: 'Kommentar om statistikken',
          status: 'SA',
          relation: 2,
          previous_topic_codes: '05.01.02',
          yearly_reporting: false,
          statistic_region_levels: [],
        }
      })

      test('returns validated statistic input when all conditionals succeed', () => {
        const result = parseUpdateStatisticInput(input, requiredUpdateFields)

        expect(result).toStrictEqual(expectedResult)
      })

      test('throws error when comment is an empty string', () => {
        input.comment = ''

        expect(() => parseUpdateStatisticInput(input, requiredUpdateFields)).toThrow({
          statregError: "Field 'comment' must be a non-empty string.",
        })
      })

      test('throws error when yearly_reporting is not a valid boolean', () => {
        input.yearly_reporting = 'not-a-boolean'

        expect(() => parseUpdateStatisticInput(input, requiredUpdateFields)).toThrow({
          statregError: "Field 'yearly_reporting' must be a boolean.",
        })
      })

      test('throws error when relation id is an invalid format', () => {
        input.relation = 'abc'

        expect(() => parseUpdateStatisticInput(input, requiredUpdateFields)).toThrow({
          statregError: 'Invalid relation id format',
        })
      })

      test('throws error when status is not valid value', () => {
        input.status = 'ABC'

        expect(() => parseUpdateStatisticInput(input, requiredUpdateFields)).toThrow({
          statregError: "Field 'status' must be one of these: K, A, IA, UT, SA, SP.",
        })
      })
    })
  })

  describe('parseDivision ', () => {
    test('returns division as string when valid', () => {
      expect(parseDivision('104')).toBe('104')
    })

    test('throws when division is undefined', () => {
      expect(() => parseDivision(undefined)).toThrow({ statregError: "Field 'division' must be a number." })
    })

    test('throws when division is null', () => {
      expect(() => parseDivision(null)).toThrow({ statregError: "Field 'division' must be a number." })
    })

    test('throws when division is not a number', () => {
      expect(() => parseDivision('abc')).toThrow({ statregError: "Field 'division' must be a number." })
    })

    test('throws when division does not correspond to an existing division', () => {
      expect(() => parseDivision('999')).toThrow({
        statregError: "Field 'division' does not correspond to an existing division.",
      })
    })
  })

  describe('parseStatusCode', () => {
    const expectedError = `Field 'status' must be one of these: ${Object.keys(StatisticStatus).join(', ')}.`

    test('returns statusCode when valid', () => {
      expect(parseStatusCode('K')).toBe('K')
    })

    test('throws when statusCode is undefined', () => {
      expect(() => parseStatusCode(undefined)).toThrow({ statregError: expectedError })
    })

    test('throws when statusCode is empty string', () => {
      expect(() => parseStatusCode('')).toThrow({ statregError: expectedError })
    })

    test('throws when statusCode is not a valid status', () => {
      expect(() => parseStatusCode('INVALID_STATUS')).toThrow({ statregError: expectedError })
    })

    test('is case-sensitive', () => {
      expect(() => parseStatusCode('k')).toThrow({ statregError: expectedError })
    })
  })

  describe('parseRelation', () => {
    test('returns null when relationId is undefined', () => {
      expect(parseRelation(undefined)).toBeNull()
    })

    test('returns null when relationId is null', () => {
      expect(parseRelation(null)).toBeNull()
    })

    test('returns null when relationId is empty string', () => {
      expect(parseRelation('')).toBeNull()
    })

    test('returns parsed number when relationId is valid', () => {
      expect(parseRelation('42')).toBe(42)
    })

    test('throws when relationId is not a valid id', () => {
      expect(() => parseRelation('abc')).toThrow({ statregError: 'Invalid relation id format' })
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
    division_code: '104',
    responsiblePersons: [
      {
        principalName: 'abc@ssb.no',
      },
    ],
  },
  {
    language: 'nb',
    status: 'SA',
    name: 'Befolkning og demografi',
    name_en: 'Population and demography',
    shortname: { name: 'befolk' },
    division_code: '105',
    responsiblePersons: [
      {
        principalName: 'bcd@ssb.no',
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
      principalName: 'bcd@ssb.no',
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

const mockedStatisticsResult = {
  statistics: [
    {
      shortname: 'energ',
      main_language: 'nb',
      status: { code: 'SA' },
      division: {
        name: 'Seksjon A1',
        code: '104',
      },
      name: 'Energiregnskap og energibalanse',
      name_en: 'Energy account and energy balance',
      contacts: [{ principalName: 'abc@ssb.no', name: '' }],
    },
    {
      shortname: 'befolk',
      main_language: 'nb',
      status: { code: 'SA' },
      division: {
        code: '105',
        name: 'Seksjon B1',
      },
      name: 'Befolkning og demografi',
      name_en: 'Population and demography',
      contacts: [{ principalName: 'bcd@ssb.no', name: 'Bob' }],
    },
  ],
  total: 2,
}

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
      revision: {
        code: 'I',
      },
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
      revision: {
        code: 'I',
      },
    },
  ],
  contacts: [{ principalName: 'bcd@ssb.no', name: 'Bob' }],
  statistic_region_levels: [{ name: 'Bydel og krets', code: 'BD' }],
}

const mockUpdateStatisticPrismaUpdateData = {
  data: {
    comment: 'Beskrivelse av endring',
    desk_appoval_status: 'FORSLAG',
    division_code: '105',
    first_release: new Date('2026-03-25T00:00:00.000Z'),
    language: 'nn',
    legacy_topic_codes: '05.01.02',
    name: 'Helse',
    name_en: 'Health',
    related_statistic_id: 2,
    statistic_region_levels: {
      create: [
        {
          region_level: {
            connect: {
              code: 'L',
            },
          },
        },
      ],
      delete: [
        {
          statistic_id_region_level_id: {
            region_level_id: 1,
            statistic_id: 5,
          },
        },
      ],
    },
    status: 'SP',
    yearly_reporting: false,
  },
  where: {
    id: 5,
  },
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
