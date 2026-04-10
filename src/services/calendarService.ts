import { isDateBlocked } from '@/lib/blockedDays'
import type { ExtendedPrismaClient } from '@/lib/prisma'
import { dateToISOString, sanitize, validateDateOnly } from '@/lib/utils'
import type { BlockedReleaseDate } from '@/types'

export type CalendarDatePrisma = Pick<ExtendedPrismaClient, 'calender_date'>

export async function createBlockedReleaseDay(
  prisma: CalendarDatePrisma,
  dateString?: string | string[],
  body?: { blocked_comment?: string }
): Promise<BlockedReleaseDate[]> {
  if (!body?.blocked_comment) return Promise.reject({ statregError: 'Invalid body' })
  const comment = sanitize(body!.blocked_comment!)
  const date = validateDateOnly(dateString)
  const isAlreadyBlocked = await isDateBlocked(date)
  if (isAlreadyBlocked) {
    return Promise.reject({
      status: 400,
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
