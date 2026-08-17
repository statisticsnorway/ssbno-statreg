import { type ReleaseListing } from '@ssbno-statreg/shared'
import { getDateOnlyAsString } from './utils'

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

function getNextRelease(latestRelease: ReleaseListing): SuggestedRelease | undefined {
  if (!latestRelease.publish_time || !latestRelease.period_from || !latestRelease.period_to) return undefined

  const publishTime = new Date(latestRelease.publish_time)
  const periodFrom = new Date(latestRelease.period_from)
  const periodTo = new Date(latestRelease.period_to)
  const frequencyCode = latestRelease.frequency?.code?.toUpperCase()

  if (frequencyCode === 'Y' || frequencyCode === 'A') {
    return {
      publishTime: addYears(publishTime, 1),
      periodFrom: addYears(periodFrom, 1),
      periodTo: addYears(periodTo, 1),
    }
  }

  if (frequencyCode === 'K') {
    return {
      publishTime: addMonths(publishTime, 3),
      periodFrom: addMonths(periodFrom, 3),
      periodTo: getLastDayOfMonth(addMonths(periodFrom, 5)),
    }
  }

  if (frequencyCode === 'M') {
    return {
      publishTime: addMonths(publishTime, 1),
      periodFrom: addMonths(periodFrom, 1),
      periodTo: getLastDayOfMonth(addMonths(periodFrom, 1)),
    }
  }

  if (frequencyCode === 'T') {
    return {
      publishTime: addMonths(publishTime, 2),
      periodFrom: addMonths(periodFrom, 2),
      periodTo: getLastDayOfMonth(addMonths(periodFrom, 3)),
    }
  }

  if (frequencyCode === 'W' || frequencyCode === 'U') {
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

function getEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const n = Math.floor((h + l - 7 * m + 114) / 31)
  const p = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, n - 1, p))
}

function isPublicHoliday(date: Date): boolean {
  const year = date.getFullYear()
  const easterSunday = getEasterSunday(year)
  const movableHolidays = [-3, -2, 0, 1, 39, 49, 50].map((offset) => addDays(easterSunday, offset))
  const fixedHolidays = [
    new Date(Date.UTC(year, 0, 1)),
    new Date(Date.UTC(year, 4, 1)),
    new Date(Date.UTC(year, 4, 17)),
    new Date(Date.UTC(year, 11, 25)),
    new Date(Date.UTC(year, 11, 26)),
  ]

  const dateOnlyString = getDateOnlyAsString(date)
  return [...movableHolidays, ...fixedHolidays].some((holiday) => getDateOnlyAsString(holiday) === dateOnlyString)
}

function rollBackToWorkingDay(date: Date): Date {
  const publishDate = new Date(date)
  while (isWeekend(publishDate) || isPublicHoliday(publishDate)) {
    publishDate.setUTCDate(publishDate.getUTCDate() - 1)
  }
  return publishDate
}

export function suggestNextRelease(release: ReleaseListing | undefined): SuggestedRelease | undefined {
  if (!release) return undefined

  const nextRelease = getNextRelease(release)
  if (!nextRelease) return undefined

  return { ...nextRelease, publishTime: rollBackToWorkingDay(nextRelease.publishTime) }
}
