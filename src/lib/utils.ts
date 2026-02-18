// For usage, remember to destructurize the function's content e.g. { name: [...getLocalizedName(language_code, text)] }
export function getLocalizedName(language_code: string, text: string | undefined | null) {
  return text ? [{ language_code, text }] : []
}
