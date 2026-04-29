import { vi, beforeEach, describe, test, expect } from 'vitest'
import { createBlockedReleaseDay } from '@/services/calendarService'
import { dateToISOString } from '@/lib/utils'

const { isDateBlockedMock } = vi.hoisted(() => ({
  isDateBlockedMock: vi.fn(async () => false),
}))

vi.mock(import('@/lib/blockedDates'), async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/blockedDates')>()
  return {
    ...original,
    isDateBlocked: isDateBlockedMock,
  }
})

// Uncomment next line to run tests locally with UTC timezone (same as nais cluster)
// process.env.TZ = 'UTC'

let prismaMock: any
let listReturn: object

function setListReturn(next: { comment: string; day: Date }[]) {
  listReturn = next
}

describe('calendarService  ', () => {
  beforeEach(() => {
    prismaMock = {
      calender_date: {
        create: vi.fn((args) => Promise.resolve({ ...args, id: 0 })),
        findMany: vi.fn(() => Promise.resolve(listReturn)),
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
    //TODO MIM-2662: Add unit tests
    test(expect(true).toBeTruthy)
  })
})

// MOCKS

const calendar_date_result = [
  {
    blocked_comment: 'Julaften',
    date: dateToISOString(new Date('2026-12-24T00:00:00')),
  },
  {
    blocked_comment: 'Nyttårsaften',
    date: dateToISOString(new Date('2026-12-31T00:00:00')),
  },
]

const calendar_date_prisma_list = [
  {
    comment: 'Julaften',
    day: new Date('2026-12-24T00:00:00'),
  },
  {
    comment: 'Nyttårsaften',
    day: new Date('2026-12-31T00:00:00'),
  },
]
