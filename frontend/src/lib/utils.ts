export function formatPublishTime(publishTime: string | undefined, timeZone?: string): string {
  if (!publishTime) return '-'
  return new Date(publishTime)
    .toLocaleString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(timeZone && { timeZone }),
    })
    .replace(',', ' kl')
}

export function formatDate(isoString?: string, timeZone?: string): string {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(timeZone && { timeZone }),
  })
}

export function getFirstDayOfNthMonth(monthsAhead: number): Date {
  const from = new Date()
  from.setDate(1)
  from.setMonth(from.getMonth() + monthsAhead)
  return from
}

export function getLastDayOfNthMonth(monthsAhead: number): Date {
  const to = new Date()
  to.setMonth(to.getMonth() + monthsAhead + 1)
  to.setDate(0)
  return to
}

export function getDateOnlyAsString(date: Date): string {
  return date.toLocaleDateString('nb-NO')
}
