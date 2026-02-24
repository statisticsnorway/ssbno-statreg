import { test, beforeEach, afterEach, mock, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getDepartmentsFromKlass } from '../src/services/klassService'
import process from 'node:process'

let fetchMock: ReturnType<typeof mock.method>
let errorMock: ReturnType<typeof mock.method>
let payload: object

function setPayload(next: object) {
  payload = next
}
describe('klassService ', async () => {
  beforeEach(() => {
    delete process.env.DATA_BASE_URL

    fetchMock = mock.method(globalThis as unknown as { fetch: typeof fetch }, 'fetch', async () => {
      return {
        json: async () => payload,
      }
    })

    errorMock = mock.method(console, 'error', () => {})
  })

  afterEach(() => {
    fetchMock.mock.restore()
    errorMock.mock.restore()
  })

  describe('getDepartmentsFromKlass ', async () => {
    test('builds departments and divisions correct from KLASS response', async () => {
      setPayload(mockClassificationItems)

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
      setPayload({ classificationItems: [] })

      const departments = await getDepartmentsFromKlass()

      assert.equal(
        fetchMock.mock.calls[0]?.arguments[0],
        'https://example.test/api/klass/v1/versions/3009.json?language=nb'
      )
      assert.deepEqual(departments, [])
    })

    test('handles empty classificationItems gracefully', async () => {
      setPayload({ classificationItems: [] })

      const departments = await getDepartmentsFromKlass()

      assert.deepEqual(departments, [])
      assert.equal(errorMock.mock.callCount(), 0)
    })

    test('handles missing classificationItems as empty', async () => {
      setPayload({}) // key omitted

      const departments = await getDepartmentsFromKlass()

      assert.deepEqual(departments, [])
      assert.equal(errorMock.mock.callCount(), 0)
    })

    test('logs error on unexpected object structure', async () => {
      setPayload(mockInvalidClassificationItems)

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
