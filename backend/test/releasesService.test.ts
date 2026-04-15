import { vi, describe, test, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { releaseAsserts } from '@/lib/asserts'
import {
  getReleases,
  getReleaseById,
  updateRelease,
  createRelease,
  buildReleaseFilter,
  ReleaseDetailsIncludes,
  mapToReleaseDetails,
} from '@/services/releasesService'
import { ApprovalStatus } from '@/types/enums'

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
      },
      statistic: { findFirst: vi.fn(() => Promise.resolve({ id: 1 })) },
      variant: {
        findUnique: vi.fn(() => Promise.resolve({ id: 1 })),
        findFirst: vi.fn(() => Promise.resolve({ id: 1 })),
      },
    }
    releaseAsserts.assertStatisticExists = vi.fn(async () => undefined) as any
    releaseAsserts.assertVariantExists = vi.fn(async () => undefined) as any
    releaseAsserts.assertVariantMatchesShortname = vi.fn(async () => undefined) as any
  })

  describe('getReleases ', () => {
    test('returns mocked data', async () => {
      setPrismaResult(mockedReleasesPrismaResult)

      const result = await getReleases({ start: 1, count: 2 }, prismaMock)

      expect(result).toStrictEqual(mockedReleasesResult)
      expect(prismaMock.release.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 1, take: 2 }))
    })

    test('uses default start and count if not provided', async () => {
      setPrismaResult(mockedReleasesPrismaResult)

      const result = await getReleases({}, prismaMock)

      expect(result).toStrictEqual(mockedReleasesResult)

      expect(prismaMock.release.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }))
    })

    test('returns empty list if no results', async () => {
      setPrismaResult([])

      const result = await getReleases({}, prismaMock)

      expect(result).toStrictEqual([])
    })
  })

  describe('buildReleaseFilter', () => {
    test('returns undefined when neither shortname nor variantId is provided', async () => {
      const where = await buildReleaseFilter({}, prismaMock)

      expect(where).toBeUndefined
      expect(releaseAsserts.assertStatisticExists).toHaveBeenCalledTimes(0)
      expect(releaseAsserts.assertVariantExists).toHaveBeenCalledTimes(0)
      expect(releaseAsserts.assertVariantMatchesShortname).toHaveBeenCalledTimes(0)
    })

    test('applies filter when only shortname is provided', async () => {
      const where = await buildReleaseFilter({ shortname: 'KPI' }, prismaMock)

      expect(where).toStrictEqual({
        variant: { statistic: { shortname: { name: 'KPI' } } },
      })

      expect(releaseAsserts.assertStatisticExists).toHaveBeenCalledExactlyOnceWith('KPI', prismaMock)
      expect(releaseAsserts.assertVariantExists).toHaveBeenCalledTimes(0)
      expect(releaseAsserts.assertVariantMatchesShortname).toHaveBeenCalledTimes(0)
    })

    test('applies filter when only variantId is provided', async () => {
      const where = await buildReleaseFilter({ variantId: 1 }, prismaMock)

      expect(where).toStrictEqual({
        variant: { id: 1 },
      })

      expect(releaseAsserts.assertStatisticExists).toHaveBeenCalledTimes(0)
      expect(releaseAsserts.assertVariantExists).toHaveBeenCalledExactlyOnceWith(1, prismaMock)
      expect(releaseAsserts.assertVariantMatchesShortname).toHaveBeenCalledTimes(0)
    })

    test('applies combined filter when both inputs are provided', async () => {
      const where = await buildReleaseFilter({ shortname: 'KPI', variantId: 1 }, prismaMock)

      expect(where).toStrictEqual({
        variant: { id: 1, statistic: { shortname: { name: 'KPI' } } },
      })

      expect(releaseAsserts.assertStatisticExists).toHaveBeenCalledExactlyOnceWith('KPI', prismaMock)
      expect(releaseAsserts.assertVariantExists).toHaveBeenCalledExactlyOnceWith(1, prismaMock)

      expect(releaseAsserts.assertVariantMatchesShortname).toHaveBeenCalledExactlyOnceWith(1, 'KPI', prismaMock)
    })

    test('throws when statistic does not exist', async () => {
      releaseAsserts.assertStatisticExists = vi.fn(async () => {
        throw { status: 404, statregError: "Statistic 'BAD' not found" }
      }) as any

      await assert.rejects(() => buildReleaseFilter({ shortname: 'BAD' }, prismaMock), {
        status: 404,
        statregError: "Statistic 'BAD' not found",
      })
    })

    test('throws when variant does not exist', async () => {
      releaseAsserts.assertVariantExists = vi.fn(async () => {
        throw { status: 404, statregError: "Variant '999' not found" }
      }) as any

      await assert.rejects(() => buildReleaseFilter({ variantId: 999 }, prismaMock), {
        status: 404,
        statregError: "Variant '999' not found",
      })
    })

    test('throws when variant does not belong to statistic', async () => {
      releaseAsserts.assertVariantMatchesShortname = vi.fn(async () => {
        throw { status: 404, statregError: "Variant does not belong to statistic 'KPI'" }
      }) as any

      await assert.rejects(() => buildReleaseFilter({ shortname: 'KPI', variantId: 1 }, prismaMock), {
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
      await assert.rejects(() => getReleaseById('test', prismaMock), {
        statregError: 'Invalid release id format',
      })
    })

    test('returns 404 if no release found', async () => {
      setPrismaResult(null)
      await assert.rejects(() => getReleaseById('1', prismaMock), { status: 404, statregError: 'Release 1 not found' })
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
        period_to: '2024-12-31T00:00:00Z',
        period_from: '2024-09-01T00:00:00Z',
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
      await assert.rejects(() => updateRelease(prismaMock, '1', undefined, now), {
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
      await assert.rejects(() => updateRelease(prismaMock, '1', releaseUpdateInputWithoutComment, now), {
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
      await assert.rejects(() => createRelease(prismaMock, 'kpi', '1', undefined, now), {
        statregError: 'Missing required field(s): publish_time, period_from, period_to, release_date_precision',
      })
      expect(prismaMock.release.create).toHaveBeenCalledTimes(0)
    })

    test('returns 400 if any of the required fields are missing', async () => {
      const newReleaseInput = {
        publish_time: '2024-10-15T08:00:00Z',
        release_date_precision: 'dag',
      }

      await assert.rejects(() => createRelease(prismaMock, 'kpi', '1', newReleaseInput, now), {
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
    period_to: '2024-09-01T00:00:00.000Z',
    period_from: '2024-08-01T00:00:00.000Z',
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
    period_to: '2024-12-31T00:00:00.000Z',
    period_from: '2024-01-01T00:00:00.000Z',
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
  period_from: '2024-08-01T00:00:00.000Z',
  period_to: '2024-09-01T00:00:00.000Z',
  release_date_precision: 'dag',
  cancelled: false,
}

const mockCreateReleaseInput = {
  publish_time: '2024-10-15T08:00:00Z',
  period_to: '2024-12-31T00:00:00Z',
  period_from: '2024-09-01T00:00:00Z',
  release_date_precision: 'dag',
}
