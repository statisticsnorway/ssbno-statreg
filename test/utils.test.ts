import { sanitize, validateId, reqParamToString } from '@/lib/utils'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

describe('utils ', () => {
  describe('sanitize() ', () => {
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

  describe('reqParamToString ', () => {
    test('returns string if input is string', () => {
      const result = reqParamToString('hello')
      assert.equal(result, 'hello')
    })

    test('returns first element if input is array', () => {
      const result = reqParamToString(['one', 'two'])
      assert.equal(result, 'one')
    })
  })
})
