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

export async function isManuallyBlockedDay(prisma: CalendarDatePrisma, day: Date): Promise<Boolean> {
  const manuallyBlockedDay = await prisma.calender_date.findUnique({
    where: { day },
  })
  return !!manuallyBlockedDay
}
