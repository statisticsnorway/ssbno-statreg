// For usage, remember to destructurize the function's content e.g. { name: [...getLocalizedName(language_code, text)] }
export function getLocalizedName(language_code = 'nb', text: string | undefined | null) {
  return text ? [{ language_code, text }] : []
}

export function dateToISOString(date: Date | null) {
  if (!date) return ''
  // TODO: Might not be necessary to check is date is valid if we ensure that the new dates being created are valid
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}
