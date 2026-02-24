import { describe, test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { getAllReleases } from '../src/services/releasesService'

let prismaMock: any
let releasesResult: object

function setReleasesResult(next: object) {
  releasesResult = next
}

describe('releasesService', async () => {
  beforeEach(() => {
    prismaMock = {
      release: {
        findMany: mock.fn(() => Promise.resolve(releasesResult)),
      },
    }
  })

  test('getAllReleases returns mocked data', async () => {
    setReleasesResult(mockedReleases)

    const result = await getAllReleases({ start: 1, count: 2 }, prismaMock)

    assert.deepEqual(result, output)
    assert.equal(prismaMock.release.findMany.mock.calls[0].arguments[0]['skip'], 1)
    assert.equal(prismaMock.release.findMany.mock.calls[0].arguments[0]['take'], 2)
  })

  test('getAllReleases uses default start and count if not provided', async () => {
    const result = await getAllReleases({}, prismaMock)

    assert.deepEqual(result, output)
    assert.equal(prismaMock.release.findMany.mock.calls[0].arguments[0]['skip'], 0)
    assert.equal(prismaMock.release.findMany.mock.calls[0].arguments[0]['take'], 10)
  })

  test('getAllReleases returns empty list if no results', async () => {
    setReleasesResult([])
    const result = await getAllReleases({}, prismaMock)

    assert.deepEqual(result, [])
  })
})

////////////// MOCK DATA ////////////////////////////////
const mockedReleases = [
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

const output = [
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
