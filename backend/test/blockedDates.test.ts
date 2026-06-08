import { vi, describe, test, expect, beforeEach } from 'vitest'
import {
  HOLIDAYS,
  calculateEasterSunday,
  calculateMovableHolidays,
  getBlockedDatesInPeriod,
  getHolidayDates,
  isDateAutoBlocked,
  isDateBlocked,
} from '@/lib/blockedDates'
import { type BlockedReleaseDate } from '@ssbno-statreg/shared'

function datesOf(blockedReleaseDate: BlockedReleaseDate[]): string[] {
  return blockedReleaseDate.map((h) => h.date!)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prismaMock: any
let findManyResult = [{ day: new Date('2027-02-05') }]
function setFindManyResult(next: { day: Date }[]) {
  findManyResult = next
}

const { assertDayNotManuallyBlockedMock } = vi.hoisted(() => ({
  assertDayNotManuallyBlockedMock: vi.fn(() => Promise.resolve(true)),
}))

vi.mock(import('@/lib/asserts'), () => ({
  assertDayNotManuallyBlocked: assertDayNotManuallyBlockedMock,
  variable: 'mock',
}))

describe('blockedDates', () => {
  beforeEach(() => {
    Object.keys(HOLIDAYS).forEach((key) => delete HOLIDAYS[Number(key)])

    prismaMock = {
      calender_date: {
        findMany: vi.fn(() => Promise.resolve(findManyResult)),
      },
    }
  })

  describe('isDateAutoBlocked()', () => {
    test('returns false for a regular weekday (Friday 5. feb 2027)', () => {
      expect(isDateAutoBlocked('2027-02-05')).toBe(false)
    })
    test('returns true for Saturday', () => {
      expect(isDateAutoBlocked('2027-02-06')).toBe(true)
    })
    test('returns true for Sunday', () => {
      expect(isDateAutoBlocked('2027-02-07')).toBe(true)
    })
    test('returns true for a static holiday (1. mai 2027)', () => {
      expect(isDateAutoBlocked('2027-05-01')).toBe(true)
    })
    test('returns true for a movable holiday ("1. Påskedag" 28. march 2027)', () => {
      expect(isDateAutoBlocked('2027-03-28')).toBe(true)
    })
  })

  describe('isDateBlocked()', () => {
    test('returns true if date is automatically blocked', async () => {
      expect(await isDateBlocked('2027-02-06', prismaMock)).toBe(true)
    })
    test('returns true if date is manually blocked', async () => {
      assertDayNotManuallyBlockedMock.mockResolvedValueOnce(false)
      expect(await isDateBlocked('2027-02-05', prismaMock)).toBe(true)
    })
    test('returns false if date is neither manually nor automatically blocked', async () => {
      assertDayNotManuallyBlockedMock.mockResolvedValueOnce(true)
      expect(await isDateBlocked('2027-02-05', prismaMock)).toBe(false)
    })
  })

  describe('getBlockedDatesInPeriod()', () => {
    test('marks manually blocked weekday as BLOCKED', async () => {
      const from = new Date('2027-02-05')
      const to = new Date('2027-02-05')
      setFindManyResult([{ day: new Date('2027-02-05') }])

      const result = await getBlockedDatesInPeriod(from, to, prismaMock)

      expect(result).toStrictEqual({ '2027-02-05': { status: 'BLOCKED' } })
    })

    test('does not include free weekdays in result', async () => {
      const from = new Date('2027-02-01')
      const to = new Date('2027-02-05')
      setFindManyResult([])

      const result = await getBlockedDatesInPeriod(from, to, prismaMock)

      expect(result).toStrictEqual({})
    })

    test('handles range spanning both blocked and free days', async () => {
      const from = new Date('2027-02-01')
      const to = new Date('2027-02-07')
      setFindManyResult([{ day: new Date('2027-02-03') }])

      const result = await getBlockedDatesInPeriod(from, to, prismaMock)

      expect(result).toStrictEqual({
        '2027-02-03': { status: 'BLOCKED' },
        '2027-02-06': { status: 'BLOCKED' },
        '2027-02-07': { status: 'BLOCKED' },
      })
    })
  })

  describe('getHolidays() ', () => {
    test('returns correct dates for 2026', () => {
      const holidays = getHolidayDates(2026)
      expect(holidays).toStrictEqual(staticHolidaysFor2026[2026].concat(movableHolidaysByYear[2026]))
    })
  })
  describe('calculateMovableHolidays() ', () => {
    test('returns correct movable holidays for 2026-2028', () => {
      // https://no.wikipedia.org/wiki/Bevegelige_merkedager

      expect(datesOf(calculateMovableHolidays(2026))).toStrictEqual(movableHolidaysByYear['2026'])
      expect(datesOf(calculateMovableHolidays(2027))).toStrictEqual(movableHolidaysByYear['2027'])
      expect(datesOf(calculateMovableHolidays(2028))).toStrictEqual(movableHolidaysByYear['2028'])
    })
  })

  describe('calculateEasterSunday()', () => {
    test('returns correct easter sunday for years 2026-2036', () => {
      // https://no.wikipedia.org/wiki/Bevegelige_merkedager
      expect(calculateEasterSunday(2026)).toStrictEqual(new Date('2026-04-05T00:00Z'))
      expect(calculateEasterSunday(2027)).toStrictEqual(new Date('2027-03-28T00:00Z'))
      expect(calculateEasterSunday(2028)).toStrictEqual(new Date('2028-04-16T00:00Z'))
      expect(calculateEasterSunday(2029)).toStrictEqual(new Date('2029-04-01T00:00Z'))
      expect(calculateEasterSunday(2030)).toStrictEqual(new Date('2030-04-21T00:00Z'))
      expect(calculateEasterSunday(2031)).toStrictEqual(new Date('2031-04-13T00:00Z'))
      expect(calculateEasterSunday(2032)).toStrictEqual(new Date('2032-03-28T00:00Z'))
      expect(calculateEasterSunday(2033)).toStrictEqual(new Date('2033-04-17T00:00Z'))
      expect(calculateEasterSunday(2034)).toStrictEqual(new Date('2034-04-09T00:00Z'))
      expect(calculateEasterSunday(2035)).toStrictEqual(new Date('2035-03-25T00:00Z'))
      expect(calculateEasterSunday(2036)).toStrictEqual(new Date('2036-04-13T00:00Z'))
    })
  })
})

// Mocks

const movableHolidaysByYear = {
  '2026': [
    '2026-04-02', // Skjærtorsdag
    '2026-04-03', // Langfredag
    '2026-04-05', // Første påskedag
    '2026-04-06', // Andre påskedag
    '2026-05-14', // Kristi himmelfartsdag
    '2026-05-24', // Første pinsedag
    '2026-05-25', // Andre pinsedag
  ],
  '2027': [
    '2027-03-25', // Skjærtorsdag
    '2027-03-26', // Langfredag
    '2027-03-28', // Første påskedag
    '2027-03-29', // Andre påskedag
    '2027-05-06', // Kristi himmelfartsdag
    '2027-05-16', // Første pinsedag
    '2027-05-17', // Andre pinsedag
  ],
  '2028': [
    '2028-04-13', // Skjærtorsdag
    '2028-04-14', // Langfredag
    '2028-04-16', // Første påskedag
    '2028-04-17', // Andre påskedag
    '2028-05-25', // Kristi himmelfartsdag
    '2028-06-04', // Første pinsedag
    '2028-06-05', // Andre pinsedag
  ],
}

const staticHolidaysFor2026 = {
  '2026': ['2026-01-01', '2026-05-01', '2026-05-17', '2026-12-25', '2026-12-26'],
}
