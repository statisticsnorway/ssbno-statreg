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
