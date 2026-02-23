import { PrismaClient } from '@/generated/prisma/client'
import { dateToISOString } from '@/lib/utils'
import { BlockedReleaseDate } from '@/types'

export type CalendarDatePrisma = Pick<PrismaClient, 'calender_date'>

export async function createBlockedReleaseDay(
  dateString: string,
  blocked_comment: string,
  prisma: CalendarDatePrisma
): Promise<BlockedReleaseDate[]> {
  //TODO: Confirm correct date format. See JIRA issue MIM-2546
  const date = new Date(dateString)
  await prisma.calender_date.create({
    data: {
      version: 0,
      comment: blocked_comment,
      day: date,
    },
  })

  const blockedDays = await prisma.calender_date.findMany({ select: { comment: true, day: true } })

  return blockedDays.map((blockedDay) => ({
    blocked_comment: blockedDay.comment,
    date: dateToISOString(blockedDay.day),
  }))
}
