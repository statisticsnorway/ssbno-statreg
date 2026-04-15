import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import {
  setDepartmentsNb,
  setDepartmentsEn,
  getDepartmentsFromKlass,
  getDivisionFromCode,
} from '@/services/klassService'
import process from 'node:process'

let fetchMock: ReturnType<typeof vi.fn>
let classificationItems: object

function setClassificationItems(next: object) {
  classificationItems = next
}

describe('klassService ', async () => {
  beforeEach(() => {
    delete process.env.KLASS_BASE_URL

    fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => classificationItems,
    } as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getDepartmentsFromKlass ', async () => {
    test('builds departments and divisions correct from KLASS response', async () => {
      setClassificationItems(mockClassificationItems)

      const departments = await getDepartmentsFromKlass()

      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        'https://data.ssb.no/api/klass/v1/versions/3009.json?language=nb'
      )

      expect(departments).toStrictEqual(mockDepartments)
    })

    test('fetch correct url when language "en" is passed in getDepartmentFromClass', async () => {
      await getDepartmentsFromKlass('en')

      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        'https://data.ssb.no/api/klass/v1/versions/3009.json?language=en'
      )
    })

    test('uses KLASS_BASE_URL env var when present', async () => {
      process.env.KLASS_BASE_URL = 'https://example.test'
      setClassificationItems({ classificationItems: [] })

      const departments = await getDepartmentsFromKlass()

      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        'https://example.test/api/klass/v1/versions/3009.json?language=nb'
      )
      expect(departments).toStrictEqual([])
    })

    test('handles empty classificationItems gracefully', async () => {
      setClassificationItems({ classificationItems: [] })

      const departments = await getDepartmentsFromKlass()

      expect(departments).toStrictEqual([])
    })

    test('handles missing classificationItems as empty', async () => {
      setClassificationItems({}) // key omitted

      const departments = await getDepartmentsFromKlass()

      expect(departments).toStrictEqual([])
    })

    test('logs error on unexpected object structure', async () => {
      setClassificationItems(mockInvalidClassificationItems)

      const departments = await getDepartmentsFromKlass()
      expect(departments).toStrictEqual([])
    })

    test('catches and logs on fetch errors', async () => {
      fetchMock.mockImplementationOnce(async () => {
        throw new Error('my error message')
      })
      const departments = await getDepartmentsFromKlass()
      expect(departments).toStrictEqual([])
    })
  })

  describe('getDivisionFromCode', async () => {
    beforeEach(() => {
      setDepartmentsNb(mockDepartments)
      setDepartmentsEn(mockDepartmentsEn)
    })

    test('returns the correct division for "nb" when found', async () => {
      const division = getDivisionFromCode(210)

      expect(division).toStrictEqual({ code: 210, name: 'Seksjon B1' })
    })

    test('returns the correct division for "en" when found', async () => {
      const division = getDivisionFromCode(110, 'en')

      expect(division).toStrictEqual({ code: 110, name: 'Division A1' })
    })

    test('returns undefined when the division code does not exist', async () => {
      const divisionNb = getDivisionFromCode(999)
      const divisionEn = getDivisionFromCode(999, 'en')

      expect(divisionNb).toBeUndefined
      expect(divisionEn).toBeUndefined
    })

    test('returns undefined when departments is an empty array', async () => {
      setDepartmentsNb([])
      setDepartmentsEn([])

      const divisionNb = getDivisionFromCode(999)
      const divisionEn = getDivisionFromCode(999, 'en')

      expect(divisionNb).toBeUndefined
      expect(divisionEn).toBeUndefined
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
