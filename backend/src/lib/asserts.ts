import { CalendarDatePrisma } from '@/services/calendarService'
import { ReleasePrisma } from '@/services/releasesService'
import { StatisticPrisma } from '@/services/statisticsService'
import { FrequencyPrisma } from '@/services/frequenciesService'
import { parseDateOnly } from '@/lib/utils'
import { StatregError } from '@/lib/statregError'

export async function assertStatisticExists(shortname: string, prisma: ReleasePrisma | StatisticPrisma) {
  const exists = await prisma.statistic.findFirst({
    where: { shortname: { name: shortname } },
    select: { id: true },
  })

  if (!exists) {
    throw new StatregError(`Statistic '${shortname}' not found`, 404)
  }
}

export async function assertVariantExists(variantId: number, prisma: ReleasePrisma) {
  const exists = await prisma.variant.findUnique({
    where: { id: variantId },
    select: { id: true },
  })

  if (!exists) {
    throw new StatregError(`Variant '${variantId}' not found`, 404)
  }
}

export async function assertVariantMatchesShortname(variantId: number, shortname: string, prisma: ReleasePrisma) {
  const variant = await prisma.variant.findFirst({
    where: {
      id: variantId,
      statistic: {
        shortname: {
          name: shortname,
        },
      },
    },
    select: { id: true },
  })

  if (!variant) {
    throw new StatregError(`Variant does not belong to statistic '${shortname}'`, 404)
  }
}

export async function assertShortnameExists(shortname: string, prisma: StatisticPrisma): Promise<boolean> {
  const foundShortname = await prisma.shortname.findUnique({
    where: {
      name: shortname,
    },
  })

  if (!foundShortname) {
    throw new StatregError(`Shortname '${shortname}' does not exist`, 404)
  }

  return true
}

export async function assertFilteredShortnamesExist(
  shortname: string[],
  prisma: ReleasePrisma | StatisticPrisma
): Promise<boolean> {
  const shortnames = await prisma.shortname.findMany({
    where: {
      name: { in: shortname },
    },
    select: {
      name: true,
    },
  })

  const foundShortnames = shortnames.map((s) => s.name)
  const missingShortnames = shortname.filter((name) => !foundShortnames.includes(name))

  if (missingShortnames.length) {
    throw new StatregError(`Shortname(s) not found: ${missingShortnames.join(', ')}`, 404)
  }

  return true
}

export async function assertShortnameExistsAndIsAvailable(
  shortname: string,
  prisma: StatisticPrisma
): Promise<boolean> {
  const foundShortname = await prisma.shortname.findUnique({
    where: {
      name: shortname,
      statistic: null,
    },
  })

  if (!foundShortname) {
    throw new StatregError(`Shortname '${shortname}' is already in use`, 400)
  }

  return !!foundShortname
}

export async function assertDayNotManuallyBlocked(prisma: CalendarDatePrisma, dateString: string): Promise<boolean> {
  const day = parseDateOnly(dateString)
  const manuallyBlockedDay = await prisma.calender_date.findUnique({
    where: { day },
  })
  return !manuallyBlockedDay
}

function addThreeMonths(check: Date): Date {
  const date = new Date(check)
  const inThreeMonths = new Date(date.setMonth(date.getMonth() + 3))
  return inThreeMonths
}

export function assertReleaseDateIsMoreThanThreeMonthsAway(candiDate: Date): boolean {
  const now = new Date()
  return candiDate > addThreeMonths(now)
}

export async function assertFrequencyExists(frequencyCode: string, prisma: FrequencyPrisma): Promise<boolean> {
  const foundFrequency = await prisma.frequency.findUnique({
    where: {
      code: frequencyCode,
    },
  })

  if (!foundFrequency) {
    throw new StatregError(`Frequency '${frequencyCode}' not found`, 404)
  }

  return true
}

// New Sammenslått (SA) relations must always point to a real, active statistic (never itself).
export async function assertRelationTargetIsActive(
  relationId: number,
  currentStatisticId: number,
  prisma: StatisticPrisma
): Promise<boolean> {
  if (relationId === currentStatisticId) {
    throw new StatregError('A statistic cannot have a relation to itself.')
  }

  const relationTarget = await prisma.statistic.findUnique({
    where: { id: relationId },
    select: { status: true },
  })

  if (!relationTarget) {
    throw new StatregError(`Related statistic with id '${relationId}' not found`, 404)
  }

  if (relationTarget.status !== 'A') {
    throw new StatregError("The statistic being related to must have status 'Aktiv'.")
  }

  return true
}

export const releaseAsserts = {
  assertFilteredShortnamesExist,
  assertStatisticExists,
  assertVariantExists,
  assertVariantMatchesShortname,
  assertReleaseDateIsMoreThanThreeMonthsAway,
}

export const statisticsAsserts = {
  assertShortnameExists,
  assertShortnameExistsAndIsAvailable,
  assertFilteredShortnamesExist,
  assertFrequencyExists,
  assertRelationTargetIsActive,
}
