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
