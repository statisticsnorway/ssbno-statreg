import { getLocalizedName, dateToISOString, sanitize, validateId } from '@/lib/utils'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

describe('utils ', () => {
  describe('getLocalizedName', () => {
    test('returns localized text with en language_code', () => {
      const result = getLocalizedName('en', 'Hello')
      assert.deepEqual(result, [{ language_code: 'en', text: 'Hello' }])
    })

    test('returns localized text with default language_code nb when no language has been passed', () => {
      const result = getLocalizedName(undefined, 'Hei')
      assert.deepEqual(result, [{ language_code: 'nb', text: 'Hei' }])
    })

    test('returns empty array when text is undefined', () => {
      const result = getLocalizedName('nb', undefined)
      assert.deepEqual(result, [])
    })
  })

  describe('dateToISOString', () => {
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

  describe('sanitize ', () => {
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

  describe('validateId ', () => {
    test('returns parsed number for valid ID', () => {
      const result = validateId('123')
      assert.equal(result, 123)
    })

    test('throws error for invalid numeric format', () => {
      assert.throws(() => validateId('abc'), { statregError: 'Invalid id format' })
    })
  })
})
