/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { releaseAsserts } from '@/lib/asserts'
import {
  getReleases,
  getFilteredReleases,
  getVariantReleases,
  getReleaseById,
  updateRelease,
  createRelease,
  buildReleaseFilter,
  buildVariantReleaseFilter,
  ReleaseDetailsIncludes,
  mapToReleaseDetails,
} from '@/services/releasesService'
import { ApprovalStatus } from '@ssbno-statreg/shared'

let prismaMock: any
let releasesResult: object | null
let now: Date

function setPrismaResult(next: object | null) {
  releasesResult = next
}

describe('releasesService ', async () => {
  beforeEach(() => {
    releasesResult = null
    prismaMock = {
      release: {
        findMany: vi.fn(() => Promise.resolve(releasesResult)),
        findFirst: vi.fn(() => Promise.resolve(releasesResult)),
        create: vi.fn(() => Promise.resolve({ ...releasesResult })),
        update: vi.fn(() => Promise.resolve({ ...releasesResult })),
        count: vi.fn(() => Promise.resolve(releasesResult ? (releasesResult as any).length : 0)),
      },
      statistic: { findFirst: vi.fn(() => Promise.resolve({ id: 1 })) },
      shortname: { findMany: vi.fn(() => Promise.resolve([{ name: 'laks' }, { name: 'KPI' }])) },
      variant: {
        findUnique: vi.fn(() => Promise.resolve({ id: 1 })),
        findFirst: vi.fn(() => Promise.resolve({ id: 1 })),
      },
    }
    releaseAsserts.assertStatisticExists = vi.fn(async () => true) as any
    releaseAsserts.assertVariantExists = vi.fn(async () => true) as any
    releaseAsserts.assertVariantMatchesShortname = vi.fn(async () => true) as any
    releaseAsserts.assertFilteredShortnamesExist = vi.fn(async () => true) as any
  })

  describe('getReleases ', () => {
    test('returns mocked data', async () => {
      setPrismaResult(mockedReleasesPrismaResult)

      const result = await getReleases({ start: 1, count: 2 }, prismaMock)

      expect(result).toStrictEqual({ releases: mockedReleasesResult, total: 3 })
      expect(prismaMock.release.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 1, take: 2 }))
    })

    test('uses default start and count if not provided', async () => {
      setPrismaResult(mockedReleasesPrismaResult)

      const result = await getReleases({}, prismaMock)

      expect(result).toStrictEqual({ releases: mockedReleasesResult, total: 3 })

      expect(prismaMock.release.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }))
    })

    test('returns empty list if no results', async () => {
      setPrismaResult([])

      const result = await getReleases({}, prismaMock)

      expect(result).toStrictEqual({ releases: [], total: 0 })
    })
  })

  describe('getFilteredReleases ', () => {
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
          testCase: 'publish time after',
          input: {
            publishTimeAfter: '2026-12-12T23:59:00Z',
          },
        },
        {
          testCase: 'publish time before',
          input: {
            publishTimeBefore: '2027-01-01T00:00:00+01:00',
          },
        },
        {
          testCase: 'shortnames, publishtime after and publish time before',
          input: {
            filterByShortnames: ['KPI', 'energ'],
            publishTimeBefore: '2027-01-01T00:00:00+01:00',
            publishTimeAfter: '2026-12-12T23:59:00Z',
          },
        },
      ])('$testCase', async ({ input }) => {
        setPrismaResult(mockedReleasesPrismaResult)

        const result = await getFilteredReleases(input, prismaMock)

        expect(result).toBeTruthy()
      })
    })

    describe('throws error with different invalid input combination: ', () => {
      test('throws when buildReleaseFilter throws', async () => {
        // Cannot mock buildReleaseFilter function because it is defined in same file, hence mocking throw in assert
        releaseAsserts.assertFilteredShortnamesExist = vi.fn(async () => {
          throw { status: 404, statregError: "Shortname(s) not found: 'BAD'" }
        })

        await expect(() =>
          getFilteredReleases({ filterByShortnames: ['BAD', 'KPI'] }, prismaMock)
        ).rejects.toMatchObject({
          status: 404,
          statregError: "Shortname(s) not found: 'BAD'",
        })
      })

      test('throws when filter after publish date is invalid', async () => {
        await expect(() =>
          getFilteredReleases({ publishTimeAfter: '2026-01-01 07:00' }, prismaMock)
        ).rejects.toMatchObject({
          statregError: 'Invalid date format: 2026-01-01 07:00',
        })
      })

      test('throws when filter before publish date is invalid', async () => {
        await expect(() =>
          getFilteredReleases({ publishTimeBefore: '2026-01-01 07:00' }, prismaMock)
        ).rejects.toMatchObject({
          statregError: 'Invalid date format: 2026-01-01 07:00',
        })
      })
    })
  })

  describe('getVariantReleases', () => {
    test('returns mocked releases filtered by variant', async () => {
      setPrismaResult(mockedReleasesPrismaResult)
      const result = await getVariantReleases({ shortname: 'KPI', variantId: 1 }, prismaMock)

      expect(result).toStrictEqual({ releases: mockedReleasesResult, total: 3 })
      expect(prismaMock.release.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            variant: { id: 1 },
          },
        })
      )
    })
  })

  describe('buildReleaseFilter', () => {
    describe('runs without error with different valid input combination: ', () => {
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
                variant: {
                  statistic: {
                    shortname: {
                      name: 'KPI',
                    },
                  },
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
                variant: {
                  statistic: {
                    shortname: {
                      name: 'KPI',
                    },
                  },
                },
              },
              {
                variant: {
                  statistic: {
                    shortname: {
                      name: 'energ',
                    },
                  },
                },
              },
            ],
          },
        },
        {
          testCase: 'publish time after',
          input: {
            filterByAfterPublishDate: new Date('2026-12-24T23:59Z'),
          },
          expectedWhere: {
            publish_time: {
              gte: new Date('2026-12-24T23:59Z'),
            },
          },
        },
        {
          testCase: 'publish time before',
          input: {
            filterByBeforePublishDate: new Date('2027-01-01T00:00Z'),
          },
          expectedWhere: {
            publish_time: {
              lte: new Date('2027-01-01T00:00Z'),
            },
          },
        },
        {
          testCase: 'shortnames, publishtime after and publish time before',
          input: {
            filterByShortnames: ['KPI', 'energ'],
            filterByBeforePublishDate: new Date('2027-01-01T00:00Z'),
            filterByAfterPublishDate: new Date('2026-12-24T23:59Z'),
          },
          expectedWhere: {
            OR: [
              {
                variant: {
                  statistic: {
                    shortname: {
                      name: 'KPI',
                    },
                  },
                },
              },
              {
                variant: {
                  statistic: {
                    shortname: {
                      name: 'energ',
                    },
                  },
                },
              },
            ],
            publish_time: {
              gte: new Date('2026-12-24T23:59:00.000Z'),
              lte: new Date('2027-01-01T00:00:00.000Z'),
            },
          },
        },
      ])('$testCase', async ({ input, expectedWhere }) => {
        const result = await buildReleaseFilter(input, prismaMock)

        expect(result).toStrictEqual(expectedWhere)
      })
    })

    test('applies filter when only filterByShortname is provided', async () => {
      const where = await buildReleaseFilter({ filterByShortnames: ['KPI'] }, prismaMock)

      expect(where).toStrictEqual({
        OR: [{ variant: { statistic: { shortname: { name: 'KPI' } } } }],
      })

      expect(releaseAsserts.assertFilteredShortnamesExist).toHaveBeenCalledExactlyOnceWith(['KPI'], prismaMock)
    })

    test('applies filter when multiple shortnames are provided', async () => {
      const where = await buildReleaseFilter({ filterByShortnames: ['KPI', 'LAKS', 'ENERGIREGN'] }, prismaMock)

      expect(where).toStrictEqual({
        OR: [
          { variant: { statistic: { shortname: { name: 'KPI' } } } },
          { variant: { statistic: { shortname: { name: 'LAKS' } } } },
          { variant: { statistic: { shortname: { name: 'ENERGIREGN' } } } },
        ],
      })

      expect(releaseAsserts.assertFilteredShortnamesExist).toHaveBeenCalledExactlyOnceWith(
        ['KPI', 'LAKS', 'ENERGIREGN'],
        prismaMock
      )
    })

    test('throws when shortname does not exist', async () => {
      releaseAsserts.assertFilteredShortnamesExist = vi.fn(async () => {
        throw { status: 404, statregError: "Shortname(s) not found: 'BAD'" }
      }) as any

      await expect(() => buildReleaseFilter({ filterByShortnames: ['BAD', 'KPI'] }, prismaMock)).rejects.toMatchObject({
        status: 404,
        statregError: "Shortname(s) not found: 'BAD'",
      })
    })
  })

  describe('buildVariantReleaseFilter', () => {
    test('applies combined filter when both inputs are provided', async () => {
      const where = await buildVariantReleaseFilter({ shortname: 'KPI', variantId: 1 }, prismaMock)

      expect(where).toStrictEqual({
        variant: { id: 1 },
      })

      expect(releaseAsserts.assertStatisticExists).toHaveBeenCalledExactlyOnceWith('KPI', prismaMock)
      expect(releaseAsserts.assertVariantExists).toHaveBeenCalledExactlyOnceWith(1, prismaMock)
      expect(releaseAsserts.assertVariantMatchesShortname).toHaveBeenCalledExactlyOnceWith(1, 'KPI', prismaMock)
    })

    test('throws when statistic does not exist', async () => {
      releaseAsserts.assertStatisticExists = vi.fn(async () => {
        throw { status: 404, statregError: "Statistic 'BAD' not found" }
      }) as any

      await expect(() =>
        buildVariantReleaseFilter({ shortname: 'BAD', variantId: 0 }, prismaMock)
      ).rejects.toMatchObject({
        status: 404,
        statregError: "Statistic 'BAD' not found",
      })
    })

    test('throws when variant does not exist', async () => {
      releaseAsserts.assertVariantExists = vi.fn(async () => {
        throw { status: 404, statregError: "Variant '999' not found" }
      }) as any

      await expect(() =>
        buildVariantReleaseFilter({ shortname: 'KPI', variantId: 999 }, prismaMock)
      ).rejects.toMatchObject({
        status: 404,
        statregError: "Variant '999' not found",
      })
    })

    test('throws when variant does not belong to statistic', async () => {
      releaseAsserts.assertVariantMatchesShortname = vi.fn(async () => {
        throw { status: 404, statregError: "Variant does not belong to statistic 'KPI'" }
      }) as any

      await expect(() =>
        buildVariantReleaseFilter({ shortname: 'KPI', variantId: 1 }, prismaMock)
      ).rejects.toMatchObject({
        status: 404,
        statregError: "Variant does not belong to statistic 'KPI'",
      })
    })
  })

  describe('getReleaseById ', () => {
    test('returns mocked data on correct form', async () => {
      setPrismaResult(mockedSingleReleasePrismaResult)
      const result = await getReleaseById('1', prismaMock)
      expect(result).toStrictEqual(mockedSingleReleaseResult)
    })

    test('evaluates has_versions correctly', async () => {
      setPrismaResult({ ...mockedSingleReleasePrismaResult, version: 2 })
      const result1 = await getReleaseById('1', prismaMock)
      expect(result1.has_versions).toBe(true)
      setPrismaResult({ ...mockedSingleReleasePrismaResult, version: 1 })
      const result2 = await getReleaseById('1', prismaMock)
      expect(result2.has_versions).toBe(false)
    })

    test('returns 400 if id is not a number', async () => {
      await expect(() => getReleaseById('test', prismaMock)).rejects.toMatchObject({
        statregError: 'Invalid release id format',
      })
    })

    test('returns 404 if no release found', async () => {
      setPrismaResult(null)
      await expect(() => getReleaseById('1', prismaMock)).rejects.toMatchObject({
        status: 404,
        statregError: 'Release 1 not found',
      })
    })
  })

  describe('updateRelease ', () => {
    beforeEach(() => {
      now = new Date('2026-03-23T08:00:00Z')
    })

    test('updates exactly one release when input data is correct', async () => {
      setPrismaResult(mockedSingleReleasePrismaResult)
      const releaseUpdateInput = {
        publish_time: '2024-10-15T08:00:00Z',
        period_to: '2024-12-31',
        period_from: '2024-09-01',
        release_date_precision: 'dag',
        comment: 'Mock comment.',
      }

      await updateRelease(prismaMock, '1', releaseUpdateInput, now)

      expect(prismaMock.release.update).toHaveBeenCalledExactlyOnceWith({
        include: ReleaseDetailsIncludes,
        where: { id: 1 },
        data: {
          publish_time: new Date('2024-10-15T08:00:00Z'),
          period_to: new Date('2024-12-31T00:00:00Z'),
          period_from: new Date('2024-09-01T00:00:00Z'),
          release_date_precision: 'dag',
          desk_appoval_status: ApprovalStatus.PENDING,
          last_updated: now,
          comment: 'Mock comment.',
        },
      })
    })

    test('rejects with error message if request body is empty', async () => {
      await expect(() => updateRelease(prismaMock, '1', undefined, now)).rejects.toMatchObject({
        statregError:
          'Missing required field(s): publish_time, period_from, period_to, release_date_precision, comment',
      })
      expect(prismaMock.release.update).toHaveBeenCalledTimes(0)
    })

    test('rejects with error message if comment is missing', async () => {
      const releaseUpdateInputWithoutComment = {
        publish_time: '2026-03-19T11:52:38.903Z',
        period_to: '2026-03-19T11:52:38.903Z',
        period_from: '2026-03-19T11:52:38.903Z',
        release_date_precision: 'string',
      }
      await expect(() => updateRelease(prismaMock, '1', releaseUpdateInputWithoutComment, now)).rejects.toMatchObject({
        statregError: 'Missing required field(s): comment',
      })

      expect(prismaMock.release.update).toHaveBeenCalledTimes(0)
    })
  })

  describe('mapToReleaseDetails ', () => {
    let input: any
    let expectedResult: any

    beforeEach(() => {
      input = structuredClone(mockedSingleReleasePrismaResult)

      expectedResult = structuredClone(mockedSingleReleaseResult)
    })

    test('returns correct releaseDetails when all conditionals succeed', () => {
      const result = mapToReleaseDetails(input)

      expect(result).toStrictEqual(expectedResult)
    })

    test('falls back to has_versions false when version is 1', () => {
      input.version = 1
      expectedResult.has_versions = false

      const result = mapToReleaseDetails(input)

      expect(result).toStrictEqual(expectedResult)
    })

    test('falls back to empty english name when name_en is missing', () => {
      input.variant.statistic.name_en = null
      expectedResult.statistic.name_en = ''

      const result = mapToReleaseDetails(input)

      expect(result).toStrictEqual(expectedResult)
    })
  })

  describe('createRelease ', () => {
    beforeEach(() => {
      now = new Date('2026-03-23T08:00:00Z')
    })

    test('creates a new release when input data is correct', async () => {
      setPrismaResult({
        ...mockedSingleReleasePrismaResult,
        id: 1,
        version: 1,
        desk_appoval_status: ApprovalStatus.PENDING,
      })

      await createRelease(prismaMock, 'kpi', '1', mockCreateReleaseInput, now)

      expect(prismaMock.release.create).toHaveBeenCalledExactlyOnceWith({
        data: {
          publish_time: new Date('2024-10-15T08:00:00Z'),
          period_to: new Date('2024-12-31T00:00:00Z'),
          period_from: new Date('2024-09-01T00:00:00Z'),
          desk_appoval_status: ApprovalStatus.PENDING,
          release_date_precision: 'dag',
          has_versions: false,
          last_updated: now,
          date_created: now,
          cancelled: false,
          comment: '',
          variant: {
            connect: {
              id: 1,
            },
          },
        },
        include: ReleaseDetailsIncludes,
      })
    })

    test('returns 400 if request body is empty', async () => {
      await expect(() => createRelease(prismaMock, 'kpi', '1', undefined, now)).rejects.toMatchObject({
        statregError: 'Missing required field(s): publish_time, period_from, period_to, release_date_precision',
      })
      expect(prismaMock.release.create).toHaveBeenCalledTimes(0)
    })

    test('returns 400 if any of the required fields are missing', async () => {
      const newReleaseInput = {
        publish_time: '2024-10-15T08:00:00Z',
        release_date_precision: 'dag',
      }

      await expect(() => createRelease(prismaMock, 'kpi', '1', newReleaseInput, now)).rejects.toMatchObject({
        statregError: 'Missing required field(s): period_from, period_to',
      })
      expect(prismaMock.release.create).toHaveBeenCalledTimes(0)
    })
  })
})

