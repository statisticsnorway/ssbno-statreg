export function formatPublishTime(publishTime: string | undefined, timeZone = 'UTC'): string {
  if (!publishTime) return '-'
  return new Date(publishTime)
    .toLocaleString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    })
    .replace(',', ' kl')
}

export function formatDate(isoString?: string, timeZone = 'UTC'): string {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone,
  })
}
