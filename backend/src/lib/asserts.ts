import { CalendarDatePrisma } from '@/services/calendarService'
import { ReleasePrisma } from '@/services/releasesService'
import { StatisticPrisma } from '@/services/statisticsService'
import { parseDateOnly } from '@/lib/utils'

export async function assertStatisticExists(shortname: string, prisma: ReleasePrisma | StatisticPrisma) {
  const exists = await prisma.statistic.findFirst({
    where: { shortname: { name: shortname } },
    select: { id: true },
  })

  if (!exists) {
    throw { status: 404, statregError: `Statistic '${shortname}' not found` }
  }
}

export async function assertVariantExists(variantId: number, prisma: ReleasePrisma) {
  const exists = await prisma.variant.findUnique({
    where: { id: variantId },
    select: { id: true },
  })

  if (!exists) {
    throw { status: 404, statregError: `Variant '${variantId}' not found` }
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
    throw {
      status: 404,
      statregError: `Variant does not belong to statistic '${shortname}'`,
    }
  }
}

export async function assertShortnameExists(shortname: string, prisma: StatisticPrisma): Promise<boolean> {
  const foundShortname = await prisma.shortname.findUnique({
    where: {
      name: shortname,
    },
  })

  if (!foundShortname) {
    throw { status: 404, statregError: `Shortname '${shortname}' does not exist` }
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
    throw {
      status: 404,
      statregError: `Shortname(s) not found: ${missingShortnames.join(', ')}`,
    }
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
    throw { status: 400, statregError: `Shortname '${shortname}' is already in use` }
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

export const releaseAsserts = {
  assertFilteredShortnamesExist,
  assertStatisticExists,
  assertVariantExists,
  assertVariantMatchesShortname,
}

export const statisticsAsserts = {
  assertShortnameExists,
  assertShortnameExistsAndIsAvailable,
  assertFilteredShortnamesExist,
}
