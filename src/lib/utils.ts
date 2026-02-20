// For usage, remember to destructurize the function's content e.g. { name: [...getLocalizedName(language_code, text)] }
export function getLocalizedName(language_code = 'nb', text: string | undefined | null) {
  return text ? [{ language_code, text }] : []
}

export function dateToISOString(date: Date | null) {
  return date ? date.toISOString() : undefined
}