////////////// MOCK DATA ////////////////////////////////
const mockedReleasesPrismaResult = [
  {
    id: 101,
    version: 3,
    publish_time: new Date('2024-10-15T08:00:00Z'),
    desk_appoval_status: 'APPROVED',
    period_to: new Date('2024-09-01T00:00:00Z'),
    period_from: new Date('2024-08-01T00:00:00Z'),
    variant: {
      frequency: {
        name: 'Måned',
        code: 'M',
      },
      statistic: {
        language: 'nb',
        name: 'Konsumprisindeks',
        name_en: 'Consumer Price Index',
        shortname: {
          name: 'KPI',
        },
      },
    },
  },
  {
    id: 102,
    version: 1,
    publish_time: new Date('2025-04-30T08:00:00Z'),
    desk_appoval_status: 'DRAFT',
    period_to: new Date('2024-12-31T00:00:00Z'),
    period_from: new Date('2024-01-01T00:00:00Z'),
    variant: {
      frequency: {
        name: 'År',
        code: 'Y',
      },
      statistic: {
        language: 'nb',
        name: 'Nasjonalregnskap',
        name_en: 'National Accounts',
        shortname: {
          name: 'NR',
        },
      },
    },
  },
  {
    id: 103,
    version: 1,
    publish_time: new Date('2026-02-25T08:00:00Z'),
    desk_appoval_status: 'FORSLAG',
    period_to: new Date('2026-02-21T00:00:00Z'),
    period_from: new Date('2026-02-15T00:00:00Z'),
    variant: {
      frequency: {
        name: 'Halvår',
        code: 'H',
      },
      statistic: {
        language: 'nb',
        name: 'Eksport av laks',
        name_en: 'Export of salmon',
        shortname: {
          name: 'laks',
        },
      },
    },
  },
]

