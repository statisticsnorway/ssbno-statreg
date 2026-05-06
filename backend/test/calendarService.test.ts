import { vi, beforeEach, describe, test, expect, afterEach } from 'vitest'
import {
  createBlockedReleaseDay,
  getDateStatusForRange,
  getReleaseCountByDate,
  getStatus,
} from '@/services/calendarService'

const { isDateBlockedMock, getBlockedDatesInPeriodMock } = vi.hoisted(() => ({
  isDateBlockedMock: vi.fn(async () => false),
  getBlockedDatesInPeriodMock: vi.fn(async () => Promise.resolve({})),
}))

vi.mock(import('@/lib/blockedDates'), async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/blockedDates')>()
  return {
    ...original,
    getBlockedDatesInPeriod: getBlockedDatesInPeriodMock,
    isDateBlocked: isDateBlockedMock,
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prismaMock: any
let listReturn: object

function setListReturn(next: { comment: string; day: Date }[]) {
  listReturn = next
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('calendarService  ', () => {
  beforeEach(() => {
    prismaMock = {
      calender_date: {
        create: vi.fn((args) => Promise.resolve({ ...args, id: 0 })),
        findMany: vi.fn(() => Promise.resolve(listReturn)),
      },
      release: {
        findMany: vi.fn(() => Promise.resolve([])),
      },
    }
  })

  describe('createBlockedReleaseDay() ', () => {
    test('creates a blocked release day and returns mapped results', async () => {
      const inputDate = '2026-12-24'
      const inputComment = { blocked_comment: 'Julaften' }
      setListReturn(calendar_date_prisma_list)

      const result = await createBlockedReleaseDay(prismaMock, inputDate, inputComment)

      expect(prismaMock.calender_date.findMany).toHaveBeenCalledOnce()
      expect(prismaMock.calender_date.create).toHaveBeenCalledExactlyOnceWith({
        data: {
          comment: inputComment.blocked_comment,
          day: new Date(inputDate),
        },
      })
      expect(result).toStrictEqual(calendar_date_result)
    })

    test('returns 400 if date already blocked (unique constraint violation)', async () => {
      const inputDate = '2026-12-24'
      const inputComment = { blocked_comment: 'Julaften' }
      isDateBlockedMock.mockResolvedValueOnce(true)

      await expect(() => createBlockedReleaseDay(prismaMock, inputDate, inputComment)).rejects.toMatchObject({
        statregError: 'Date is already blocked, either manually, weekend or public holiday',
      })
      expect(prismaMock.calender_date.create).toHaveBeenCalledTimes(0)
      expect(prismaMock.calender_date.findMany).toHaveBeenCalledTimes(0)
    })

    test('returns 400 if blocked comment is "" ', async () => {
      const inputDate = '2026-12-24'
      const inputComment = { blocked_comment: '' }

      await expect(() => createBlockedReleaseDay(prismaMock, inputDate, inputComment)).rejects.toMatchObject({
        statregError: `Field 'blocked_comment' must be a non-empty string.`,
      })
      expect(prismaMock.calender_date.create).toHaveBeenCalledTimes(0)
      expect(prismaMock.calender_date.findMany).toHaveBeenCalledTimes(0)
    })

    test('returns 400 if body have no blocked_comment property', async () => {
      const inputDate = '2026-12-24'
      const inputComment = {}

      await expect(() => createBlockedReleaseDay(prismaMock, inputDate, inputComment)).rejects.toMatchObject({
        statregError: 'Missing required field(s): blocked_comment',
      })
      expect(prismaMock.calender_date.create).toHaveBeenCalledTimes(0)
      expect(prismaMock.calender_date.findMany).toHaveBeenCalledTimes(0)
    })
  })
  describe('getDateStatusForRange() ', () => {
    test('works for a single-day range', async () => {
      const result = await getDateStatusForRange(prismaMock, '2024-06-15', '2024-06-15')
      expect(result).toStrictEqual({ '2024-06-15': { status: 'NONE' } })
    })

    test('uses blocked date data when a date is blocked', async () => {
      getBlockedDatesInPeriodMock.mockResolvedValueOnce({ '2024-06-02': { status: 'BLOCKED' } })
      const result = await getDateStatusForRange(prismaMock, '2024-06-01', '2024-06-02')
      expect(result).toStrictEqual({ '2024-06-01': { status: 'NONE' }, '2024-06-02': { status: 'BLOCKED' } })
    })

    test('returns a result entry for every date in the range (inclusive)', async () => {
      getBlockedDatesInPeriodMock.mockResolvedValueOnce({ '2024-06-02': { status: 'BLOCKED' } })
      prismaMock.release.findMany.mockResolvedValueOnce([
        { publish_time: new Date('2024-06-01T08:00Z') },
        { publish_time: new Date('2024-06-05T08:00Z') },
        { publish_time: new Date('2024-06-05T08:00Z') },
      ])
      const result = await getDateStatusForRange(prismaMock, '2024-06-01', '2024-06-05')
      expect(result).toStrictEqual({
        '2024-06-01': { status: 'FEW' },
        '2024-06-02': { status: 'BLOCKED' },
        '2024-06-03': { status: 'NONE' },
        '2024-06-04': { status: 'NONE' },
        '2024-06-05': { status: 'MANY' },
      })
    })

    test('throws a 400 error when toDate is before fromDate', async () => {
      await expect(getDateStatusForRange(prismaMock, '2024-06-10', '2024-06-01')).rejects.toMatchObject({
        status: 400,
      })
    })

    test('defaults fromDate to the 1st of the current month when omitted', async () => {
      vi.setSystemTime(new Date('2024-03-15T00:00+01:00'))
      await getDateStatusForRange(prismaMock, undefined, '2099-12-31')

      expect(prismaMock.release.findMany).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          where: {
            publish_time: { gt: new Date('2024-03-01T00:00:00.000Z'), lte: new Date('2099-12-31T23:59:59.999Z') },
          },
        })
      )
    })

    test('defaults toDate to 3 months ahead when omitted', async () => {
      vi.setSystemTime(new Date('2024-03-15T00:00+01:00'))
      await getDateStatusForRange(prismaMock, '2000-01-01', undefined)

      expect(prismaMock.release.findMany).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          where: {
            publish_time: { gt: new Date('2000-01-01T00:00:00.000Z'), lte: new Date('2024-05-31T23:59:59.999Z') },
          },
        })
      )
    })
  })

  describe('getStatus', () => {
    test('returns NONE when called with no argument', () => {
      expect(getStatus()).toBe('NONE')
    })

    test('returns NONE when called with 0', () => {
      expect(getStatus(0)).toBe('NONE')
    })

    test('returns FEW when called with exactly 1', () => {
      expect(getStatus(1)).toBe('FEW')
    })

    test('returns MANY when called with 2', () => {
      expect(getStatus(2)).toBe('MANY')
    })

    test('returns MANY when called with exactly 3', () => {
      expect(getStatus(3)).toBe('MANY')
    })

    test('returns FULL when called with 4', () => {
      expect(getStatus(4)).toBe('FULL')
    })

    test('returns FULL when called with a large number', () => {
      expect(getStatus(100)).toBe('FULL')
    })
  })

  describe('getReleaseCountByDate', () => {
    test('returns an empty object for an empty input array', () => {
      expect(getReleaseCountByDate([])).toEqual({})
    })

    test('counts a single release correctly', () => {
      const result = getReleaseCountByDate([{ publish_time: new Date('2024-06-01T10:00:00Z') }])
      expect(result).toStrictEqual({
        '2024-06-01': 1,
      })
    })

    test('counts multiple releases on the same date', () => {
      const result = getReleaseCountByDate([
        { publish_time: new Date('2024-06-01T08:00:00Z') },
        { publish_time: new Date('2024-06-01T12:00:00Z') },
        { publish_time: new Date('2024-06-01T18:00:00Z') },
      ])
      expect(result).toStrictEqual({
        '2024-06-01': 3,
      })
    })

    test('counts releases across different dates independently', () => {
      const result = getReleaseCountByDate([
        { publish_time: new Date('2024-06-01T10:00:00Z') },
        { publish_time: new Date('2024-06-02T10:00:00Z') },
        { publish_time: new Date('2024-06-02T14:00:00Z') },
      ])
      expect(result).toStrictEqual({
        '2024-06-01': 1,
        '2024-06-02': 2,
      })
    })
  })
})

// MOCKS

const calendar_date_result = [
  {
    blocked_comment: 'Julaften',
    date: '2026-12-24T00:00:00.000Z',
  },
  {
    blocked_comment: 'Nyttårsaften',
    date: '2026-12-31T00:00:00.000Z',
  },
]

const calendar_date_prisma_list = [
  {
    comment: 'Julaften',
    day: new Date('2026-12-24T00:00Z'),
  },
  {
    comment: 'Nyttårsaften',
    day: new Date('2026-12-31T00:00Z'),
  },
]
