import { test, beforeEach, afterEach, mock, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  setDepartmentsNb,
  setDepartmentsEn,
  getDepartmentsFromKlass,
  getDivisionFromCode,
} from '../src/services/klassService'
import process from 'node:process'

let fetchMock: ReturnType<typeof mock.method>
let errorMock: ReturnType<typeof mock.method>
let classificationItems: object

function setClassificationItems(next: object) {
  classificationItems = next
}

describe('klassService ', async () => {
  beforeEach(() => {
    delete process.env.KLASS_BASE_URL

    fetchMock = mock.method(globalThis as unknown as { fetch: typeof fetch }, 'fetch', async () => {
      return {
        json: async () => classificationItems,
      }
    })

    errorMock = mock.method(console, 'error', () => {})
  })

  afterEach(() => {
    mock.restoreAll()
  })

  describe('getDepartmentsFromKlass ', async () => {
    test('builds departments and divisions correct from KLASS response', async () => {
      setClassificationItems(mockClassificationItems)

      const departments = await getDepartmentsFromKlass()

      assert.equal(
        fetchMock.mock.calls[0]?.arguments[0],
        'https://data.ssb.no/api/klass/v1/versions/3009.json?language=nb'
      )

      assert.deepEqual(departments, mockDepartments)
    })

    test('fetch correct url for language when en is passed in getDepartmentFromClass', async () => {
      await getDepartmentsFromKlass('en')

      assert.equal(
        fetchMock.mock.calls[0]?.arguments[0],
        'https://data.ssb.no/api/klass/v1/versions/3009.json?language=en'
      )
    })

    test('uses KLASS_BASE_URL env var when present', async () => {
      process.env.KLASS_BASE_URL = 'https://example.test'
      setClassificationItems({ classificationItems: [] })

      const departments = await getDepartmentsFromKlass()

      assert.equal(
        fetchMock.mock.calls[0]?.arguments[0],
        'https://example.test/api/klass/v1/versions/3009.json?language=nb'
      )
      assert.deepEqual(departments, [])
    })

    test('handles empty classificationItems gracefully', async () => {
      setClassificationItems({ classificationItems: [] })

      const departments = await getDepartmentsFromKlass()

      assert.deepEqual(departments, [])
      assert.equal(errorMock.mock.callCount(), 0)
    })

    test('handles missing classificationItems as empty', async () => {
      setClassificationItems({}) // key omitted

      const departments = await getDepartmentsFromKlass()

      assert.deepEqual(departments, [])
      assert.equal(errorMock.mock.callCount(), 0)
    })

    test('logs error on unexpected object structure', async () => {
      setClassificationItems(mockInvalidClassificationItems)

      const departments = await getDepartmentsFromKlass()
      const firstLogArg = errorMock.mock.calls[0]?.arguments[0]

      assert.equal(errorMock.mock.callCount(), 1)
      assert.equal((firstLogArg as Error).message, 'Unexpected object structure from klass API')
      assert.deepEqual(departments, [])
    })

    test('catches and logs on fetch errors', async () => {
      fetchMock = mock.method(globalThis as unknown as { fetch: typeof fetch }, 'fetch', async () => {
        throw new Error('my error message')
      })
      const departments = await getDepartmentsFromKlass()
      const firstLogArg = errorMock.mock.calls[0]?.arguments[0]

      assert.equal(errorMock.mock.callCount(), 1)
      assert.equal((firstLogArg as Error).message, 'my error message')
      assert.deepEqual(departments, [])
    })
  })

  describe('getDivisionFromCode', async () => {
    beforeEach(() => {
      setDepartmentsNb(mockDepartments)
      setDepartmentsEn(mockDepartmentsEn)
    })

    test('returns the correct division for Norwegian when found', async () => {
      const division = getDivisionFromCode(210)

      assert.deepEqual(division, { code: 210, name: 'Seksjon B1' })
    })

    test('returns the correct division for English when found', async () => {
      const division = getDivisionFromCode(110, 'en')

      assert.deepEqual(division, { code: 110, name: 'Division A1' })
    })

    test('returns undefined when the division code does not exist', async () => {
      const divisionNb = getDivisionFromCode(999)
      const divisionEn = getDivisionFromCode(999, 'en')

      assert.equal(divisionNb, undefined)
      assert.equal(divisionEn, undefined)
    })

    test('returns undefined when departments is an empty array', async () => {
      setDepartmentsNb([])
      setDepartmentsEn([])

      const divisionNb = getDivisionFromCode(999)
      const divisionEn = getDivisionFromCode(999, 'en')

      assert.equal(divisionNb, undefined)
      assert.equal(divisionEn, undefined)
    })
  })
})

////////////// MOCK DATA ////////////////////////////////
const mockClassificationItems = {
  classificationItems: [
    { level: '1', code: '100', name: 'Avdeling A' },
    { level: '2', code: '110', name: 'Seksjon A1', parentCode: '100' },
    { level: '2', code: '120', name: 'Seksjon A2', parentCode: '100' },
    { level: '1', code: '200', name: 'Avdeling B' },
    { level: '2', code: '210', name: 'Seksjon B1', parentCode: '200' },
  ],
}

const mockInvalidClassificationItems = {
  classificationItems: [
    { level: '1', code: '100', name: 'Avdeling A' },
    { level: '2', code: '999', name: 'Seksjon X', parentCode: '555' },
  ],
}

const mockDepartments = [
  {
    code: 100,
    name: 'Avdeling A',
    divisions: [
      { code: 110, name: 'Seksjon A1' },
      { code: 120, name: 'Seksjon A2' },
    ],
  },
  {
    code: 200,
    name: 'Avdeling B',
    divisions: [{ code: 210, name: 'Seksjon B1' }],
  },
]

const mockDepartmentsEn = [
  {
    code: 100,
    name: 'Department A',
    divisions: [
      { code: 110, name: 'Division A1' },
      { code: 120, name: 'Division A2' },
    ],
  },
  {
    code: 200,
    name: 'Department B',
    divisions: [{ code: 210, name: 'Division B1' }],
  },
]
