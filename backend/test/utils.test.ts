import {
  dateToISOString,
  sanitize,
  parseDateOnly,
  parseDateISO,
  ensureString,
  ensureStringArray,
  parseId,
  ensureRequiredFieldsExists,
  isNumber,
  getDateOnlyAsString,
  parseSortInput,
} from '@/lib/utils'
import { describe, test, expect } from 'vitest'

describe('utils', () => {
  describe('dateToISOString ', () => {
    test('returns ISO string for valid date', () => {
      const date = new Date('2020-01-01T12:00:00Z')
      const result = dateToISOString(date)
      expect(result).toBe('2020-01-01T12:00:00.000Z')
    })

    test('returns undefined when date is null', () => {
      const result = dateToISOString(null)
      expect(result).toBeUndefined()
    })
  })

  describe('sanitize', () => {
    test('handles empty string', async () => {
      const result = sanitize('')
      expect(result).toBe('')
    })
    test('handles input that is not string', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = sanitize(Number(8) as any)
      expect(result).toBe('')
    })
    test('returning same string if all characters are legal', async () => {
      const input = 'Alt her er lovlige bokstaver inkl. ÆæÅ!/'
      const result = sanitize(input)
      expect(result).toBe(input)
    })
    test('removes illigal characters', async () => {
      const input = `Fjerner alle ulovlige tegn: é\\<>{}`
      const result = sanitize(input)
      expect(result).toBe('Fjerner alle ulovlige tegn: ')
    })
  })

  describe('parseDateOnly', () => {
    test('accepts and returns valid Date', () => {
      const result = parseDateOnly('2026-12-24')
      expect(result.toISOString()).toBe('2026-12-24T00:00:00.000Z')
    })

    test('returns 400 for date ISO format', async () => {
      await expect(() => parseDateOnly('2026-03-25T12:30:00Z')).toThrow({
        statregError: 'Invalid date format: 2026-03-25T12:30:00Z',
      })
    })

    test('returns 400 for invalid date string format', async () => {
      expect(() => parseDateOnly('24. des')).toThrow({
        statregError: 'Invalid date format: 24. des',
      })
    })

    test('returns 400 if date parsing fails', async () => {
      expect(() => parseDateOnly('9999-11-00')).toThrow({
        statregError: 'Invalid date format: 9999-11-00',
      })
    })
  })

  describe('parseDateISO ', () => {
    test('accepts and returns valid date ISO format with Z', () => {
      const result = parseDateISO('2026-03-25T12:30:00Z')
      expect(result.toISOString()).toBe('2026-03-25T12:30:00.000Z')
    })

    test('accepts and returns valid date ISO format with offset', () => {
      const result = parseDateISO('2026-03-25T12:30:00+01:00')
      expect(result.toISOString()).toBe('2026-03-25T11:30:00.000Z')
    })

    test('accepts and returns valid date ISO format with milliseconds', () => {
      const result = parseDateISO('2026-03-25T12:30:00.123Z')
      expect(result.toISOString()).toBe('2026-03-25T12:30:00.123Z')
    })

    test('returns 400 for missing date', () => {
      expect(() => parseDateISO(undefined)).toThrow({
        statregError: 'Invalid date format:',
      })
    })

    test('returns 400 for invalid date only format', () => {
      expect(() => parseDateISO('2026-03-25', 'publish_time')).toThrow({
        statregError: 'Invalid publish_time date format: 2026-03-25',
      })
    })

    test('returns 400 for invalid date with missing timezone', () => {
      expect(() => parseDateISO('2026-03-25T12:30:00')).toThrow({
        statregError: 'Invalid date format: 2026-03-25T12:30:00',
      })
    })

    test('returns 400 for invalid date with space instead of T', () => {
      expect(() => parseDateISO('2026-03-25 12:30:00Z')).toThrow({
        statregError: 'Invalid date format: 2026-03-25 12:30:00Z',
      })
    })

    test('returns 400 for invalid date if not colon in offset', () => {
      expect(() => parseDateISO('2026-03-25T12:30:00+0100')).toThrow({
        statregError: 'Invalid date format: 2026-03-25T12:30:00+0100',
      })
    })
  })

  describe('ensureString', () => {
    test('returns passed string', () => {
      const result = ensureString('value')
      expect(result).toBe('value')
    })

    test('returns first element if passed value is an array of string', () => {
      const result = ensureString(['value1', 'value2'])
      expect(result).toBe('value1')
    })

    test('returns empty string if string is undefined', () => {
      const result = ensureString(undefined)
      expect(result).toBe('')
    })
  })

  describe('ensureStringArray', () => {
    test('returns array of strings when passed a comma-separated string', () => {
      const result = ensureStringArray('value1,value2,value3')
      expect(result).toEqual(['value1', 'value2', 'value3'])
    })

    test('returns array of string when passed string', () => {
      const result = ensureStringArray('value1')
      expect(result).toEqual(['value1'])
    })

    test('returns empty array when passed a non-string value', () => {
      // @ts-expect-error testing non-string input
      const result = ensureStringArray([123])
      expect(result).toEqual([])
    })
  })

  describe('ensureIdIsNumber', () => {
    test('returns parsed number for valid string id', () => {
      const result = parseId('123')
      expect(result).toBe(123)
    })

    test('returns parsed number for valid number id', () => {
      const result = parseId(123)
      expect(result).toBe(123)
    })

    test('throws error for invalid numeric format', () => {
      expect(() => parseId('abc')).toThrow({ statregError: 'Invalid id format' })
    })

    test('throws error for negative number', () => {
      expect(() => parseId('-1', 'variant')).toThrow({ statregError: 'Invalid variant id format' })
    })
  })

  describe('ensureRequiredFieldsExists', () => {
    test('return body when all the required fields exists', () => {
      const requiredFields: (keyof { field_1: 'test'; field_2: null })[] = ['field_1', 'field_2']
      const body = {
        field_1: 'test',
        field_2: null,
      }
      expect(body).toBe(ensureRequiredFieldsExists(body, requiredFields))
    })

    test('return 400 when body is undefined', () => {
      const requiredFields = ['field_1', 'field_2']
      expect(() => ensureRequiredFieldsExists(undefined, requiredFields)).toThrow({
        statregError: 'Missing required field(s): field_1, field_2',
      })
    })

    test('return 400 when body object is empty', () => {
      const requiredFields = ['field_1', 'field_2']
      expect(() => ensureRequiredFieldsExists({}, requiredFields as never[])).toThrow({
        statregError: 'Missing required field(s): field_1, field_2',
      })
    })
  })

  describe('isNumber', () => {
    test('a number is a number', () => {
      expect(true).toBe(isNumber(42))
    })
    test('a string with a number is castable as number', () => {
      expect(true).toBe(isNumber('9000'))
    })
    test('a string of text is not a number', () => {
      expect(false).toBe(isNumber('text in a string'))
    })
  })

  describe('getDateOnlyAsString', () => {
    test('gets the correct datestring from date', () => {
      const dateString = getDateOnlyAsString(new Date('2026-05-05T00:00Z'))
      expect(dateString).toBe('2026-05-05')
    })
    test('returns iso date if given local date with offset', () => {
      const dateString = getDateOnlyAsString(new Date('2026-05-05T00:00+01:00'))
      expect(dateString).toBe('2026-05-04')
    })
  })

  describe('parseSortInput', () => {
    test("return ascending sort when no '-' prefix", () => {
      const result = parseSortInput(['publish_time'], ['publish_time'])
      expect(result).toEqual([
        {
          publish_time: 'asc',
        },
      ])
    })

    test("return descending sort when '-' prefix is used", () => {
      const result = parseSortInput(['-publish_time', 'approval_status'], ['approval_status'])
      expect(result).toEqual([
        {
          approval_status: 'asc',
        },
      ])
    })

    test('handle multiple valid fields', () => {
      const result = parseSortInput(['publish_time', '-approval_status'], ['publish_time', 'approval_status'])
      expect(result).toEqual([{ publish_time: 'asc' }, { approval_status: 'desc' }])
    })

    test('ignore fields not in allowedFields', () => {
      const result = parseSortInput(['publish_time', 'invalid'], ['publish_time'])
      expect(result).toEqual([{ publish_time: 'asc' }])
    })

    test('handle mix of valid and invalid with correct order preserved', () => {
      const result = parseSortInput(
        ['invalid', '-publish_time', 'approval_status'],
        ['publish_time', 'approval_status']
      )
      expect(result).toEqual([{ publish_time: 'desc' }, { approval_status: 'asc' }])
    })

    test('handle undefined allowedFields safely', () => {
      const result = parseSortInput(['publish_time'], undefined)
      expect(result).toEqual([])
    })

    test('filter out all invalid fields', () => {
      const result = parseSortInput(['invalid', '-field'], ['publish_time'])
      expect(result).toEqual([])
    })

    test('return empty array if sortQuery is undefined', () => {
      const result = parseSortInput(undefined, ['publish_time'])
      expect(result).toEqual([])
    })

    test('return empty array if sortQuery is empty', () => {
      const result = parseSortInput([], ['publish_time'])
      expect(result).toEqual([])
    })

    test('return empty array if allowedFields is empty', () => {
      const result = parseSortInput(['publish_time'], [])
      expect(result).toEqual([])
    })
  })
})
