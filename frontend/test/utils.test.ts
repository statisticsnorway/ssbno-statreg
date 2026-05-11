import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatPublishTime,
  formatDate,
  getFirstDayOfNthMonth,
  getLastDayOfNthMonth,
  getDateOnlyAsString,
  parsePublishDateWithTime,
} from '../src/lib/utils'

const timeZone = 'Europe/Oslo'
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('utils', () => {
  describe('formatPublishTime', () => {
    test('returns "-" when publishTime is undefined', () => {
      const result = formatPublishTime(undefined)

      expect(result).toBe('-')
    })

    test('formats ISO datetime correctly in nb-NO locale', () => {
      const iso = '2024-01-15T10:30:00Z'

      const result = formatPublishTime(iso, timeZone)

      expect(result).toBe('15.01.2024 kl 11:30')
    })

    test('formats single-digit day and month with leading zeros', () => {
      const iso = '2024-03-04T08:05:00Z'

      const result = formatPublishTime(iso, timeZone)

      expect(result).toBe('04.03.2024 kl 09:05')
    })
  })

  describe('formatDate', () => {
    test('returns an empty string when input is undefined', () => {
      const result = formatPublishTime(undefined)

      expect(result).toBe('-')
    })

    test('formats ISO date correctly in nb-NO locale', () => {
      const iso = '2024-06-01T00:00:00Z'

      const result = formatDate(iso, timeZone)

      expect(result).toBe('01.06.2024')
    })

    test('formats single-digit day and month with leading zeros', () => {
      const iso = '2024-02-03T12:00:00Z'

      const result = formatDate(iso, timeZone)

      expect(result).toBe('03.02.2024')
    })
  })

  describe('getFirstDayOfNthMonth', () => {
    test('returns the first day of the current month when monthsAhead is 0', () => {
      vi.setSystemTime(new Date('2024-03-15T00:00+01:00'))
      expect(getFirstDayOfNthMonth(0)).toEqual(new Date('2024-03-01T00:00+01:00'))
    })

    test('returns the first day of a future month', () => {
      vi.setSystemTime(new Date('2024-03-15T00:00+01:00'))
      expect(getFirstDayOfNthMonth(2)).toEqual(new Date('2024-05-01T00:00+02:00'))
    })

    test('rolls over to next year when month exceeds december', () => {
      vi.setSystemTime(new Date('2024-12-15T00:00+01:00'))
      expect(getFirstDayOfNthMonth(2)).toEqual(new Date('2025-02-01T00:00+01:00'))
    })
  })

  describe('getLastDayOfNthMonth', () => {
    test('returns the last day of the current month when monthsAhead is 0', () => {
      vi.setSystemTime(new Date('2024-03-15T00:00+01:00'))
      expect(getLastDayOfNthMonth(0)).toEqual(new Date('2024-03-31T00:00+01:00'))
    })

    test('returns the last day of a future month', () => {
      vi.setSystemTime(new Date('2024-03-15T00:00+01:00'))
      expect(getLastDayOfNthMonth(2)).toEqual(new Date('2024-05-31T00:00+02:00'))
    })

    test('handles february in a leap year', () => {
      vi.setSystemTime(new Date('2024-01-15T00:00+01:00'))
      expect(getLastDayOfNthMonth(1)).toEqual(new Date('2024-02-29T00:00+01:00'))
    })

    test('handles february in a non-leap year', () => {
      vi.setSystemTime(new Date('2023-01-15T00:00+01:00'))
      expect(getLastDayOfNthMonth(1)).toEqual(new Date('2023-02-28T00:00+01:00'))
    })

    test('rolls over to next year when month exceeds december', () => {
      vi.setSystemTime(new Date('2024-12-15T00:00+01:00'))
      expect(getLastDayOfNthMonth(2)).toEqual(new Date('2025-02-28T00:00+01:00'))
    })
  })

  describe('getDateOnlyAsString', () => {
    test('returns empty string when date is undefined', () => {
      expect(getDateOnlyAsString(undefined)).toBe('')
    })

    test('formats a local date as YYYY-MM-DD', () => {
      const date = new Date('2026-05-11T00:00:00Z')
      expect(getDateOnlyAsString(date)).toBe('2026-05-11')
    })
  })

  describe('parsePublishDateWithTime', () => {
    test('returns empty string when publishTime is undefined', () => {
      expect(parsePublishDateWithTime(undefined)).toBe('')
    })

    test('sets the local publish time to 08:00 (summer time)', () => {
      const originalDate = new Date('2026-05-11T00:00:00Z')
      const result = parsePublishDateWithTime(originalDate)
      expect(result).toStrictEqual('2026-05-11T06:00:00.000Z')
    })

    test('sets the local publish time to 08:00 (winter time)', () => {
      const originalDate = new Date('2026-10-26T00:00:00Z')
      const result = parsePublishDateWithTime(originalDate)
      expect(result).toStrictEqual('2026-10-26T07:00:00.000Z')
    })
  })
})
