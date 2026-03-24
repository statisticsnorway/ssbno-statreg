import { describe, test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  getAllReleases,
  getReleaseById,
  updateRelease,
  createRelease,
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
    prismaMock = {
      release: {
        findMany: mock.fn(() => Promise.resolve(releasesResult)),
        create: mock.fn((args) => Promise.resolve({ ...args, id: 0 })),
        findFirst: mock.fn(() => Promise.resolve(releasesResult)),
      },
    }
  })

  describe('getAllReleases ', () => {
    test('returns mocked data', async () => {
      setPrismaResult(mockedReleasesPrismaResult)

      const result = await getAllReleases({ start: 1, count: 2 }, prismaMock)

      assert.deepEqual(result, mockedReleasesResult)
      assert.equal(prismaMock.release.findMany.mock.calls[0].arguments[0]['skip'], 1)
      assert.equal(prismaMock.release.findMany.mock.calls[0].arguments[0]['take'], 2)
    })

    test('uses default start and count if not provided', async () => {
      setPrismaResult(mockedReleasesPrismaResult)

      const result = await getAllReleases({}, prismaMock)

      assert.deepEqual(result, mockedReleasesResult)
      assert.equal(prismaMock.release.findMany.mock.calls[0].arguments[0]['skip'], 0)
      assert.equal(prismaMock.release.findMany.mock.calls[0].arguments[0]['take'], 10)
    })

    test('returns empty list if no results', async () => {
      setPrismaResult([])

      const result = await getAllReleases({}, prismaMock)

      assert.deepEqual(result, [])
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
      await assert.rejects(() => getReleaseById('1', prismaMock), { status: 404, statregError: 'Release id not found' })
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
    // TODO: Add mapped result tests etc

    test('returns 404 when prisma release result is null', async () => {
      await assert.rejects(() => mapToReleaseDetails(null), {
        status: 404,
        statregError: 'Release not found',
      })
    })
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
      assert.strictEqual(prismaMock.release.findFirst.mock.callCount(), 0)
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
      assert.strictEqual(prismaMock.release.findFirst.mock.callCount(), 0)
    })

    test('returns 400 for date input as list', async () => {
      const newReleaseInput = {
        ...mockCreateReleaseInput,
        publish_time: ['2024-10-15T08:00:00.000Z', '2024-10-15T08:00:00.000Z'],
      }

      // @ts-ignore; Type string[] is incompatible with publish_time type string
      await assert.rejects(() => createRelease(prismaMock, 'kpi', '1', now, newReleaseInput), {
        statregError:
          'Invalid publish_time date format in query parameter: 2024-10-15T08:00:00.000Z,2024-10-15T08:00:00.000Z',
      })
      assert.strictEqual(prismaMock.release.create.mock.callCount(), 0)
      assert.strictEqual(prismaMock.release.findFirst.mock.callCount(), 0)
    })

    test('returns 400 for invalid date string format', async () => {
      const newReleaseInput = { ...mockCreateReleaseInput, period_to: '31. des' }

      await assert.rejects(() => createRelease(prismaMock, 'kpi', '1', now, newReleaseInput), {
        statregError: 'Invalid period_to date format in query parameter: 31. des',
      })
      assert.strictEqual(prismaMock.release.create.mock.callCount(), 0)
      assert.strictEqual(prismaMock.release.findFirst.mock.callCount(), 0)
    })

    test('returns 400 if date parsing fails', async () => {
      const newReleaseInput = { ...mockCreateReleaseInput, period_from: '9999-11-00' }

      await assert.rejects(() => createRelease(prismaMock, 'kpi', '1', now, newReleaseInput), {
        statregError: 'Invalid period_from date format in query parameter: 9999-11-00',
      })
      assert.strictEqual(prismaMock.release.create.mock.callCount(), 0)
      assert.strictEqual(prismaMock.release.findFirst.mock.callCount(), 0)
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
