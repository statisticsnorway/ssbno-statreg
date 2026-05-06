import { getBlockedDatesInPeriod, isDateBlocked } from '@/lib/blockedDates'
import type { ExtendedPrismaClient } from '@/lib/prisma'
import { sanitize, parseDateOnly, ensureRequiredFieldsExists, getDateOnlyAsString } from '@/lib/utils'
import { type BlockedReleaseDate, type CalenderDate, DayStatus } from '@ssbno-statreg/shared'

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

  const isAlreadyBlocked = await isDateBlocked(dateString as string, prisma)
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
    date: getDateOnlyAsString(blockedDay.day),
  }))
}

export async function getDateStatusForRange(
  prisma: CalendarDatePrisma,
  fromDate?: string,
  toDate?: string
): Promise<CalenderDate> {
  let from: Date
  let to: Date

  if (fromDate) {
    from = parseDateOnly(fromDate)
  } else {
    from = new Date()
    from.setUTCDate(1)
  }
  from.setUTCHours(0, 0, 0, 0)

  if (toDate) {
    to = parseDateOnly(toDate)
  } else {
    to = new Date()
    to.setUTCMonth(to.getUTCMonth() + 3, 0)
  }
  to.setUTCHours(23, 59, 59, 999)

  if (to < from) throw { status: 400, statregError: 'todate have to be after fromDate' }

  const releasesInTimerange = await prisma.release.findMany({
    where: { publish_time: { gt: from, lte: to } },
    select: {
      publish_time: true,
    },
  })

  const releaseCountsPerDate = getReleaseCountByDate(releasesInTimerange)

  const result: CalenderDate = {}
  const blockedDates = await getBlockedDatesInPeriod(from, to, prisma)

  const d = new Date(from)
  while (d <= to) {
    const key = getDateOnlyAsString(d)
    if (blockedDates[key]) {
      result[key] = blockedDates[key]
    } else {
      result[key] = { status: getStatus(releaseCountsPerDate[key]) }
    }
    d.setDate(d.getDate() + 1)
  }

  return result
}

function getStatus(noOfReleases?: number): keyof typeof DayStatus {
  if (!noOfReleases) return 'NONE'
  if (noOfReleases === 1) return 'FEW'
  if (noOfReleases <= 3) return 'MANY'
  return 'FULL'
}

function getReleaseCountByDate(
  releasesInTimerange: {
    publish_time: Date
  }[]
): Record<string, number> {
  const releaseCountsPerDate: Record<string, number> = {}

  for (const release of releasesInTimerange) {
    const date = getDateOnlyAsString(release.publish_time)
    releaseCountsPerDate[date] = (releaseCountsPerDate[date] || 0) + 1
  }

  return releaseCountsPerDate
}
