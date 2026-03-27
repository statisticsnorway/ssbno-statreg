import { describe, test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { releaseAsserts } from '@/lib/asserts'
import {
  getReleases,
  getReleaseById,
  updateRelease,
  createRelease,
  buildReleaseFilter,
  ReleaseDetailsIncludes,
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
        findMany: mock.fn(() => Promise.resolve(releasesResult)),
        findFirst: mock.fn(() => Promise.resolve(releasesResult)),
        create: mock.fn(() => Promise.resolve({ ...releasesResult })),
      },
      statistic: { findFirst: mock.fn(() => Promise.resolve({ id: 1 })) },
      variant: {
        findUnique: mock.fn(() => Promise.resolve({ id: 1 })),
        findFirst: mock.fn(() => Promise.resolve({ id: 1 })),
      },
    }
    releaseAsserts.assertStatisticExists = mock.fn(async () => undefined) as any
    releaseAsserts.assertVariantExists = mock.fn(async () => undefined) as any
    releaseAsserts.assertVariantMatchesShortname = mock.fn(async () => undefined) as any
  })

  describe('getReleases ', () => {
    test('returns mocked data', async () => {
      setPrismaResult(mockedReleasesPrismaResult)

      const result = await getReleases({ start: 1, count: 2 }, prismaMock)

      assert.deepEqual(result, mockedReleasesResult)
      assert.equal(prismaMock.release.findMany.mock.calls[0].arguments[0]['skip'], 1)
      assert.equal(prismaMock.release.findMany.mock.calls[0].arguments[0]['take'], 2)
    })

    test('uses default start and count if not provided', async () => {
      setPrismaResult(mockedReleasesPrismaResult)

      const result = await getReleases({}, prismaMock)

      assert.deepEqual(result, mockedReleasesResult)
      assert.equal(prismaMock.release.findMany.mock.calls[0].arguments[0]['skip'], 0)
      assert.equal(prismaMock.release.findMany.mock.calls[0].arguments[0]['take'], 10)
    })

    test('returns empty list if no results', async () => {
      setPrismaResult([])

      const result = await getReleases({}, prismaMock)

      assert.deepEqual(result, [])
    })
  })

  describe('buildReleaseFilter', () => {
    test('returns undefined when neither shortname nor variantId is provided', async () => {
      const where = await buildReleaseFilter({}, prismaMock)

      assert.equal(where, undefined)
      assert.equal((releaseAsserts.assertStatisticExists as any).mock.calls.length, 0)
      assert.equal((releaseAsserts.assertVariantExists as any).mock.calls.length, 0)
      assert.equal((releaseAsserts.assertVariantMatchesShortname as any).mock.calls.length, 0)
    })

    test('applies filter when only shortname is provided', async () => {
      const where = await buildReleaseFilter({ shortname: 'KPI' }, prismaMock)

      assert.deepEqual(where, {
        variant: { statistic: { shortname: { name: 'KPI' } } },
      })

      assert.equal((releaseAsserts.assertStatisticExists as any).mock.calls.length, 1)
      assert.deepEqual((releaseAsserts.assertStatisticExists as any).mock.calls[0].arguments, ['KPI', prismaMock])

      assert.equal((releaseAsserts.assertVariantExists as any).mock.calls.length, 0)
      assert.equal((releaseAsserts.assertVariantMatchesShortname as any).mock.calls.length, 0)
    })

    test('applies filter when only variantId is provided', async () => {
      const where = await buildReleaseFilter({ variantId: 1 }, prismaMock)

      assert.deepEqual(where, {
        variant: { id: 1 },
      })

      assert.equal((releaseAsserts.assertStatisticExists as any).mock.calls.length, 0)
      assert.equal((releaseAsserts.assertVariantExists as any).mock.calls.length, 1)
      assert.deepEqual((releaseAsserts.assertVariantExists as any).mock.calls[0].arguments, [1, prismaMock])
      assert.equal((releaseAsserts.assertVariantMatchesShortname as any).mock.calls.length, 0)
    })

    test('applies combined filter when both inputs are provided', async () => {
      const where = await buildReleaseFilter({ shortname: 'KPI', variantId: 1 }, prismaMock)

      assert.deepEqual(where, {
        variant: { id: 1, statistic: { shortname: { name: 'KPI' } } },
      })

      assert.equal((releaseAsserts.assertStatisticExists as any).mock.calls.length, 1)
      assert.deepEqual((releaseAsserts.assertStatisticExists as any).mock.calls[0].arguments, ['KPI', prismaMock])

      assert.equal((releaseAsserts.assertVariantExists as any).mock.calls.length, 1)
      assert.deepEqual((releaseAsserts.assertVariantExists as any).mock.calls[0].arguments, [1, prismaMock])

      assert.equal((releaseAsserts.assertVariantMatchesShortname as any).mock.calls.length, 1)
      assert.deepEqual((releaseAsserts.assertVariantMatchesShortname as any).mock.calls[0].arguments, [
        1,
        'KPI',
        prismaMock,
      ])
    })

    test('throws when statistic does not exist', async () => {
      releaseAsserts.assertStatisticExists = mock.fn(async () => {
        throw { status: 404, statregError: "Statistic 'BAD' not found" }
      }) as any

      await assert.rejects(() => buildReleaseFilter({ shortname: 'BAD' }, prismaMock), {
        status: 404,
        statregError: "Statistic 'BAD' not found",
      })
    })

    test('throws when variant does not exist', async () => {
      releaseAsserts.assertVariantExists = mock.fn(async () => {
        throw { status: 404, statregError: "Variant '999' not found" }
      }) as any

      await assert.rejects(() => buildReleaseFilter({ variantId: 999 }, prismaMock), {
        status: 404,
        statregError: "Variant '999' not found",
      })
    })

    test('throws when variant does not belong to statistic', async () => {
      releaseAsserts.assertVariantMatchesShortname = mock.fn(async () => {
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
      assert.deepEqual(result, mockedSingleReleaseResult)
    })

    test('evaluates has_versions correctly', async () => {
      setPrismaResult({ ...mockedSingleReleasePrismaResult, version: 2 })
      const result1 = await getReleaseById('1', prismaMock)
      assert.deepEqual(result1.has_versions, true)
      setPrismaResult({ ...mockedSingleReleasePrismaResult, version: 1 })
      const result2 = await getReleaseById('1', prismaMock)
      assert.deepEqual(result2.has_versions, false)
    })

    test('returns 400 if id is not a number', async () => {
      await assert.rejects(() => getReleaseById('test', prismaMock), {
        statregError: 'Invalid release id',
      })
    })

    test('returns 404 if no release found', async () => {
      setPrismaResult(null)
      await assert.rejects(() => getReleaseById('1', prismaMock), { status: 404, statregError: 'Release not found' })
    })
  })

  describe('updateRelease ', () => {
    test('returns 400 if comment is missing', async () => {
      const releaseUpdateInputWithoutComment = {
        publish_time: '2026-03-19T11:52:38.903Z',
        period_to: '2026-03-19T11:52:38.903Z',
        period_from: '2026-03-19T11:52:38.903Z',
        release_date_precision: 'string',
      }
      await assert.rejects(() => updateRelease('1', releaseUpdateInputWithoutComment, prismaMock), {
        statregError: 'Required field `comment` is missing',
      })
    })
  })

  describe('mapToReleaseDetails ', () => {
    // TODO: Add tests for mapToReleaseDetails
  })

  describe('createRelease ', () => {
    beforeEach(() => {
      now = new Date('2026-03-23T08:00:00Z')
    })

    test('creates a new release and returns mapped results', async () => {
      setPrismaResult({
        ...mockedSingleReleasePrismaResult,
        id: 1,
        version: 1,
        desk_appoval_status: ApprovalStatus.PENDING,
      })

      const result = await createRelease(prismaMock, 'kpi', '1', now, mockCreateReleaseInput)

      assert.deepStrictEqual(prismaMock.release.create.mock.callCount(), 1)
      assert.deepStrictEqual(prismaMock.release.create.mock.calls[0].arguments[0], {
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
      assert.deepStrictEqual(result, {
        ...mockedSingleReleaseResult,
        has_versions: false,
        approval_status: ApprovalStatus.PENDING,
      })
    })

    test('returns 400 if request body is empty', async () => {
      await assert.rejects(() => createRelease(prismaMock, 'kpi', '1', now, undefined), {
        statregError: 'Missing required field(s): publish_time, period_from, period_to, release_date_precision',
      })
      assert.strictEqual(prismaMock.release.create.mock.callCount(), 0)
    })

    test('returns 400 if any of the required fields are missing', async () => {
      const newReleaseInput = {
        publish_time: '2024-10-15T08:00:00Z',
        release_date_precision: 'dag',
      }

      await assert.rejects(() => createRelease(prismaMock, 'kpi', '1', now, newReleaseInput), {
        statregError: 'Missing required field(s): period_from, period_to',
      })
      assert.strictEqual(prismaMock.release.create.mock.callCount(), 0)
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
        name_en: 'Monthly',
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
        name_en: 'Year',
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
      name_en: 'Monthly',
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
      name: [
        { language_code: 'nb', text: 'Måned' },
        { language_code: 'en', text: 'Monthly' },
      ],
    },
    statistic: {
      shortname: 'KPI',
      name: [
        { language_code: 'nb', text: 'Konsumprisindeks' },
        { language_code: 'en', text: 'Consumer Price Index' },
      ],
    },
  },
  {
    id: 102,
    publish_time: '2025-04-30T08:00:00.000Z',
    approval_status: 'DRAFT',
    period_to: '2024-12-31T00:00:00.000Z',
    period_from: '2024-01-01T00:00:00.000Z',
    frequency: {
      name: [
        { language_code: 'nb', text: 'År' },
        { language_code: 'en', text: 'Year' },
      ],
    },
    statistic: {
      shortname: 'NR',
      name: [
        { language_code: 'nb', text: 'Nasjonalregnskap' },
        { language_code: 'en', text: 'National Accounts' },
      ],
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
      name: [
        { language_code: 'nb', text: 'Måned' },
        { language_code: 'en', text: 'Monthly' },
      ],
    },
    revision: {
      name: [{ language_code: 'nb', text: 'I' }],
    },
  },
  statistic: {
    shortname: 'KPI',
    name: [
      { language_code: 'nb', text: 'Konsumprisindeks' },
      { language_code: 'en', text: 'Consumer Price Index' },
    ],
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
