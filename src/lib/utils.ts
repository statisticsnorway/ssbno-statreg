// For usage, remember to destructurize the function's content e.g. { name: [...getLocalizedName(language_code, text)] }
export function getLocalizedName(language_code: string, text: string | undefined | null) {
  return text ? [{ language_code, text }] : []
}

export function dateToISOString(date: Date | null) {
  if (!date) return ''
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}
