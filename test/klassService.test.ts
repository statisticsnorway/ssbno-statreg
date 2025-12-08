import { test, beforeEach, afterEach, mock, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getDepartmentsFromKlass } from '../src/services/klassService'
import process from 'node:process'

let fetchMock: ReturnType<typeof mock.method>
let errorMock: ReturnType<typeof mock.method>
let payload: object // using object instead of KlassClassification to test invalid/partial payloads

function setPayload(next: object) {
  payload = next
}

beforeEach(() => {
  delete process.env.DATA_BASE_URL

  fetchMock = mock.method(global, 'fetch', async () => {
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

    assert.equal(fetchMock.mock.calls[0].arguments[0], 'https://data.ssb.no/api/klass/v1/versions/3009.json')

    assert.deepEqual(departments, mockDepartments)
  })

  test('uses DATA_BASE_URL env var when present', async () => {
    process.env.DATA_BASE_URL = 'https://example.test'
    setPayload({ classificationItems: [] })

    const departments = await getDepartmentsFromKlass()

    assert.equal(fetchMock.mock.calls[0].arguments[0], 'https://example.test/api/klass/v1/versions/3009.json')
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
    const firstLogArg = errorMock.mock.calls[0].arguments[0]

    assert.equal(errorMock.mock.callCount(), 1)
    assert.equal((firstLogArg as Error).message, 'Unexpected object structure from klass API')
    assert.deepEqual(departments, [])
  })

  test('catches and logs on fetch errors', async () => {
    fetchMock = mock.method(global, 'fetch', async () => {
      throw new Error('my error message')
    })
    const departments = await getDepartmentsFromKlass()
    const firstLogArg = errorMock.mock.calls[0].arguments[0]

    assert.equal(errorMock.mock.callCount(), 1)
    assert.equal((firstLogArg as Error).message, 'my error message')
    assert.deepEqual(departments, [])
  })
})

////////////// MOCK DATA ////////////////////////////////
const mockClassificationItems = {
  classificationItems: [
    { level: '1', code: '100', name: 'Dept A' },
    { level: '2', code: '110', name: 'Div A1', parentCode: '100' },
    { level: '2', code: '120', name: 'Div A2', parentCode: '100' },
    { level: '1', code: '200', name: 'Dept B' },
    { level: '2', code: '210', name: 'Div B1', parentCode: '200' },
  ],
}

const mockInvalidClassificationItems = {
  classificationItems: [
    { level: '1', code: '100', name: 'Dept A' },
    { level: '2', code: '999', name: 'Div X', parentCode: '555' },
  ],
}

const mockDepartments = [
  {
    code: 100,
    name: 'Dept A',
    divisions: [
      { code: 110, name: 'Div A1' },
      { code: 120, name: 'Div A2' },
    ],
  },
  {
    code: 200,
    name: 'Dept B',
    divisions: [{ code: 210, name: 'Div B1' }],
  },
]
