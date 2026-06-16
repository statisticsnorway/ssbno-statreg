import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatPublishTime,
  formatDate,
  getFirstDayOfNthMonth,
  getDateOnlyAsString,
  parsePublishDateWithTime,
  formatRevisionName,
  formatVariant,
  formatContact,
  getPublishTimeFilterForDate,
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

  describe('getDateOnlyAsString', () => {
    test('returns empty string when date is undefined', () => {
      expect(getDateOnlyAsString(undefined)).toBe('')
    })

    test('formats a local date as YYYY-MM-DD', () => {
      const date = new Date('2026-05-11T00:00:00Z')
      expect(getDateOnlyAsString(date)).toBe('2026-05-11')
    })

    test('formats local date with time 00:00', () => {
      const date = new Date('2026-05-11T00:00:00+02:00')
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

    test('replaces the local publish time (12:30) with 08:00', () => {
      vi.setSystemTime(new Date('2024-01-15T12:30+01:00'))
      const result = parsePublishDateWithTime(new Date('2024-01-15T12:30+01:00'))
      expect(result).toStrictEqual('2024-01-15T07:00:00.000Z')
    })

    test('sets the local publish time to 08:00 (winter time)', () => {
      const originalDate = new Date('2026-10-26T00:00:00Z')
      const result = parsePublishDateWithTime(originalDate)
      expect(result).toStrictEqual('2026-10-26T07:00:00.000Z')
    })
  })

  describe('formatRevisionName', () => {
    test('returns the correct revision name if valid', () => {
      expect(formatRevisionName('F')).toBe('Foreløpige')
    })

    test('returns "-" if revision is undefined', () => {
      expect(formatRevisionName(undefined)).toBe('-')
    })

    test('returns "-" if revision is not in RevisionNames', () => {
      expect(formatRevisionName('X')).toBe('-')
    })
  })

  describe('formatVariant', () => {
    test('formats frequency and revision correctly', () => {
      const variant = {
        frequency: { name: 'Måned' },
        revision: { code: 'I' },
      }

      expect(formatVariant(variant)).toBe('Måned, ingen')
    })

    test('handles missing frequency', () => {
      const variant = {
        revision: { code: 'B' },
      }

      expect(formatVariant(variant)).toBe('-, beregnede')
    })

    test('handles missing revision', () => {
      const variant = {
        frequency: { name: 'År' },
      }

      expect(formatVariant(variant)).toBe('År, -')
    })

    test('returns default values when variant is undefined', () => {
      expect(formatVariant(undefined)).toBe('-, -')
    })

    test('handles invalid revision code', () => {
      const variant = {
        frequency: { name: 'Kvartal' },
        revision: { code: 'X' },
      }

      expect(formatVariant(variant)).toBe('Kvartal, -')
    })
  })

  describe('formatContact', () => {
    test('formats contact with name and username', () => {
      const contact = { name: 'Ola Nordmann', username: 'ola', email: 'ola@example.com' }
      expect(formatContact(contact)).toBe('Ola Nordmann (ola)')
    })

    test('formats contact with name, email and no username', () => {
      const contact = { name: 'Kari Nordmann', email: 'kari.nordmann@example.com' }
      expect(formatContact(contact)).toBe('Kari Nordmann (kari.nordmann)')
    })
    test('formats contact without username or email', () => {
      const contact = { name: 'Ola Nordmann' }
      expect(formatContact(contact)).toBe('Ola Nordmann')
    })
    test('formats contact without name', () => {
      const contact = { username: 'abc' }
      expect(formatContact(contact)).toBe('(abc)')
    })
    test('formats contact without username, email, or name', () => {
      expect(formatContact(undefined)).toBe('-')
    })
  })

  describe('getPublishTimeFilterForDate', () => {
    test('returns empty object when selectedDate is undefined', () => {
      const result = getPublishTimeFilterForDate(undefined)
      expect(result).toEqual({})
    })

    test('returns correct ISO range for a fixed date string', () => {
      const input = new Date('2024-05-15')

      const result = getPublishTimeFilterForDate(input)

      expect(result).toEqual({
        publish_time_after: new Date('2024-05-15T00:00:00').toISOString(),
        publish_time_before: new Date('2024-05-15T23:59:59.999').toISOString(),
      })
    })

    test('sets time to start and end of day', () => {
      const input = new Date('2024-01-01T18:45:30')

      const result = getPublishTimeFilterForDate(input)

      expect(result).toEqual({
        publish_time_after: new Date('2024-01-01T00:00:00').toISOString(),
        publish_time_before: new Date('2024-01-01T23:59:59.999').toISOString(),
      })
    })

    test('does not mutate the original date', () => {
      const input = new Date('2024-07-10T12:00:00')
      const originalTime = input.getTime()

      getPublishTimeFilterForDate(input)

      expect(input.getTime()).toBe(originalTime)
    })
  })
})
