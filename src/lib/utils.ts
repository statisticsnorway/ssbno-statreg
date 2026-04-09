export function dateToISOString(date: Date | null): string | undefined {
  if (!date) return

  return date.toISOString()
}

export function sanitize(input: string): string {
  if (typeof input !== 'string') return ''

  return input.trim().replace(/[^a-zA-Z0-9æøåÆØÅ.,:;!?()/\-\s]/g, '')
}

type DateString = string | string[] | undefined

export function validateDateOnly(dateString: DateString, fieldName = ''): Date {
  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/ // e.g. YYYY-MM-dd
  return validateAndParseDate(dateString, fieldName, dateOnlyRegex)
}

export function validateDateISO(dateString: DateString, fieldName = ''): Date {
  // TODO: MIM-2546: Confirm if this regEx covers all our required valid date ISO formats
  const dateISORegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/ // YYYY-MM-DDTHH:mm:ssZ
  return validateAndParseDate(dateString, fieldName, dateISORegex)
}

export function validateAndParseDate(dateString: DateString, fieldName: string, dateRegEx: RegExp): Date {
  const errorMessage = () => ({
    statregError: ['Invalid', fieldName, 'date format:', dateString].filter(Boolean).join(' '),
  })

  if (!dateString || Array.isArray(dateString) || !dateRegEx.test(dateString)) {
    throw errorMessage()
  }

  // TODO: MIM-2546: Confirm correct date format
  const date = new Date(dateString)
  if (date.toString() === 'Invalid Date') {
    throw errorMessage()
  }

  return date
}

export function ensureString(value?: string | string[]): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

export function ensureIdIsNumber(variantId: string | number, fieldName?: string): number {
  const parsedVariantId = typeof variantId === 'number' ? variantId : Number(sanitize(variantId))

  if (!Number.isInteger(parsedVariantId) || parsedVariantId < 0) {
    throw { statregError: ['Invalid', fieldName, 'id format'].filter(Boolean).join(' ') }
  }

  return parsedVariantId
}

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

function calculateEasterDay(year: number): Date {
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
  const p = (h + l - 7 * m + 114) % 31

  const month = n - 1
  const day = p + 1

  return new Date(year, month, day)
}
