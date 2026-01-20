import { Calender_date } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export async function createBlockedReleaseDay(date: string, blocked_comment: string): Promise<Calender_date> {
  const highestId = (await prisma.calender_date.findFirst({ orderBy: { id: 'desc' } }))?.id
  const incrementId = Number(highestId) + 1
  return prisma.calender_date.create({
    data: {
      //TODO: Id should autoincrement
      id: incrementId,
      version: 0,
      comment: blocked_comment,
      day: new Date(date),
    },
  })
}
