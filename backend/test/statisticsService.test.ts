/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { ApprovalStatus, StatisticStatus, type StatisticUpdate } from '@ssbno-statreg/shared'
import { statisticsAsserts } from '@/lib/asserts'
import {
  getFilteredStatistics,
  getStatisticByShortname,
  parseVariantsInput,
  parseStatisticVariants,
  mapStatisticDetails,
  parseCreateStatisticStatus,
  parseCreateStatisticInput,
  parseUpdateStatisticInput,
  updateStatistic,
  updateStatisticContacts,
  createStatistic,
  StatisticsDetailedIncludes,
  parseDivision,
  parseStatusCode,
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
      frequency: {
        findUnique: vi.fn(() => Promise.resolve({ code: 'M', name: 'Måned' })),
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
        statregError: `Statistic with shortname '' not found.`,
      })
    })
  })

  describe('updateStatistics ', async () => {
    let input: any

    beforeEach(() => {
      prismaMock.responsiblePerson.upsert.mockResolvedValue({ id: 2, principalName: 'bcd@ssb.no' })

      input = {
        division: '105',
        status: { code: 'SP' },
        name: 'Helse',
        name_en: 'Health',
        approval_status: 'FORSLAG',
        relation_id: '2',
        previous_topic_codes: '05.01.02',
        yearly_reporting: false,
        first_released_at: '2026-03-25',
        main_language: 'nn',
        comment: 'Beskrivelse av endring',
        statistic_region_levels: [{ code: 'L' }],
        variants: [
          {
            revision: { code: 'I' },
            frequency: { code: 'M' },
            level_of_detail: { name: 'Detaljnivå', name_en: 'Level of detail' },
          },
        ],
        contacts: ['bcd@ssb.no'],
      }
    })

    test('returns mocked data', async () => {
      setStatisticsResult({
        id: 5,
        division_code: '105',
        name: 'Helse',
        status: 'K',
        main_language: 'nb',
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
          id: 3,
          language: 'nb',
          name: 'Befolkning og demografi',
          name_en: 'Foreign trade and goods flow',
          shortname: {
            name: 'befolk',
          },
        },
        variants: input.variants,
        contacts: input.contacts,
      })

      await updateStatistic('helse', input, prismaMock)

      expect(prismaMock.statistic.update).toHaveBeenCalledExactlyOnceWith({
        ...mockUpdateStatisticPrismaUpdateData,
        data: {
          ...mockUpdateStatisticPrismaUpdateData.data,
          responsiblePersons: {
            set: [{ id: 2 }],
          },
          variants: {
            update: [],
            create: [
              {
                cancelled: false,
                date_created: expect.any(Date),
                last_updated: expect.any(Date),
                revision: 'I',
                frequency: {
                  connect: {
                    code: 'M',
                  },
                },
                level_of_detail: 'Detaljnivå',
                level_of_detail_en: 'Level of detail',
              },
            ],
          },
        },
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

    test('throws Error when request body omits an existing variant', async () => {
      setStatisticsResult({
        id: 5,
        status: 'K',
        responsiblePersons: [{ principalName: 'bcd@ssb.no' }],
        variants: [{ id: 1 }, { id: 2 }],
        statistic_region_levels: [{ region_level: { code: 'BD', id: 1 } }],
      })

      input.variants = [
        {
          id: 1,
          frequency: { code: 'M' },
          revision: { code: 'I' },
        },
      ]

      await expect(() => updateStatistic('helse', input, prismaMock)).rejects.toMatchObject({
        statregError: 'Deleting variants is currently not supported. Missing existing variant ids: 2.',
      })

      expect(prismaMock.statistic.update).toHaveBeenCalledTimes(0)
    })

    test('throws error when contacts is missing for active statistic update with no existing contacts', async () => {
      setStatisticsResult({
        id: 5,
        status: 'K',
        responsiblePersons: [],
        variants: [],
        statistic_region_levels: [{ region_level: { code: 'BD', id: 1 } }],
      })

      input.status = { code: 'A' }
      input.contacts = undefined

      await expect(() => updateStatistic('helse', input, prismaMock)).rejects.toMatchObject({
        statregError: 'An active statistic needs at least one contact.',
      })

      expect(prismaMock.statistic.update).toHaveBeenCalledTimes(0)
    })

    test('throws error when variants is missing for active statistic update with no existing variants', async () => {
      setStatisticsResult({
        id: 5,
        status: 'K',
        responsiblePersons: [{ principalName: 'bcd@ssb.no' }],
        variants: [],
        statistic_region_levels: [{ region_level: { code: 'BD', id: 1 } }],
      })

      input.status = { code: 'A' }
      input.variants = undefined

      await expect(() => updateStatistic('helse', input, prismaMock)).rejects.toMatchObject({
        statregError: 'An active statistic needs at least one variant.',
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
      const result = await updateStatisticContacts('helse', ['abc@ssb.no', 'bcd@ssb.no'], prismaMock)

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
            comment: 'User updated contacts',
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

      await expect(() => updateStatisticContacts('helse', ['abc@ssb.no'], prismaMock)).rejects.toMatchObject({
        status: 404,
        statregError: "Shortname 'helse' not found.",
      })
      expect(prismaMock.responsiblePerson.upsert).toHaveBeenCalledTimes(0)
      expect(prismaMock.statistic.update).toHaveBeenCalledTimes(0)
    })

    test('throws error when statistic is active and new contacts is empty', async () => {
      prismaMock.statistic.findFirst.mockResolvedValue({ id: 1, status: 'A' })

      await expect(() => updateStatisticContacts('helse', [], prismaMock)).rejects.toMatchObject({
        statregError: 'An active statistic needs at least one contact.',
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

    test('creates an upcoming statistic when input data is valid', async () => {
      setStatisticsResult({
        ...mockedStatisticCreatedPrismaResult,
        id: 1,
        version: 1,
        desk_appoval_status: ApprovalStatus.PENDING,
        status: 'K',
        statistic_region_levels: [],
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
          variants: [
            {
              frequency: {
                code: 'M',
              },
              revision: {
                code: 'I',
              },
            },
          ],
        },
        now
      )

      expect(prismaMock.frequency.findUnique).toHaveBeenCalledWith({
        where: {
          code: 'M',
        },
      })
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
          statistic_region_levels: {
            create: [],
          },
          shortname: {
            connect: {
              name: 'kpi',
            },
          },
          variants: {
            create: [
              expect.objectContaining({
                revision: 'I',
                frequency: {
                  connect: {
                    code: 'M',
                  },
                },
              }),
            ],
          },
        },
        include: StatisticsDetailedIncludes,
      })
    })

    test('creates an active statistic when input data is valid', async () => {
      setStatisticsResult({
        ...mockedStatisticCreatedPrismaResult,
        id: 1,
        version: 1,
        desk_appoval_status: ApprovalStatus.PENDING,
        status: 'A',
        statistic_region_levels: [],
      })
      prismaMock.responsiblePerson.upsert.mockResolvedValueOnce({ id: 2 })

      await createStatistic(
        prismaMock,
        'kpi',
        {
          name: 'Konsumprisindeksen',
          name_en: 'Consumer price index',
          division: '104',
          first_released_at: '2024-04-01',
          main_language: 'nb',
          status: { code: 'A' },
          contacts: ['bcd@ssb.no'],
          variants: [
            {
              frequency: {
                code: 'M',
              },
              revision: {
                code: 'I',
              },
            },
          ],
        },
        now
      )

      expect(prismaMock.frequency.findUnique).toHaveBeenCalledWith({
        where: {
          code: 'M',
        },
      })
      expect(prismaMock.statistic.create).toHaveBeenCalledExactlyOnceWith({
        data: {
          name: 'Konsumprisindeksen',
          priority: 1,
          name_en: 'Consumer price index',
          yearly_reporting: false,
          status: 'A',
          division_code: '104',
          first_release: new Date('2024-04-01T00:00:00.000Z'),
          comment: 'Create statistic with shortname: kpi',
          language: 'nb',
          date_created: now,
          last_updated: now,
          desk_appoval_status: ApprovalStatus.ACCEPTED,
          statistic_region_levels: {
            create: [],
          },
          shortname: {
            connect: {
              name: 'kpi',
            },
          },
          responsiblePersons: {
            connect: [{ id: 2 }],
          },
          variants: {
            create: [
              expect.objectContaining({
                revision: 'I',
                frequency: {
                  connect: {
                    code: 'M',
                  },
                },
              }),
            ],
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
        statregError: 'Missing required field(s): name, name_en, variants, contacts, division',
      })
      expect(prismaMock.statistic.create).toHaveBeenCalledTimes(0)
    })
  })

  describe('parseVariantsInput ', () => {
    test('returns undefined when variants are not provided for upcoming statistic', async () => {
      await expect(parseVariantsInput(undefined, 'K', prismaMock)).resolves.toBeUndefined()
    })

    test('returns parsed variants and revision', async () => {
      const result = await parseVariantsInput(
        [
          {
            frequency: {
              code: 'M',
            },
            revision: {
              code: 'I',
            },
            level_of_detail: {
              name: 'Kommentar',
              name_en: 'Comment',
            },
          },
        ],
        'A',
        prismaMock
      )

      expect(prismaMock.frequency.findUnique).toHaveBeenCalledWith({
        where: {
          code: 'M',
        },
      })
      expect(result).toStrictEqual([
        {
          frequency: {
            code: 'M',
          },
          revision: {
            code: 'I',
          },
          level_of_detail: {
            name: 'Kommentar',
            name_en: 'Comment',
          },
        },
      ])
    })

    test('throws when revision not defined', async () => {
      await expect(
        parseVariantsInput(
          [
            {
              frequency: {
                code: 'M',
              },
            },
          ],
          'K',
          prismaMock
        )
      ).rejects.toMatchObject({
        statregError: "Field 'revision' must be one of these: I, B, E, F, R, IG.",
      })
    })

    test('throws when revision code is invalid', async () => {
      await expect(
        parseVariantsInput(
          [
            {
              frequency: {
                code: 'M',
              },
              revision: {
                code: 'BAD',
              },
            },
          ],
          'K',
          prismaMock
        )
      ).rejects.toMatchObject({
        statregError: "Field 'revision' must be one of these: I, B, E, F, R, IG.",
      })
    })

    test('throws when frequency code does not exist', async () => {
      statisticsAsserts.assertFrequencyExists = vi.fn(async () => {
        throw { status: 404, statregError: "Frequency 'BAD' not found" }
      }) as any

      await expect(() =>
        parseVariantsInput(
          [
            {
              frequency: {
                code: 'BAD',
              },
              revision: {
                code: 'I',
              },
            },
          ],
          'K',
          prismaMock
        )
      ).rejects.toMatchObject({
        status: 404,
        statregError: "Frequency 'BAD' not found",
      })
    })

    test('throws error when variant is not provided for active statistic', async () => {
      await expect(parseVariantsInput(undefined, 'A', prismaMock)).rejects.toMatchObject({
        statregError: 'An active statistic needs at least one variant.',
      })
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
        statistic_region_levels: [],
      }
    })

    test('returns validated statistic input when all conditionals succeed', () => {
      const result = parseCreateStatisticInput(input, 'K')

      expect(result).toStrictEqual(expectedResult)
    })

    test('returns validated statistic input for approved status when english name is provided', () => {
      input.status = { code: 'A' }
      input.name_en = 'Health and health services'
      input.main_language = 'nn'
      input.variants = []
      input.contacts = []

      const result = parseCreateStatisticInput(input, 'A')

      expect(result).toStrictEqual({
        ...expectedResult,
        name_en: 'Health and health services',
        main_language: 'nn',
      })
    })

    test('throws error when name is an empty string', () => {
      input.name = ''

      expect(() => parseCreateStatisticInput(input, 'K')).toThrow(
        expect.objectContaining({
          statregError: "Field 'name' must be a non-empty string.",
        })
      )
    })

    test('throws error when division is not a number', () => {
      input.division = 'division-a'

      expect(() => parseCreateStatisticInput(input, 'K')).toThrow(
        expect.objectContaining({
          statregError: "Field 'division' must be a number.",
        })
      )
    })

    test('throws error when division lookup does not find a match', () => {
      input.division = '106'

      expect(() => parseCreateStatisticInput(input, 'K')).toThrow(
        expect.objectContaining({
          statregError: "Field 'division' does not correspond to an existing division.",
        })
      )
    })

    test("throws error main_language is neither 'nb' or 'nn'", () => {
      input.main_language = 'en'
      expectedResult.main_language = 'nb'

      expect(() => parseCreateStatisticInput(input, 'K')).toThrow(
        expect.objectContaining({
          statregError: "Field 'main_language' must be either 'nb' or 'nn'.",
        })
      )
    })

    test('falls back to empty string when comment is missing', () => {
      input.comment = undefined
      expectedResult.comment = ''

      const result = parseCreateStatisticInput(input, 'K')

      expect(result).toStrictEqual(expectedResult)
    })

    test('throws error when approved status has empty english name', () => {
      input.status = { code: 'A' }
      input.main_language = 'nb'
      input.name_en = ''
      input.variants = []
      input.contacts = []

      expect(() => parseCreateStatisticInput(input, 'A')).toThrow(
        expect.objectContaining({
          statregError: "Field 'name_en' must be a non-empty string.",
        })
      )
    })

    describe('parseCreateStatisticStatus', () => {
      test('returns K when status code is K', () => {
        expect(parseCreateStatisticStatus({ status: { code: 'K' } } as any)).toBe('K')
      })

      test('returns A when status code is A', () => {
        expect(parseCreateStatisticStatus({ status: { code: 'A' } } as any)).toBe('A')
      })

      test('throws when status code is missing', () => {
        expect(() => parseCreateStatisticStatus(undefined)).toThrow(
          expect.objectContaining({
            statregError: "Field 'status' must be one of these: K, A.",
          })
        )
      })

      test('throws when status code is not creatable', () => {
        expect(() => parseCreateStatisticStatus({ status: { code: 'IA' } } as any)).toThrow(
          expect.objectContaining({
            statregError: "Field 'status' must be one of these: K, A.",
          })
        )
      })
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
        'relation_id',
        'previous_topic_codes',
        'yearly_reporting',
        'first_released_at',
        'main_language',
        'comment',
        'contacts',
        'variants',
      ] as (keyof StatisticUpdate)[]

      beforeEach(() => {
        input = {
          division: '104',
          name: 'Helse og helsetjenester',
          name_en: 'Health and health services',
          first_released_at: '2024-04-01',
          main_language: 'nn',
          comment: 'Kommentar om statistikken',
          status: { code: 'A' },
          relation_id: 2,
          previous_topic_codes: '05.01.02',
          yearly_reporting: false,
          statistic_region_levels: [],
          contacts: ['bcd@ssb.no'],
          variants: [{ frequency: { code: 'M' }, revision: { code: 'I' } }],
        }

        expectedResult = {
          division: '104',
          name: 'Helse og helsetjenester',
          name_en: 'Health and health services',
          first_released_at: new Date('2024-04-01T00:00:00.000Z'),
          main_language: 'nn',
          comment: 'Kommentar om statistikken',
          status: 'A',
          relation_id: 2,
          previous_topic_codes: '05.01.02',
          yearly_reporting: false,
          statistic_region_levels: [],
          contacts: ['bcd@ssb.no'],
          variants: [{ frequency: { code: 'M' }, revision: { code: 'I' } }],
        }
      })

      test('returns validated statistic input when all conditionals succeed', () => {
        const result = parseUpdateStatisticInput(input, requiredUpdateFields)

        expect(result).toStrictEqual(expectedResult)
      })

      test('returns null first_released_at when the optional field is omitted', () => {
        input.first_released_at = undefined

        const result = parseUpdateStatisticInput(
          input,
          requiredUpdateFields.filter((field) => field !== 'first_released_at')
        )

        expect(result).toStrictEqual({
          ...expectedResult,
          first_released_at: null,
        })
      })

      test('throws error when comment is an empty string', () => {
        input.comment = ''

        expect(() => parseUpdateStatisticInput(input, requiredUpdateFields)).toThrow(
          expect.objectContaining({
            statregError: "Field 'comment' must be a non-empty string.",
          })
        )
      })

      test('throws error when yearly_reporting is not a valid boolean', () => {
        input.yearly_reporting = 'not-a-boolean'

        expect(() => parseUpdateStatisticInput(input, requiredUpdateFields)).toThrow(
          expect.objectContaining({
            statregError: "Field 'yearly_reporting' must be a boolean.",
          })
        )
      })

      test('throws error when relation id is an invalid format', () => {
        input.relation_id = 'abc'

        expect(() => parseUpdateStatisticInput(input, requiredUpdateFields)).toThrow(
          expect.objectContaining({
            statregError: 'Invalid relation id format',
          })
        )
      })

      test('throws error when status is not valid value', () => {
        input.status = 'ABC'

        expect(() => parseUpdateStatisticInput(input, requiredUpdateFields)).toThrow(
          expect.objectContaining({
            statregError: "Field 'status' must be one of these: K, A, IA, UT, SA, SP.",
          })
        )
      })

      test('throws error when comment is missing for active statistic', () => {
        input.comment = undefined

        expect(() => parseUpdateStatisticInput(input, requiredUpdateFields)).toThrow(
          expect.objectContaining({
            statregError: "Field 'comment' must be a non-empty string.",
          })
        )
      })
    })
  })

  describe('parseDivision ', () => {
    test('returns division as string when valid', () => {
      expect(parseDivision('104')).toBe('104')
    })

    test('throws when division is undefined', () => {
      expect(() => parseDivision(undefined)).toThrow(
        expect.objectContaining({ statregError: "Field 'division' must be a number." })
      )
    })

    test('throws when division is null', () => {
      expect(() => parseDivision(null)).toThrow(
        expect.objectContaining({ statregError: "Field 'division' must be a number." })
      )
    })

    test('throws when division is not a number', () => {
      expect(() => parseDivision('abc')).toThrow(
        expect.objectContaining({ statregError: "Field 'division' must be a number." })
      )
    })

    test('throws when division does not correspond to an existing division', () => {
      expect(() => parseDivision('999')).toThrow(
        expect.objectContaining({
          statregError: "Field 'division' does not correspond to an existing division.",
        })
      )
    })
  })

  describe('parseStatusCode', () => {
    const expectedError = `Field 'status' must be one of these: ${Object.keys(StatisticStatus).join(', ')}.`

    test('returns statusCode when valid', () => {
      expect(parseStatusCode('K')).toBe('K')
    })

    test('throws when statusCode is undefined', () => {
      expect(() => parseStatusCode(undefined)).toThrow(expect.objectContaining({ statregError: expectedError }))
    })

    test('throws when statusCode is empty string', () => {
      expect(() => parseStatusCode('')).toThrow(expect.objectContaining({ statregError: expectedError }))
    })

    test('throws when statusCode is not a valid status', () => {
      expect(() => parseStatusCode('INVALID_STATUS')).toThrow(expect.objectContaining({ statregError: expectedError }))
    })

    test('is case-sensitive', () => {
      expect(() => parseStatusCode('k')).toThrow(expect.objectContaining({ statregError: expectedError }))
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
    id: 3,
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
    id: 3,
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
  related_statistic_id: 3,
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
