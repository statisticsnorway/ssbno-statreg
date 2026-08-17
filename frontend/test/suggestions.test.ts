import { describe, expect, test } from 'vitest'
import { type ReleaseListing } from '@ssbno-statreg/shared'
import {
  addDays,
  addMonths,
  addYears,
  getDaysBetween,
  getEasterSunday,
  getLastDayOfMonth,
  getNextRelease,
  isPublicHoliday,
  isWeekend,
  rollBackToWorkingDay,
  suggestNextRelease,
} from '../src/lib/suggestions'

function release(overrides: Partial<ReleaseListing> = {}): ReleaseListing {
  return {
    publish_time: '2024-01-15T09:00:00+01:00',
    period_from: '2024-01-01',
    period_to: '2024-01-31',
    frequency: { code: 'M' },
    ...overrides,
  }
}

describe('date helpers', () => {
  test('adds years, months, and days without mutating the input date', () => {
    const input = new Date('2024-01-15T09:00:00+01:00')

    expect(addYears(input, 1)).toEqual(new Date('2025-01-15T09:00:00+01:00'))
    expect(addMonths(input, 2)).toEqual(new Date('2024-03-15T09:00:00+01:00'))
    expect(addDays(input, 7)).toEqual(new Date('2024-01-22T09:00:00+01:00'))
    expect(input).toEqual(new Date('2024-01-15T09:00:00+01:00'))
  })

  test('calculates whole days between dates', () => {
    expect(getDaysBetween(new Date('2024-01-01'), new Date('2024-01-31'))).toBe(30)
    expect(getDaysBetween(new Date('2024-01-31'), new Date('2024-01-01'))).toBe(-30)
  })

  test.each([
    ['2024-01-15', '2024-01-31T00:00:00+01:00'],
    ['2024-02-15', '2024-02-29T00:00:00+01:00'],
    ['2024-12-01', '2024-12-31T00:00:00+01:00'],
  ])('returns the last day of the month for %s', (input, expected) => {
    expect(getLastDayOfMonth(new Date(input))).toEqual(new Date(expected))
  })

  test.each([
    ['2024-03-31', true],
    ['2024-03-30', true],
    ['2024-04-01', false],
  ])('identifies weekends for %s', (input, expected) => {
    expect(isWeekend(new Date(input))).toBe(expected)
  })

  test.each([
    [2024, '2024-03-31'],
    [2025, '2025-04-20'],
  ])('calculates Easter Sunday for %s', (year, expected) => {
    expect(getEasterSunday(year)).toEqual(new Date(`${expected}T00:00:00.000Z`))
  })

  test.each([
    '2024-01-01',
    '2024-05-01',
    '2024-05-17',
    '2024-12-25',
    '2024-12-26',
    '2024-03-28',
    '2024-03-29',
    '2024-03-31',
    '2024-04-01',
  ])('identifies public holidays for %s', (date) => {
    expect(isPublicHoliday(new Date(date))).toBe(true)
  })

  test('does not identify ordinary working days as weekends or holidays', () => {
    const date = new Date('2024-06-03')

    expect(isWeekend(date)).toBe(false)
    expect(isPublicHoliday(date)).toBe(false)
  })

  test('rolls weekends and holidays back to the previous working day without mutation', () => {
    const input = new Date('2024-03-31T09:00:00+02:00')

    expect(rollBackToWorkingDay(input)).toEqual(new Date('2024-03-27T08:00:00+01:00'))
    expect(input).toEqual(new Date('2024-03-31T09:00:00+02:00'))
  })
})

describe('getNextRelease', () => {
  test('returns undefined when a required release date is missing', () => {
    expect(getNextRelease(release({ publish_time: undefined }))).toBeUndefined()
    expect(getNextRelease(release({ period_from: undefined }))).toBeUndefined()
    expect(getNextRelease(release({ period_to: undefined }))).toBeUndefined()
  })
})

