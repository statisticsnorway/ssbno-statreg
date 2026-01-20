import { Calender_date } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export async function createBlockedReleaseDay(date: string, blocked_comment: string): Promise<Calender_date> {
  return prisma.calender_date.create({
    data: {
      id: 5,
      version: 0,
      comment: blocked_comment,
      day: new Date(date),
    },
  })
}
