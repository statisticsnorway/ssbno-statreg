export function dateToISOString(date: Date | null): string | undefined {
  if (!date) return

  return date.toISOString()
}

export function sanitize(input: string | undefined): string {
  if (typeof input !== 'string') return ''

  return input.trim().replace(/[^a-zA-Z0-9æøåÆØÅ.,:;!?()/_\-\s]/g, '')
}

type DateString = string | string[] | undefined

export function parseDateOnly(dateString: DateString, fieldName = ''): Date {
  return parseDateISO(dateString + 'T00:00:00Z', fieldName, dateString)
}

export function parseDateISO(dateString: DateString, fieldName = '', originalDateStringValue?: DateString): Date {
  const dateISORegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/ // YYYY-MM-DDTHH:mm:ssZ
  const errorMessage = () => ({
    statregError: ['Invalid', fieldName, 'date format:', originalDateStringValue ?? dateString]
      .filter(Boolean)
      .join(' '),
  })

  if (!dateString || Array.isArray(dateString) || !dateISORegex.test(dateString)) {
    throw errorMessage()
  }

  const date = new Date(dateString)
  if (date.toString() === 'Invalid Date') {
    throw errorMessage()
  }

  return date
}

export function ensureString(value?: string | string[]): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

export function ensureStringArray(value?: string): string[] {
  return typeof value === 'string' ? value.split(',') : []
}

export function parseId(id: string | number, fieldName?: string): number {
  if (!isNumber(id) || Number(id) < 0) {
    throw { statregError: ['Invalid', fieldName, 'id format'].filter(Boolean).join(' ') }
  }

  return Number(id)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ensureRequiredFieldsExists<T extends Record<string, any>>(
  body: T | undefined,
  requiredFields: (keyof T)[]
): T {
  const validBody = Object.keys(body ?? {}).length
  const missingFields = validBody ? requiredFields.filter((key) => !Object.hasOwn(body ?? {}, key)) : requiredFields

  if (missingFields?.length) {
    throw {
      statregError: `Missing required field(s): ${missingFields.join(', ')}`,
    }
  }

  return body as T
}

export function isNumber(str: string | number | undefined | null) {
  return Number.isInteger(Number(str))
}

export function getDateOnlyAsString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Eks. "Januar 2026"
export const formatMonthYear = (date: Date): string => {
  const monthYear = new Intl.DateTimeFormat('nb-NO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
  return monthYear.charAt(0).toUpperCase() + monthYear.slice(1)
}

// Eks. "1. januar 2026"
export const formatDayMonthYear = (date: Date): string => {
  return new Intl.DateTimeFormat('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function parseHumanReadableMeasuringPeriod(frequencyCode: string, period_from: Date, period_to: Date): string {
  const code = frequencyCode.toUpperCase()

  const isSameDay =
    period_from.getUTCFullYear() === period_to.getUTCFullYear() &&
    period_from.getUTCMonth() === period_to.getUTCMonth() &&
    period_from.getUTCDate() === period_to.getUTCDate()

  const getIsoWeekInfo = (date: Date): { week: number; year: number } => {
    const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const day = utcDate.getUTCDay() || 7
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
    const year = utcDate.getUTCFullYear()
    const yearStart = new Date(Date.UTC(year, 0, 1))
    const msPerDay = 24 * 60 * 60 * 1000

    return {
      week: Math.ceil(((utcDate.getTime() - yearStart.getTime()) / msPerDay + 1) / 7),
      year,
    }
  }

  if (code === 'W' || code === 'U') {
    const { week, year } = getIsoWeekInfo(period_to)
    return `Uke ${week} ${year}`
  }

  if (code === 'M') {
    if (isSameDay) {
      return formatDayMonthYear(period_to)
    }
    return formatMonthYear(period_to)
  }

  if (code === 'T') {
    const term = Math.floor(period_to.getUTCMonth() / 2) + 1
    return `${term}. termin ${period_to.getUTCFullYear()}`
  }

  if (code === 'K') {
    if (isSameDay) {
      return formatDayMonthYear(period_to)
    }
    const quarter = Math.floor(period_to.getUTCMonth() / 3) + 1
    return `${quarter}. kvartal ${period_to.getUTCFullYear()}`
  }

  if (code === 'H') {
    const half = Math.floor(period_to.getUTCMonth() / 6) + 1
    return `${half}. halvår ${period_to.getUTCFullYear()}`
  }

  if (code === 'Y' || code === 'A') {
    if (isSameDay && period_from.getDate() === 1 && period_from.getMonth() === 0) {
      return `Per ${formatDayMonthYear(period_to)}`
    }
    if (isSameDay) {
      return formatDayMonthYear(period_to)
    }
    if (period_from.getUTCFullYear() === period_to.getUTCFullYear()) {
      return `${period_to.getUTCFullYear()}`
    }

    return `${period_from.getUTCFullYear()}/${period_to.getUTCFullYear()}`
  }

  if (
    code === '2Y' ||
    code === '3Y' ||
    code === '4Y' ||
    code === '5Y' ||
    code === '2A' ||
    code === '3A' ||
    code === '4A' ||
    code === '5A'
  ) {
    return `${period_from.getUTCFullYear()}-${period_to.getUTCFullYear()}`
  }

  return `${formatDayMonthYear(period_from)}-${formatDayMonthYear(period_to)}`
}
