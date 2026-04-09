import { calculateEasterSunday } from '@/lib/blockedDays'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

describe('blockedDates', () => {
  describe('calculateEasterSunday()', () => {
    test('returns right easter sunday for years 2026-2036', () => {
      // https://en.wikipedia.org/wiki/List_of_dates_for_Easter
      assert.deepEqual(calculateEasterSunday(2026), new Date(2026, 3, 5))
      assert.deepEqual(calculateEasterSunday(2027), new Date(2027, 2, 28))
      assert.deepEqual(calculateEasterSunday(2028), new Date(2028, 3, 16))
      assert.deepEqual(calculateEasterSunday(2029), new Date(2029, 3, 1))
      assert.deepEqual(calculateEasterSunday(2030), new Date(2030, 3, 21))
      assert.deepEqual(calculateEasterSunday(2031), new Date(2031, 3, 13))
      assert.deepEqual(calculateEasterSunday(2032), new Date(2032, 2, 28))
      assert.deepEqual(calculateEasterSunday(2033), new Date(2033, 3, 17))
      assert.deepEqual(calculateEasterSunday(2034), new Date(2034, 3, 9))
      assert.deepEqual(calculateEasterSunday(2035), new Date(2035, 2, 25))
      assert.deepEqual(calculateEasterSunday(2036), new Date(2036, 3, 13))
    })
  })
})
