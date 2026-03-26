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

export function validateAndParseDate(dateString: string | string[] | undefined, fieldName?: string): Date {
  const dateRegEx = /^\d{4}-\d{2}-\d{2}$/
  if (!dateString || Array.isArray(dateString) || !dateRegEx.test(dateString)) {
    throw {
      statregError: `Invalid${fieldName ? ` ${fieldName}` : ''} date format in query parameter`,
    }
  }

  // TODO: Confirm correct date format. See JIRA issue MIM-2546
  const date = new Date(dateString)
  if (date.toString() === 'Invalid Date') {
    throw { statregError: `Invalid${fieldName ? ` ${fieldName}` : ''} date format in query parameter` }
  }

  return date
}

export function ensureString(value?: string | string[]): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

export function ensureVariantIdNumber(variantId: string | number): number {
  const parsedVariantId = typeof variantId === 'number' ? variantId : Number(sanitize(variantId))

  if (!Number.isInteger(parsedVariantId)) {
    throw { statregError: 'Invalid variant id (not a number)' }
  }

  return parsedVariantId
}
