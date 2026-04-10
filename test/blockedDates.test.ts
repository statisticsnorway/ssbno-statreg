import { calculateEasterSunday, calculateMovableHolidays, getHolidays } from '@/lib/blockedDays'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

describe('blockedDates ', () => {
  describe('getHolidays() ', () => {
    test('returns correct dates for 2026', () => {
      const holidays = getHolidays(2026)
      assert.deepEqual(holidays, staticHolidaysByYear[2026].concat(movableHolidaysByYear[2026]))
    })
  })
  describe('calculateMovableHolidays() ', () => {
    test('returns right movable holidays for 2026-2028', () => {
      // https://no.wikipedia.org/wiki/Bevegelige_merkedager

      assert.deepEqual(calculateMovableHolidays(2026), movableHolidaysByYear['2026'])
      assert.deepEqual(calculateMovableHolidays(2027), movableHolidaysByYear['2027'])
      assert.deepEqual(calculateMovableHolidays(2028), movableHolidaysByYear['2028'])
    })
  })

  describe('calculateEasterSunday()', () => {
    test('returns right easter sunday for years 2026-2036', () => {
      // https://no.wikipedia.org/wiki/Bevegelige_merkedager
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

// Mocks

const movableHolidaysByYear = {
  '2026': [
    new Date(2026, 3, 2), // Skjærtorsdag
    new Date(2026, 3, 3), // Langfredag
    new Date(2026, 3, 5), // Første påskedag
    new Date(2026, 3, 6), // Andre påskedag
    new Date(2026, 4, 14), // Kristi himmelfartsdag
    new Date(2026, 4, 24), // Første pinsedag
    new Date(2026, 4, 25), // Andre pinsedag
  ],
  '2027': [
    new Date(2027, 2, 25), // Skjærtorsdag
    new Date(2027, 2, 26), // Langfredag
    new Date(2027, 2, 28), // Første påskedag
    new Date(2027, 2, 29), // Andre påskedag
    new Date(2027, 4, 6), // Kristi himmelfartsdag
    new Date(2027, 4, 16), // Første pinsedag
    new Date(2027, 4, 17), // Andre pinsedag
  ],
  '2028': [
    new Date(2028, 3, 13), // Skjærtorsdag
    new Date(2028, 3, 14), // Langfredag
    new Date(2028, 3, 16), // Første påskedag
    new Date(2028, 3, 17), // Andre påskedag
    new Date(2028, 4, 25), // Kristi himmelfartsdag
    new Date(2028, 5, 4), // Første pinsedag
    new Date(2028, 5, 5), // Andre pinsedag
  ],
}

const staticHolidaysByYear = {
  '2026': [
    new Date(2026, 1, 1),
    new Date(2026, 5, 1),
    new Date(2026, 5, 17),
    new Date(2026, 12, 25),
    new Date(2026, 12, 26),
  ],
}
