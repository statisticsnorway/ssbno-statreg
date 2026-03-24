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

export function validateAndParseDate(dateString: string | string[] | undefined, fieldName = ''): Date {
  const errorMessage = () => ({
    statregError: ['Invalid', fieldName, 'date format:', dateString].filter(Boolean).join(' '),
  })

  const dateOrISORegex = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/ // e.g. YYYY-MM-dd or YYYY-MM-DDTHH:mm:ssZ
  if (!dateString || Array.isArray(dateString) || !dateOrISORegex.test(dateString)) {
    throw errorMessage()
  }

  // TODO: Confirm correct date format. See JIRA issue MIM-2546
  const date = new Date(dateString)
  if (date.toString() === 'Invalid Date') {
    throw errorMessage()
  }

  return date
}
