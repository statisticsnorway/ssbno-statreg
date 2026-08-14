import { type CalenderDate, type ReleaseListing } from '@ssbno-statreg/shared'
import client from '../api'
import { getDateOnlyAsString } from './utils'

// Avoid an unbounded loop if calendarDates has no non-blocked day nearby.
const MAX_ROLLBACK_DAYS = 14

function getLatestRelease(releases: ReleaseListing[]): ReleaseListing | undefined {
  return releases
    .filter((release) => release.publish_time)
    .sort((a, b) => new Date(b.publish_time as string).getTime() - new Date(a.publish_time as string).getTime())[0]
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getDaysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export type SuggestedRelease = {
  publishTime: Date
  periodFrom: Date
  periodTo: Date
}

// Mirrors the old bliSiste() Groovy logic: known frequencies step by calendar unit (quarter/month also
// snap periodTo to the end of month), others repeat the previous release's period length (in days).
function getNextRelease(latestRelease: ReleaseListing): SuggestedRelease | undefined {
  if (!latestRelease.publish_time || !latestRelease.period_from || !latestRelease.period_to) return undefined

  const publishTime = new Date(latestRelease.publish_time)
  const periodFrom = new Date(latestRelease.period_from)
  const periodTo = new Date(latestRelease.period_to)
  const frequencyName = latestRelease.frequency?.name

  if (frequencyName === 'År') {
    return {
      publishTime: addYears(publishTime, 1),
      periodFrom: addYears(periodFrom, 1),
      periodTo: addYears(periodTo, 1),
    }
  }

  if (frequencyName === 'Kvartal') {
    return {
      publishTime: addMonths(publishTime, 3),
      periodFrom: addMonths(periodFrom, 3),
      periodTo: getLastDayOfMonth(addMonths(periodTo, 3)),
    }
  }

  if (frequencyName === 'Måned') {
    return {
      publishTime: addMonths(publishTime, 1),
      periodFrom: addMonths(periodFrom, 1),
      periodTo: getLastDayOfMonth(addMonths(periodTo, 1)),
    }
  }

  if (frequencyName === 'Uke') {
    return { publishTime: addDays(publishTime, 7), periodFrom: addDays(periodFrom, 7), periodTo: addDays(periodTo, 7) }
  }

  const duration = getDaysBetween(periodFrom, periodTo)
  return {
    publishTime: addDays(publishTime, duration),
    periodFrom: addDays(periodTo, 1),
    periodTo: addDays(periodTo, duration),
  }
}

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

async function fetchBlockedDatesForMonth(monthDate: Date): Promise<CalenderDate> {
  const from = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const to = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const { data, error } = await client.GET('/calendar', {
    params: { query: { fromDate: getDateOnlyAsString(from), toDate: getDateOnlyAsString(to) } },
  })

  return error ? {} : data
}

// Rolls back to the previous working day, matching the old kalenderService.forrigeArbeidsdag behavior.
// Only fetches an earlier month's blocked dates on demand, once the rollback crosses before its 1st.
async function rollBackToWorkingDay(date: Date, calendarDates: CalenderDate): Promise<Date> {
  const result = new Date(date)
  let knownDates = calendarDates
  const fetchedMonths = new Set<string>()

  for (let i = 0; i < MAX_ROLLBACK_DAYS; i++) {
    if (result.getDate() === 1) {
      const monthKey = `${result.getFullYear()}-${result.getMonth()}`
      if (!fetchedMonths.has(monthKey)) {
        fetchedMonths.add(monthKey)
        const previousMonth = new Date(result.getFullYear(), result.getMonth() - 1, 1)
        knownDates = { ...knownDates, ...(await fetchBlockedDatesForMonth(previousMonth)) }
      }
    }

    const isBlocked = knownDates[getDateOnlyAsString(result)]?.status === 'BLOCKED'
    if (!isWeekend(result) && !isBlocked) return result
    result.setDate(result.getDate() - 1)
  }

  return result
}

/** Suggests the next release's publish date, periodFrom and periodTo based on the latest release. */
export async function suggestNextRelease(
  releases: ReleaseListing[],
  calendarDates: CalenderDate = {}
): Promise<SuggestedRelease | undefined> {
  const latestRelease = getLatestRelease(releases)
  if (!latestRelease) return undefined

  const nextRelease = getNextRelease(latestRelease)
  if (!nextRelease) return undefined

  return { ...nextRelease, publishTime: await rollBackToWorkingDay(nextRelease.publishTime, calendarDates) }
}
