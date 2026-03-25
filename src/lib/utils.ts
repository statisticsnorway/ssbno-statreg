import type { Translations } from '@/types'

// For usage, remember to destructurize the function's content e.g. { name: [...getLocalizedName(language_code, text)] }
export function getLocalizedName(language_code = 'nb', text: string | undefined | null): Translations {
  return text ? [{ language_code, text }] : []
}

export function dateToISOString(date: Date | null): string | undefined {
  return date ? date.toISOString() : undefined
}

export function sanitize(input: string): string {
  if (typeof input !== 'string') return ''

  return input.trim().replace(/[^a-zA-Z0-9æøåÆØÅ.,:;!?()/\-\s]/g, '')
}

type DateString = string | string[] | undefined

export function validateDateOnly(dateString: DateString, fieldName = '') {
  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/ // e.g. YYYY-MM-dd
  return validateAndParseDate(dateString, fieldName, dateOnlyRegex)
}

export function validateDateISO(dateString: DateString, fieldName = '') {
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
