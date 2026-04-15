import { prisma } from './prisma'
import { assertDayNotManuallyBlocked } from '@/lib/asserts'

export const HOLIDAYS: Record<number, Date[]> = {}

export async function isDateBlocked(date: Date): Promise<Boolean> {
  const sunday = 0
  const saturday = 6
  if (date.getDay() == saturday || date.getDay() == sunday) return true

  const year = date.getFullYear()
  const holidays = getHolidays(year)
  if (holidays.some((d) => d === date)) return true

  if (!(await assertDayNotManuallyBlocked(prisma, date))) return true

  return false
}

export function getHolidays(year: number): Date[] {
  if (!HOLIDAYS[year]) {
    const holidaysOnStaticDates = [
      new Date(`${year}-1-1`),
      new Date(`${year}-5-1`),
      new Date(`${year}-5-17`),
      new Date(`${year}-12-25`),
      new Date(`${year}-12-26`),
    ]
    HOLIDAYS[year] = holidaysOnStaticDates.concat(calculateMovableHolidays(year))
  }
  return HOLIDAYS[year]
}

export function calculateMovableHolidays(year: number): Date[] {
  // https://no.wikipedia.org/wiki/Helligdager_i_Norge#Helligdager

  const easterSunday = calculateEasterSunday(year)

  // prettier-ignore
  const movableHolidays = {
    "Skjærtorsdag": addDays(easterSunday, -3),
    "Langfredag": addDays(easterSunday, -2),
    "Første påskedag": easterSunday,
    "Andre påskedag": addDays(easterSunday, 1),
    "Kristi himmelfartsdag": addDays(easterSunday, 39),
    "Første pinsedag": addDays(easterSunday, 49),
    "Andre pinsedag": addDays(easterSunday, 50),
  }

  return Object.values(movableHolidays)
}

export function calculateEasterSunday(year: number) {
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

  return new Date(`${year}-${n}-${p}`)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
