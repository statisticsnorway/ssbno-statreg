import { vi, describe, test, expect } from 'vitest'
// TODO: change back to import from '@/lib/....'

import { calculateEasterSunday, calculateMovableHolidays, getHolidays, isDateBlocked } from '../src/lib/blockedDates'

const { assertDayNotManuallyBlockedMock } = vi.hoisted(() => ({
  assertDayNotManuallyBlockedMock: vi.fn(() => Promise.resolve(true)),
}))

vi.mock(import('@/lib/asserts'), () => ({
  assertDayNotManuallyBlocked: assertDayNotManuallyBlockedMock,
  variable: 'mock',
}))

describe('blockedDates ', () => {
  describe('isDateBlocked() ', () => {
    test('returns false if date not blocked (Friday 5. feb 2027)', async () => {
      expect(await isDateBlocked(new Date('2027-2-5'))).toBe(false)
    })
    test('returns true for Saturday 6. feb 2027', async () => {
      expect(await isDateBlocked(new Date('2027-2-6'))).toBe(true)
    })
    test('returns true for Sunday 7. feb 2027', async () => {
      expect(await isDateBlocked(new Date('2027-2-7'))).toBe(true)
    })
    test('returns true for movable holiday ("1. Påskedag" 28. march 2027)', async () => {
      expect(await isDateBlocked(new Date('2027-3-28'))).toBe(true)
    })
    test('returns true for static holiday', async () => {
      expect(await isDateBlocked(new Date('2027-5-1'))).toBe(true)
    })
    test('returns true if date is manually blocked', async () => {
      assertDayNotManuallyBlockedMock.mockResolvedValueOnce(false)
      expect(await isDateBlocked(new Date('2027-2-5'))).toBe(true)
    })
  })
  describe('getHolidays() ', () => {
    test('returns correct dates for 2026', () => {
      const holidays = getHolidays(2026)
      expect(holidays).toStrictEqual(staticHolidaysByYear[2026].concat(movableHolidaysByYear[2026]))
    })
  })
  describe('calculateMovableHolidays() ', () => {
    test('returns right movable holidays for 2026-2028', () => {
      // https://no.wikipedia.org/wiki/Bevegelige_merkedager

      expect(calculateMovableHolidays(2026)).toStrictEqual(movableHolidaysByYear['2026'])
      expect(calculateMovableHolidays(2027)).toStrictEqual(movableHolidaysByYear['2027'])
      expect(calculateMovableHolidays(2028)).toStrictEqual(movableHolidaysByYear['2028'])
    })
  })

  describe('calculateEasterSunday()', () => {
    test('returns right easter sunday for years 2026-2036', () => {
      // https://no.wikipedia.org/wiki/Bevegelige_merkedager
      expect(calculateEasterSunday(2026)).toStrictEqual(new Date(`2026-4-5`))
      expect(calculateEasterSunday(2027)).toStrictEqual(new Date(`2027-3-28`))
      expect(calculateEasterSunday(2028)).toStrictEqual(new Date(`2028-4-16`))
      expect(calculateEasterSunday(2029)).toStrictEqual(new Date(`2029-4-1`))
      expect(calculateEasterSunday(2030)).toStrictEqual(new Date(`2030-4-21`))
      expect(calculateEasterSunday(2031)).toStrictEqual(new Date(`2031-4-13`))
      expect(calculateEasterSunday(2032)).toStrictEqual(new Date(`2032-3-28`))
      expect(calculateEasterSunday(2033)).toStrictEqual(new Date(`2033-4-17`))
      expect(calculateEasterSunday(2034)).toStrictEqual(new Date(`2034-4-9`))
      expect(calculateEasterSunday(2035)).toStrictEqual(new Date(`2035-3-25`))
      expect(calculateEasterSunday(2036)).toStrictEqual(new Date(`2036-4-13`))
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
