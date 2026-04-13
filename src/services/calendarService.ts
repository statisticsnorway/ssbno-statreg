import { isDateBlocked } from '@/lib/blockedDays'
import type { ExtendedPrismaClient } from '@/lib/prisma'
import { dateToISOString, sanitize, parseDateOnly, ensureRequiredFieldsExists } from '@/lib/utils'
import type { BlockedReleaseDate } from '@/types'

export type CalendarDatePrisma = Pick<ExtendedPrismaClient, 'calender_date'>

export async function createBlockedReleaseDay(
  prisma: CalendarDatePrisma,
  dateString?: string | string[],
  body?: { blocked_comment?: string }
): Promise<BlockedReleaseDate[]> {
  const date = parseDateOnly(dateString)
  const { blocked_comment } = ensureRequiredFieldsExists(body, ['blocked_comment'])
  const comment = sanitize(blocked_comment)
  if (!comment) {
    return Promise.reject({ statregError: `Field 'blocked_comment' must be a non-empty string.` })
  }

  const isAlreadyBlocked = await isDateBlocked(date)
  if (isAlreadyBlocked) {
    return Promise.reject({
      statregError: 'Date is already blocked, either manually, weekend or public holiday',
    })
  }

  await prisma.calender_date.create({
    data: {
      comment,
      day: date,
    },
  })

  const blockedDays = await prisma.calender_date.findMany({
    where: {
      day: {
        gt: new Date(),
      },
    },
    select: { comment: true, day: true },
  })

  return blockedDays.map((blockedDay) => ({
    blocked_comment: blockedDay.comment,
    date: dateToISOString(blockedDay.day),
  }))
}