const mockedSingleReleasePrismaResult = {
  id: 1,
  version: 3,
  publish_time: new Date('2024-10-15T08:00:00Z'),
  desk_appoval_status: 'APPROVED',
  period_to: new Date('2024-09-01T00:00:00Z'),
  period_from: new Date('2024-08-01T00:00:00Z'),
  cancelled: false,
  release_date_precision: 'dag',
  variant: {
    id: 1,
    revision: 'I',
    frequency: {
      name: 'Måned',
      code: 'M',
    },
    statistic: {
      language: 'nb',
      name: 'Konsumprisindeks',
      name_en: 'Consumer Price Index',
      shortname: {
        name: 'KPI',
      },
    },
  },
}

const mockedReleasesResult = [
  {
    id: 101,
    publish_time: '2024-10-15T08:00:00.000Z',
    approval_status: 'APPROVED',
    period_to: '2024-09-01',
    period_from: '2024-08-01',
    frequency: {
      name: 'Måned',
      code: 'M',
    },
    statistic: {
      shortname: 'KPI',
      name: 'Konsumprisindeks',
      name_en: 'Consumer Price Index',
    },
  },
  {
    id: 102,
    publish_time: '2025-04-30T08:00:00.000Z',
    approval_status: 'DRAFT',
    period_to: '2024-12-31',
    period_from: '2024-01-01',
    frequency: {
      name: 'År',
      code: 'Y',
    },
    statistic: {
      shortname: 'NR',
      name: 'Nasjonalregnskap',
      name_en: 'National Accounts',
    },
  },
  {
    id: 103,
    publish_time: '2026-02-25T08:00:00.000Z',
    approval_status: 'FORSLAG',
    period_to: '2026-02-21',
    period_from: '2026-02-15',
    frequency: {
      name: 'Halvår',
      code: 'H',
    },
    statistic: {
      shortname: 'laks',
      name: 'Eksport av laks',
      name_en: 'Export of salmon',
    },
  },
]

const mockedSingleReleaseResult = {
  id: 1,
  publish_time: '2024-10-15T08:00:00.000Z',
  has_versions: true,
  approval_status: 'APPROVED',
  variant: {
    id: 1,
    frequency: {
      name: 'Måned',
      code: 'M',
    },
    revision: {
      name: 'I',
    },
  },
  statistic: {
    shortname: 'KPI',
    name: 'Konsumprisindeks',
    name_en: 'Consumer Price Index',
  },
  period_from: '2024-08-01',
  period_to: '2024-09-01',
  release_date_precision: 'dag',
  cancelled: false,
}

const mockCreateReleaseInput = {
  publish_time: '2024-10-15T08:00:00Z',
  period_to: '2024-12-31',
  period_from: '2024-09-01',
  release_date_precision: 'dag',
}
