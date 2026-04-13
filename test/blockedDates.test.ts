import { before, describe, mock, test } from 'node:test'
import assert from 'node:assert/strict'
import { isDateBlocked } from '@/lib/blockedDates'

let calculateEasterSunday: Function
let calculateMovableHolidays: Function
let getHolidays: Function
const assertDateNotManuallyBlockedMock = mock.fn(() => true)

describe('blockedDates ', () => {
  before(async () => {
    // eslint-disable-next-line no-unused-vars
    const assertsLib = await import('@/lib/asserts').then(({ assertDayNotManuallyBlocked: _, ...rest }) => rest)
    mock.module('@/lib/asserts', {
      namedExports: {
        assertDayNotManuallyBlocked: assertDateNotManuallyBlockedMock,
        assertsLib,
      },
    })
    ;({ calculateEasterSunday, calculateMovableHolidays, getHolidays } = await import('@/lib/blockedDates'))
  })
  describe('isDateBlocked() ', () => {
    test('returns false if date not blocked (Friday 5. feb 2027)', async () => {
      assert.equal(await isDateBlocked(new Date('2027-2-5')), false)
    })
    test('returns true for Saturday 6. feb 2027', async () => {
      assert.equal(await isDateBlocked(new Date('2027-2-6')), true)
    })
    test('returns true for Sunday 7. feb 2027', async () => {
      assert.equal(await isDateBlocked(new Date('2027-2-7')), true)
    })
    test('returns true for movable holiday ("1. Påskedag" 28. march 2027)', async () => {
      assert.equal(await isDateBlocked(new Date('2027-3-28')), true)
    })
    test('returns true for static holiday', async () => {
      assert.equal(await isDateBlocked(new Date('2027-1-1')), true)
    })
    test('returns true if date manually blocked', async () => {
      assertDateNotManuallyBlockedMock.mock.mockImplementationOnce(() => false)
      assert.equal(await isDateBlocked(new Date('2027-2-5')), true)
    })
  })
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
      assert.deepEqual(calculateEasterSunday(2026), new Date(`2026-4-5`))
      assert.deepEqual(calculateEasterSunday(2027), new Date(`2027-3-28`))
      assert.deepEqual(calculateEasterSunday(2028), new Date(`2028-4-16`))
      assert.deepEqual(calculateEasterSunday(2029), new Date(`2029-4-1`))
      assert.deepEqual(calculateEasterSunday(2030), new Date(`2030-4-21`))
      assert.deepEqual(calculateEasterSunday(2031), new Date(`2031-4-13`))
      assert.deepEqual(calculateEasterSunday(2032), new Date(`2032-3-28`))
      assert.deepEqual(calculateEasterSunday(2033), new Date(`2033-4-17`))
      assert.deepEqual(calculateEasterSunday(2034), new Date(`2034-4-9`))
      assert.deepEqual(calculateEasterSunday(2035), new Date(`2035-3-25`))
      assert.deepEqual(calculateEasterSunday(2036), new Date(`2036-4-13`))
    })
  })
})

// Mocks

const movableHolidaysByYear = {
  '2026': [
    new Date('2026-4-2'), // Skjærtorsdag
    new Date('2026-4-3'), // Langfredag
    new Date('2026-4-5'), // Første påskedag
    new Date('2026-4-6'), // Andre påskedag
    new Date('2026-5-14'), // Kristi himmelfartsdag
    new Date('2026-5-24'), // Første pinsedag
    new Date('2026-5-25'), // Andre pinsedag
  ],
  '2027': [
    new Date('2027-3-25'), // Skjærtorsdag
    new Date('2027-3-26'), // Langfredag
    new Date('2027-3-28'), // Første påskedag
    new Date('2027-3-29'), // Andre påskedag
    new Date('2027-5-6'), // Kristi himmelfartsdag
    new Date('2027-5-16'), // Første pinsedag
    new Date('2027-5-17'), // Andre pinsedag
  ],
  '2028': [
    new Date('2028-4-13'), // Skjærtorsdag
    new Date('2028-4-14'), // Langfredag
    new Date('2028-4-16'), // Første påskedag
    new Date('2028-4-17'), // Andre påskedag
    new Date('2028-5-25'), // Kristi himmelfartsdag
    new Date('2028-6-4'), // Første pinsedag
    new Date('2028-6-5'), // Andre pinsedag
  ],
}

const staticHolidaysByYear = {
  '2026': [
    new Date('2026-1-1'),
    new Date('2026-5-1'),
    new Date('2026-5-17'),
    new Date('2026-12-25'),
    new Date('2026-12-26'),
  ],
}
