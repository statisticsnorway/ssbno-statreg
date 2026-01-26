import { prisma } from '@/lib/prisma'

export async function createBlockedReleaseDay(
  dateString: string,
  blocked_comment: string
): Promise<{ blocked_comment: string; date: Date }[]> {
  const date = new Date(dateString)
  // Workaround to avoid 1 day diff since date is stored as date only in database and hence in UTC
  const UTCDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

  await prisma.calender_date.create({
    data: {
      version: 0,
      comment: blocked_comment,
      day: UTCDate,
    },
  })

  const blockedDays = await prisma.calender_date.findMany({ select: { comment: true, day: true } })

  // TODO: Implement chosen mapping strategy in MIM-2518
  return blockedDays.map((blockedDay) => ({ blocked_comment: blockedDay.comment, date: blockedDay.day }))
}
