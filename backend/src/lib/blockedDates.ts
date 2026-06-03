import { assertDayNotManuallyBlocked } from '@/lib/asserts'
import { CalenderDate } from '@ssbno-statreg/shared'
import { CalendarDatePrisma } from '@/services/calendarService'
import { getDateOnlyAsString, parseDateOnly } from '@/lib/utils'

export const HOLIDAYS: Record<number, string[]> = {}
type Holiday = {
  date: string
  name: string
}
export const HOLIDAYS_BY_YEAR: Record<number, Holiday> = {}

export function isDateAutoBlocked(dateString: string): boolean {
  const date = parseDateOnly(dateString)
  const sunday = 0
  const saturday = 6
  if (date.getUTCDay() === saturday || date.getUTCDay() === sunday) return true

  const year = dateString.slice(0, 4)
  const holidays = getHolidays(Number(year))

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

export function getHolidays(year: number): string[] {
  if (!HOLIDAYS[year]) {
    const staticHolidays = [`${year}-01-01`, `${year}-05-01`, `${year}-05-17`, `${year}-12-25`, `${year}-12-26`]
    HOLIDAYS[year] = staticHolidays.concat(calculateMovableHolidays(year))
  }
  return HOLIDAYS[year]
}

export function calculateMovableHolidays(year: number): string[] {
  // https://no.wikipedia.org/wiki/Helligdager_i_Norge#Helligdager

  const easterSunday = calculateEasterSunday(year)

  // prettier-ignore
  const movableHolidays = {
    "Skjærtorsdag":          addDaysAndFormat(easterSunday, -3),
    "Langfredag":            addDaysAndFormat(easterSunday, -2),
    "Første påskedag":       addDaysAndFormat(easterSunday,  0),
    "Andre påskedag":        addDaysAndFormat(easterSunday,  1),
    "Kristi himmelfartsdag": addDaysAndFormat(easterSunday, 39),
    "Første pinsedag":       addDaysAndFormat(easterSunday, 49),
    "Andre pinsedag":        addDaysAndFormat(easterSunday, 50),
  }

  return Object.values(movableHolidays)
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
