import { assertDayNotManuallyBlocked } from '@/lib/asserts'
import { CalenderDate, BlockedReleaseDate } from '@ssbno-statreg/shared'
import { CalendarDatePrisma } from '@/services/calendarService'
import { getDateOnlyAsString, parseDateOnly } from '@/lib/utils'

export const HOLIDAYS: Record<number, BlockedReleaseDate[]> = {}

function holiday(date: string, name: string): BlockedReleaseDate {
  return {
    date: date,
    blocked_comment: name,
    automatically_blocked: true,
  }
}

export function isDateAutoBlocked(dateString: string): boolean {
  const date = parseDateOnly(dateString)
  const sunday = 0
  const saturday = 6
  if (date.getUTCDay() === saturday || date.getUTCDay() === sunday) return true

  const year = dateString.slice(0, 4)
  const holidays = getHolidayDates(Number(year))

  return holidays.includes(dateString)
}

export async function isDateBlocked(dateString: string, prisma: CalendarDatePrisma): Promise<boolean> {
  if (isDateAutoBlocked(dateString)) return true
  if (!(await assertDayNotManuallyBlocked(prisma, dateString))) return true

  return false
}

export async function getBlockedDatesInPeriod(from: Date, to: Date, prisma: CalendarDatePrisma): Promise<CalenderDate> {
  const manuallyBlockedDates = await prisma.calender_date.findMany({
    where: {
      day: {
        gt: from,
        lte: to,
      },
    },
    select: { day: true },
  })

  const manuallyBlockedKeys = new Set(manuallyBlockedDates.map(({ day }) => getDateOnlyAsString(day)))

  const blockedDates: CalenderDate = {}

  const d = new Date(from)
  while (d <= to) {
    const key = getDateOnlyAsString(d)
    if (manuallyBlockedKeys.has(key) || isDateAutoBlocked(key)) {
      blockedDates[key] = { status: 'BLOCKED' }
    }
    d.setUTCDate(d.getUTCDate() + 1)
  }

  return blockedDates
}

export function getHolidayDates(year: number): string[] {
  return getHolidays(year).map((holiday) => holiday.date!)
}

export function getHolidays(year: number): BlockedReleaseDate[] {
  if (HOLIDAYS[year]) return HOLIDAYS[year]

  const staticHolidays: BlockedReleaseDate[] = [
    holiday(`${year}-01-01`, 'Første nyttårsdag'),
    holiday(`${year}-05-01`, 'Arbeidernes dag'),
    holiday(`${year}-05-17`, 'Grunnlovsdag'),
    holiday(`${year}-12-25`, 'Første juledag'),
    holiday(`${year}-12-26`, 'Andre juledag'),
  ]
  HOLIDAYS[year] = staticHolidays.concat(calculateMovableHolidays(year))
  return HOLIDAYS[year]
}

export function calculateMovableHolidays(year: number): BlockedReleaseDate[] {
  // https://no.wikipedia.org/wiki/Helligdager_i_Norge#Helligdager

  const easterSunday = calculateEasterSunday(year)

  return [
    holiday(addDaysAndFormat(easterSunday, -3), 'Skjærtorsdag'),
    holiday(addDaysAndFormat(easterSunday, -2), 'Langfredag'),
    holiday(addDaysAndFormat(easterSunday, 0), 'Første påskedag'),
    holiday(addDaysAndFormat(easterSunday, 1), 'Andre påskedag'),
    holiday(addDaysAndFormat(easterSunday, 39), 'Kristi himmelfartsdag'),
    holiday(addDaysAndFormat(easterSunday, 49), 'Første pinsedag'),
    holiday(addDaysAndFormat(easterSunday, 50), 'Andre pinsedag'),
  ]
}

export function calculateEasterSunday(year: number): Date {
  // https://no.wikipedia.org/wiki/P%C3%A5skeformelen#Meeus/Jones/Butchers_formel_(bare_for_gregoriansk_kalender)
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

function addDaysAndFormat(date: Date, days: number): string {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return getDateOnlyAsString(result)
}
