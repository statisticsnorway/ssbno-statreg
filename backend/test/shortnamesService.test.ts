import { vi, describe, test, expect, beforeEach } from 'vitest'
import { getShortnames, parseShortname, createShortname } from '@/services/shortnamesService'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prismaMock: any

describe('shortnamesService ', async () => {
  beforeEach(() => {
    prismaMock = {
      shortname: {
        findMany: vi.fn(() => Promise.resolve([{ name: 'kpi', statistic: { name: 'Konsumprisindeksen' } }])),
      },
    }
  })

  describe('getShortnames ', () => {
    test('returns mocked data', async () => {
      const result = await getShortnames(prismaMock)

      expect(result).toStrictEqual([{ shortname: 'kpi', statistic_name: 'Konsumprisindeksen' }])
    })
  })

  describe('parseShortname', () => {
    const expectedError = {
      statregError:
        "Field 'shortname' must only contain lowercase letters (a-z) and underscore (_), and be at most 14 characters.",
    }

    test('throws when shortname is not a string', () => {
      expect(() => parseShortname(123)).toThrow({ statregError: "Field 'shortname' must be a string." })
    })
    test('throws when shortname contains uppercase letters', () => {
      expect(() => parseShortname('Invalid_Name')).toThrow(expectedError)
    })

    test('throws when shortname is longer than 14 characters', () => {
      expect(() => parseShortname('this_name_is_too_long')).toThrow(expectedError)
    })

    test('throws when shortname contains invalid characters', () => {
      expect(() => parseShortname('invalid-name')).toThrow(expectedError)
    })
    test('returns the shortname when it is valid', () => {
      const result = parseShortname('valid_name')

      expect(result).toBe('valid_name')
    })
  })

  describe('createShortname', () => {
    beforeEach(() => {
      prismaMock = {
        shortname: {
          findUnique: vi.fn(() => Promise.resolve(null)),
          create: vi.fn(() => Promise.resolve({ id: 42, name: 'new_name' })),
        },
      }
    })

    test('throws when the body is missing the shortname field', async () => {
      await expect(createShortname(prismaMock, {})).rejects.toThrow({
        statregError: "Missing required field 'shortname'.",
      })
    })

    test('throws when the shortname already exists', async () => {
      prismaMock.shortname.findUnique = vi.fn(() => Promise.resolve({ id: 1 }))

      await expect(createShortname(prismaMock, { shortname: 'existing' })).rejects.toThrow({
        statregError: "Shortname 'existing' already exists",
      })
    })

    test('creates a shortname when the body is valid', async () => {
      const result = await createShortname(prismaMock, { shortname: 'new_name' })

      expect(prismaMock.shortname.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'new_name' }),
      })
      expect(result).toStrictEqual({ id: 42, shortname: 'new_name' })
    })
  })
})
