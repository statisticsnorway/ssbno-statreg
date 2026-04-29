import { assertDayNotManuallyBlocked } from '@/lib/asserts'
import { CalenderDate } from '@ssbno-statreg/shared'
import { CalendarDatePrisma } from '@/services/calendarService'

export const HOLIDAYS: Record<number, string[]> = {}

export function isDateAutoBlocked(date: Date): Boolean {
  const sunday = 0
  const saturday = 6
  if (date.getUTCDay() === saturday || date.getUTCDay() === sunday) return true

  const year = date.getUTCFullYear()
  const holidays = getHolidays(year)
  const dateKey = date.toISOString().slice(0, 10)

  return holidays.includes(dateKey)
}

export async function isDateBlocked(date: Date, prisma: CalendarDatePrisma): Promise<Boolean> {
  if (isDateAutoBlocked(date)) return true
  if (!(await assertDayNotManuallyBlocked(prisma, date))) return true

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

  const manuallyBlockedKeys = new Set(manuallyBlockedDates.map((day) => day.day.toISOString().slice(0, 10)))

  const blockedDates: CalenderDate = {}

  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  while (d <= to) {
    const key = d.toISOString().slice(0, 10)
    if (manuallyBlockedKeys.has(key) || isDateAutoBlocked(d)) {
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
    "Skjærtorsdag":          addAndFormatDays(easterSunday, -3),
    "Langfredag":            addAndFormatDays(easterSunday, -2),
    "Første påskedag":       addAndFormatDays(easterSunday,  0),
    "Andre påskedag":        addAndFormatDays(easterSunday,  1),
    "Kristi himmelfartsdag": addAndFormatDays(easterSunday, 39),
    "Første pinsedag":       addAndFormatDays(easterSunday, 49),
    "Andre pinsedag":        addAndFormatDays(easterSunday, 50),
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

function addAndFormatDays(date: Date, days: number): string {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result.toISOString().slice(0, 10)
}