describe('suggestNextRelease', () => {
  test('returns undefined when there are no releases', () => {
    expect(suggestNextRelease(undefined)).toBeUndefined()
  })

  test('returns undefined when the latest release lacks required dates', () => {
    expect(suggestNextRelease(release({ period_to: undefined }))).toBeUndefined()
  })

  test('uses the latest published release and ignores unpublished releases', () => {
    const result = suggestNextRelease(release({ publish_time: '2024-02-15T09:00:00+01:00', frequency: { code: 'W' } }))

    expect(result).toEqual({
      publishTime: new Date('2024-02-22T09:00:00+01:00'),
      periodFrom: new Date('2024-01-08'),
      periodTo: new Date('2024-02-07'),
    })
  })

  test.each([
    ['Y', '2025-01-15T09:00:00+01:00', '2025-01-01', '2025-01-31'],
    ['a', '2025-01-15T09:00:00+01:00', '2025-01-01', '2025-01-31'],
  ])('adds one year for %s frequency', (frequencyCode, publishTime, periodFrom, periodTo) => {
    expect(
      suggestNextRelease(release({ frequency: { code: frequencyCode }, publish_time: '2024-01-15T09:00:00+01:00' }))
    ).toEqual({
      publishTime: new Date(publishTime),
      periodFrom: new Date(periodFrom),
      periodTo: new Date(periodTo),
    })
  })

  test('adds three months and uses the end of the fifth following month for quarterly frequency', () => {
    expect(
      suggestNextRelease(release({ frequency: { code: 'K' }, period_from: '2024-01-15', period_to: '2024-01-31' }))
    ).toEqual({
      publishTime: new Date('2024-04-15T09:00:00+02:00'),
      periodFrom: new Date('2024-04-15T00:00:00+01:00'),
      periodTo: new Date('2024-06-30T00:00:00+02:00'),
    })
  })

  test('adds one month and ends the suggested monthly period at month end', () => {
    expect(suggestNextRelease(release({ frequency: { code: 'M' }, period_from: '2024-01-15' }))).toEqual({
      publishTime: new Date('2024-02-15T09:00:00+01:00'),
      periodFrom: new Date('2024-02-15'),
      periodTo: new Date('2024-02-29T00:00:00+01:00'),
    })
  })

  test('adds two months and ends the suggested two-month period at month end', () => {
    expect(suggestNextRelease(release({ frequency: { code: 'T' }, period_from: '2024-01-15' }))).toEqual({
      publishTime: new Date('2024-03-15T09:00:00+01:00'),
      periodFrom: new Date('2024-03-15'),
      periodTo: new Date('2024-04-30T00:00:00+02:00'),
    })
  })

  test.each(['W', 'u'])('adds one week for %s frequency', (frequencyCode) => {
    expect(suggestNextRelease(release({ frequency: { code: frequencyCode } }))).toEqual({
      publishTime: new Date('2024-01-22T09:00:00+01:00'),
      periodFrom: new Date('2024-01-08'),
      periodTo: new Date('2024-02-07'),
    })
  })

  test('uses the period duration for an unknown or missing frequency', () => {
    const expected = {
      publishTime: new Date('2024-02-14T09:00:00+01:00'),
      periodFrom: new Date('2024-02-01'),
      periodTo: new Date('2024-03-01'),
    }

    expect(suggestNextRelease(release({ frequency: { code: 'D' } }))).toEqual(expected)
    expect(suggestNextRelease(release({ frequency: undefined }))).toEqual(expected)
  })

  test('rolls a weekend publish date back to the preceding working day', () => {
    const result = suggestNextRelease(release({ frequency: { code: 'W' }, publish_time: '2024-01-13T09:00:00+01:00' }))

    expect(result?.publishTime).toEqual(new Date('2024-01-19T09:00:00+01:00'))
  })

  test('rolls a public holiday back over consecutive holidays', () => {
    const result = suggestNextRelease(release({ frequency: { code: 'M' }, publish_time: '2024-11-25T09:00:00+01:00' }))

    expect(result?.publishTime).toEqual(new Date('2024-12-24T09:00:00+01:00'))
  })

  test('rolls Easter Sunday back over the Easter holidays', () => {
    const result = suggestNextRelease(release({ frequency: { code: 'M' }, publish_time: '2024-02-29T09:00:00+01:00' }))

    expect(result?.publishTime).toEqual(new Date('2024-03-27T09:00:00+01:00'))
  })
})
