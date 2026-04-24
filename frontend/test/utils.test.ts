import { describe, it, expect } from 'vitest'
import { formatPublishTime, formatDate } from '../src/lib/utils'

describe('utils', () => {
  describe('formatPublishTime', () => {
    it('returns "-" when publishTime is undefined', () => {
      const result = formatPublishTime(undefined)

      expect(result).toBe('-')
    })

    it('formats ISO datetime correctly in nb-NO locale', () => {
      const iso = '2024-01-15T10:30:00Z'

      const result = formatPublishTime(iso)

      expect(result).toBe('15.01.2024 kl 11:30')
    })

    it('formats single-digit day and month with leading zeros', () => {
      const iso = '2024-03-04T08:05:00Z'

      const result = formatPublishTime(iso)

      expect(result).toBe('04.03.2024 kl 09:05')
    })
  })

  describe('formatDate', () => {
    it('returns an empty string when input is undefined', () => {
      const result = formatPublishTime(undefined)

      expect(result).toBe('-')
    })

    it('formats ISO date correctly in nb-NO locale', () => {
      const iso = '2024-06-01T00:00:00Z'

      const result = formatDate(iso)

      expect(result).toBe('01.06.2024')
    })

    it('formats single-digit day and month with leading zeros', () => {
      const iso = '2024-02-03T12:00:00Z'

      const result = formatDate(iso)

      expect(result).toBe('03.02.2024')
    })
  })
})
