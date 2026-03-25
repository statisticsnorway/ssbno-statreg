import { beforeEach, describe, test, mock } from 'node:test'
import assert from 'node:assert'
import { createBlockedReleaseDay } from '@/services/calendarService'
import { dateToISOString } from '@/lib/utils'

// Uncomment next line to run tests locally with UTC timezone (same as nais cluster)
// process.env.TZ = 'UTC'

let prismaMock: any
let listReturn: object

function setListReturn(next: { comment: string; day: Date }[]) {
  listReturn = next
}

describe('calendarService  ', () => {
  describe('createBlockedReleaseDay() ', () => {
    beforeEach(() => {
      prismaMock = {
        calender_date: {
          create: mock.fn((args) => Promise.resolve({ ...args, id: 0 })),
          findMany: mock.fn(() => Promise.resolve(listReturn)),
        },
      }
    })

    test('creates a blocked release day and returns mapped results', async () => {
      const inputDate = '2026-12-24'
      const inputComment = { blocked_comment: 'Julaften' }
      setListReturn(calendar_date_prisma_list)

      const result = await createBlockedReleaseDay(prismaMock, inputDate, inputComment)

      assert.strictEqual(prismaMock.calender_date.create.mock.callCount(), 1)
      assert.deepStrictEqual(prismaMock.calender_date.create.mock.calls[0].arguments[0], {
        data: {
          comment: inputComment.blocked_comment,
          day: new Date(inputDate),
        },
      })
      assert.deepStrictEqual(result, calendar_date_result)
    })

    test('returns 400 if date already blocked (unique constraint violation)', async () => {
      const inputDate = '2026-12-24'
      const inputComment = { blocked_comment: 'Julaften' }
      prismaMock = {
        calender_date: {
          create: mock.fn(() =>
            Promise.reject({
              name: 'PrismaClientKnownRequestError',
              code: 'P2002',
              message: 'Unique constraint failed on the fields: (`day`)',
            })
          ),
          findMany: mock.fn(() => Promise.resolve([])),
        },
      }

      await assert.rejects(() => createBlockedReleaseDay(prismaMock, inputDate, inputComment), {
        message: 'Unique constraint failed on the fields: (`day`)',
        code: 'P2002',
      })
      assert.strictEqual(prismaMock.calender_date.create.mock.callCount(), 1)
      assert.strictEqual(prismaMock.calender_date.findMany.mock.callCount(), 0)
    })

    test('returns 400 if blocked comment is "" ', async () => {
      const inputDate = '2026-12-24'
      const inputComment = { blocked_comment: '' }

      await assert.rejects(() => createBlockedReleaseDay(prismaMock, inputDate, inputComment), {
        statregError: 'Invalid body',
      })
      assert.strictEqual(prismaMock.calender_date.create.mock.callCount(), 0)
      assert.strictEqual(prismaMock.calender_date.findMany.mock.callCount(), 0)
    })

    test('returns 400 if body have no blocked_comment property', async () => {
      const inputDate = '2026-12-24'
      const inputComment = {}

      await assert.rejects(() => createBlockedReleaseDay(prismaMock, inputDate, inputComment), {
        statregError: 'Invalid body',
      })
      assert.strictEqual(prismaMock.calender_date.create.mock.callCount(), 0)
      assert.strictEqual(prismaMock.calender_date.findMany.mock.callCount(), 0)
    })
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
