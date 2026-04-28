import { vi, describe, test, expect, beforeEach } from 'vitest'
import {
  calculateEasterSunday,
  calculateMovableHolidays,
  getBlockedDatesInPeriod,
  getHolidays,
  isDateAutoBlocked,
  isDateBlocked,
} from '@/lib/blockedDates'

let prismaMock: any
const { assertDayNotManuallyBlockedMock } = vi.hoisted(() => ({
  assertDayNotManuallyBlockedMock: vi.fn(() => Promise.resolve(true)),
}))

vi.mock(import('@/lib/asserts'), () => ({
  assertDayNotManuallyBlocked: assertDayNotManuallyBlockedMock,
  variable: 'mock',
}))

describe('blockedDates ', () => {
  beforeEach(() => {
    prismaMock = {
      calendar_dates: {
        findMany: vi.fn(() => Promise.resolve([{ day: new Date('2027-2-5') }])),
      },
    }
  })
  describe('isDateAutoBlocked()', () => {
    test('returns false for a regular weekday (Friday 5. feb 2027)', () => {
      expect(isDateAutoBlocked(new Date('2027-2-5'))).toBe(false)
    })
    test('returns true for Saturday', () => {
      expect(isDateAutoBlocked(new Date('2027-2-6'))).toBe(true)
    })
    test('returns true for Sunday', () => {
      expect(isDateAutoBlocked(new Date('2027-2-7'))).toBe(true)
    })
    test('returns true for a static holiday (1. mai 2027)', () => {
      expect(isDateAutoBlocked(new Date('2027-5-1'))).toBe(true)
    })
    test('returns true for a movable holiday ("1. Påskedag" 28. march 2027)', () => {
      expect(isDateAutoBlocked(new Date('2027-3-28'))).toBe(true)
    })
  })
  describe('isDateBlocked() ', () => {
    test('returns true if date automatically blocked', async () => {
      expect(await isDateBlocked(new Date('2027-2-6'))).toBe(true)
    })
    test('returns true if date is manually blocked', async () => {
      assertDayNotManuallyBlockedMock.mockResolvedValueOnce(false)
      expect(await isDateBlocked(new Date('2027-2-5'))).toBe(true)
    })
    test('returns false if date neither manually blocked nor aotumatically blocked', async () => {
      assertDayNotManuallyBlockedMock.mockResolvedValueOnce(true)
      expect(await isDateBlocked(new Date('2027-2-5'))).toBe(false)
    })
  })

  describe('getBlockedDatesInPeriod()', () => {
    test('marks manually blocked weekday as BLOCKED', async () => {
      const from = new Date('2027-2-5')
      const to = new Date('2027-2-5')
      prismaMock.mockResolvedValueOnce([{ day: new Date('2027-2-5') }])

      const result = await getBlockedDatesInPeriod(from, to)

      expect(result).toStrictEqual({ '2027-02-05': { status: 'BLOCKED' } })
    })

    test('does not include free weekdays in result', async () => {
      const from = new Date('2027-2-1')
      const to = new Date('2027-2-5')
      prismaMock.mockResolvedValueOnce([])

      const result = await getBlockedDatesInPeriod(from, to)

      expect(result).toStrictEqual({})
    })

    test('handles range spanning both blocked and free days', async () => {
      const from = new Date('2027-2-1')
      const to = new Date('2027-2-7')
      prismaMock.mockResolvedValueOnce([{ day: new Date('2027-2-5') }])

      const result = await getBlockedDatesInPeriod(from, to)

      expect(result['2027-02-05']).toStrictEqual({ status: 'BLOCKED' }) // manually blocked
      expect(result['2027-02-06']).toStrictEqual({ status: 'BLOCKED' }) // Saturday
      expect(result['2027-02-07']).toStrictEqual({ status: 'BLOCKED' }) // Sunday
      expect(result['2027-02-01']).toBeUndefined() // free weekday
      expect(result['2027-02-04']).toBeUndefined() // free weekday
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
