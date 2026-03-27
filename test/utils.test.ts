import {
  dateToISOString,
  sanitize,
  validateDateOnly,
  validateDateISO,
  validateAndParseDate,
  ensureString,
  ensureNumber,
  ensureRequiredFieldsExists,
} from '@/lib/utils'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

describe('utils', () => {
  describe('dateToISOString ', () => {
    test('returns ISO string for valid date', () => {
      const date = new Date('2020-01-01T12:00:00Z')
      const result = dateToISOString(date)
      assert.equal(result, '2020-01-01T12:00:00.000Z')
    })

    test('returns undefined when date is null', () => {
      const result = dateToISOString(null)
      assert.equal(result, undefined)
    })
  })

  describe('sanitize', () => {
    test('handles empty string', async () => {
      const result = sanitize('')
      assert.equal(result, '')
    })
    test('handles input that is not string', async () => {
      const result = sanitize(Number(8) as any)
      assert.equal(result, '')
    })
    test('returning same string if all characters are legal', async () => {
      const input = 'Alt her er lovlige bokstaver inkl. ÆæÅ!/'
      const result = sanitize(input)
      assert.equal(result, input)
    })
    test('removes illigal characters', async () => {
      const input = `Fjerner alle ulovlige tegn: é\\<>{}`
      const result = sanitize(input)
      assert.equal(result, 'Fjerner alle ulovlige tegn: ')
    })
  })

  describe('validateDateOnly', () => {
    test('accepts and returns valid Date', () => {
      const result = validateDateOnly('2026-12-24')
      assert.deepStrictEqual(result, new Date('2026-12-24'))
    })

    test('returns 400 for date ISO format', async () => {
      assert.throws(() => validateDateOnly('2026-03-25T12:30:00Z'), {
        statregError: 'Invalid date format: 2026-03-25T12:30:00Z',
      })
    })

    test('returns 400 for invalid date string format', async () => {
      assert.throws(() => validateDateOnly('24. des'), {
        statregError: 'Invalid date format: 24. des',
      })
    })

    test('returns 400 if date parsing fails', async () => {
      assert.throws(() => validateDateOnly('9999-11-00'), {
        statregError: 'Invalid date format: 9999-11-00',
      })
    })
  })

  describe('validateDateISO ', () => {
    test('accepts and returns valid date ISO format with Z', () => {
      const result = validateDateISO('2026-03-25T12:30:00Z')
      assert.deepStrictEqual(result, new Date('2026-03-25T12:30:00Z'))
    })

    test('accepts and returns valid date ISO format with offset', () => {
      const result = validateDateISO('2026-03-25T12:30:00+01:00')
      assert.deepStrictEqual(result, new Date('2026-03-25T12:30:00+01:00'))
    })

    test('accepts and returns valid date ISO format with milliseconds', () => {
      const result = validateDateISO('2026-03-25T12:30:00.123Z')
      assert.deepStrictEqual(result, new Date('2026-03-25T12:30:00.123Z'))
    })

    test('returns 400 for invalid date only format', () => {
      assert.throws(() => validateDateISO('2026-03-25', 'publish_time'), {
        statregError: 'Invalid publish_time date format: 2026-03-25',
      })
    })

    test('returns 400 for invalid date with missing timezone', () => {
      assert.throws(() => validateDateISO('2026-03-25T12:30:00'), {
        statregError: 'Invalid date format: 2026-03-25T12:30:00',
      })
    })

    test('returns 400 for invalid date with space instead of T', () => {
      assert.throws(() => validateDateISO('2026-03-25 12:30:00Z'), {
        statregError: 'Invalid date format: 2026-03-25 12:30:00Z',
      })
    })
  })

  describe('validateAndParseDate', () => {
    const dateRegEx = /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-dd

    test('returns Date for valid input', () => {
      const result = validateAndParseDate('2026-03-25', '', dateRegEx)
      assert.deepStrictEqual(result, new Date('2026-03-25'))
    })

    test('returns 400 for missing date', () => {
      assert.throws(() => validateAndParseDate(undefined, 'test', dateRegEx), {
        statregError: 'Invalid test date format:',
      })
    })

    test('returns 400 for date array input', () => {
      assert.throws(() => validateAndParseDate(['2026-03-25', '2026-03-26'], '', dateRegEx), {
        statregError: 'Invalid date format: 2026-03-25,2026-03-26',
      })
    })
  })

  describe('ensureString', () => {
    test('returns passed string', () => {
      const result = ensureString('value')
      assert.equal(result, 'value')
    })

    test('returns first element if passed value is an array of string', () => {
      const result = ensureString(['value1', 'value2'])
      assert.equal(result, 'value1')
    })

    test('returns empty string if string is undefined', () => {
      const result = ensureString(undefined)
      assert.equal(result, '')
    })
  })

  describe('ensureNumber', () => {
    test('returns parsed number for valid string id', () => {
      const result = ensureNumber('123')
      assert.equal(result, 123)
    })

    test('returns parsed number for valid number id', () => {
      const result = ensureNumber(123)
      assert.equal(result, 123)
    })

    test('throws error for invalid numeric format', () => {
      assert.throws(() => ensureNumber('abc'), { statregError: 'Invalid id format' })
    })
  })

  describe('ensureRequiredFieldsExists', () => {
    test('return body when all the required fields exists', () => {
      const requiredFields: (keyof { field_1: 'test' })[] = ['field_1']
      const body = {
        field_1: 'test',
      }
      assert.deepStrictEqual(body, ensureRequiredFieldsExists(body, requiredFields))
    })

    test('return body when there are no required fields', () => {
      const requiredFields: (keyof { field_1: 'test' })[] = []
      const body = {
        field_1: 'test',
      }
      assert.deepStrictEqual(body, ensureRequiredFieldsExists(body, requiredFields))
    })

    test('return 400 when a required field is undefined', () => {
      const requiredFields: (keyof { field_1: 'test'; field_2: 'value' })[] = ['field_1', 'field_2']
      const body = {
        field_1: 'test',
        field_2: undefined,
      }
      assert.throws(() => ensureRequiredFieldsExists(body, requiredFields), {
        statregError: 'Missing required field(s): field_2',
      })
    })

    test('return 400 when body is undefined', () => {
      const requiredFields = ['field_1', 'field_2']
      assert.throws(() => ensureRequiredFieldsExists(undefined, requiredFields), {
        statregError: 'Missing required field(s): field_1, field_2',
      })
    })
  })
})
