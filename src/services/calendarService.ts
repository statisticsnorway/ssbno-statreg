import { PrismaClient } from '@/generated/prisma/client'
import { dateToISOString, sanitize } from '@/lib/utils'
import { BlockedReleaseDate } from '@/types'

export type CalendarDatePrisma = Pick<PrismaClient, 'calender_date'>

export async function createBlockedReleaseDay(
  prisma: CalendarDatePrisma,
  dateString?: string | string[],
  body?: { blocked_comment?: string }
): Promise<BlockedReleaseDate[]> {
  if (!body?.blocked_comment) return Promise.reject({ statregError: 'Invalid body' })
  const blocked_comment = sanitize(body!.blocked_comment!)

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateString || Array.isArray(dateString) || !dateRegex.test(dateString)) {
    return Promise.reject({ statregError: 'Invalid date format in query parameter' })
  }

  const date = new Date(dateString) //TODO: Confirm correct date format. See JIRA issue MIM-2546
  if (date.toString() === 'Invalid Date') {
    return Promise.reject({ statregError: 'Invalid date format in query parameter' })
  }

  await prisma.calender_date.create({
    data: {
      version: 0,
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
