import { ExtendedPrismaClient } from '@/lib/prisma'
import { dateToISOString, sanitize, validateAndParseDate } from '@/lib/utils'
import { BlockedReleaseDate } from '@/types'

export type CalendarDatePrisma = Pick<ExtendedPrismaClient, 'calender_date'>

export async function createBlockedReleaseDay(
  prisma: CalendarDatePrisma,
  dateString?: string | string[],
  body?: { blocked_comment?: string }
): Promise<BlockedReleaseDate[]> {
  if (!body?.blocked_comment) return Promise.reject({ statregError: 'Invalid body' })
  const blocked_comment = sanitize(body!.blocked_comment!)
  const date = validateAndParseDate(dateString)

  await prisma.calender_date.create({
    data: {
      comment: blocked_comment,
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
