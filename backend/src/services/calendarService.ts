import { isDateBlocked } from '@/lib/blockedDates'
import type { ExtendedPrismaClient } from '@/lib/prisma'
import { dateToISOString, sanitize, parseDateOnly, ensureRequiredFieldsExists } from '@/lib/utils'
import type { BlockedReleaseDate, CalenderDate } from '@ssbno-statreg/shared'

export type CalendarDatePrisma = Pick<ExtendedPrismaClient, 'calender_date' | 'release'>

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

export async function getDateStatusForRange(
  prisma: CalendarDatePrisma,
  fromDate?: string | string[],
  toDate?: string | string[]
): Promise<CalenderDate> {
  let from: Date
  let to: Date

  if (fromDate) {
    from = parseDateOnly(fromDate)
  } else {
    from = new Date()
    from.setDate(1)
  }
  from.setHours(0, 0, 0, 0)

  if (toDate) {
    to = parseDateOnly(toDate)
  } else {
    to = new Date()
    to.setMonth(to.getMonth() + 3, 0)
  }
  to.setHours(23, 59, 59, 999)

  if (to < from) return Promise.reject({ status: 400, statregError: 'todate have to be after fromDate' })

  const releasesInTimerange = await prisma.release.findMany({
    where: { publish_time: { gt: from, lte: to } },
    select: {
      publish_time: true,
    },
  })

  const releaseCountsPerDate: Record<string, number> = {}

  for (const release of releasesInTimerange) {
    const date = release.publish_time.toISOString().slice(0, 10) // YYYY-MM-DD
    releaseCountsPerDate[date] = (releaseCountsPerDate[date] || 0) + 1
  }

  const result: { [key: string]: { status: string } } = {}

  //TODO MIM-2661: Look at this code. Refactoring? Separate function?
  const d = new Date(from)
  while (d <= to) {
    const key = d.toISOString().slice(0, 10)
    result[key] = { status: await getStatus(new Date(key), releaseCountsPerDate[key]) }
    d.setDate(d.getDate() + 1)
  }

  return Promise.resolve(result)
}

// TODO MIM-2661: Get all blocked days in one call instead of checking one at a time?
// TODO MIM-2661: Move statuses to shared
async function getStatus(date: Date, noOfReleases?: number): Promise<string> {
  const isBlocked = await isDateBlocked(date)
  if (isBlocked) return 'blocked'
  if (!noOfReleases) return 'free'
  if (noOfReleases === 1) return 'few'
  if (noOfReleases <= 3) return 'many'
  return 'full'
}
