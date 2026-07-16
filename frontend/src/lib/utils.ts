import { RevisionNames, type Contact, type Variant } from '@ssbno-statreg/shared'

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

export function getDateOnlyAsString(date: Date | undefined): string {
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function parsePublishDateWithTime(publishTime: Date | undefined): string {
  if (!publishTime) return ''

  const localPublishTime = new Date(publishTime)
  localPublishTime.setHours(8, 0, 0, 0)

  return localPublishTime.toISOString()
}

export function formatRevisionName(revision?: string): string {
  if (!revision || !(revision in RevisionNames)) return '-'
  return RevisionNames[revision as keyof typeof RevisionNames]
}

export function formatVariant(variant?: Variant): string {
  const frequency = variant?.frequency?.name ?? '-'
  const revision = formatRevisionName(variant?.revision?.code).toLowerCase()
  return [frequency, revision].join(', ')
}

export function formatContact(contact?: Contact): string {
  if (!contact) return '-'
  const username = contact.principalName?.split('@')[0]
  return [contact.name ?? '', username ? `(${username})` : ''].filter(Boolean).join(' ')
}

export function formatContacts(contacts?: Contact[]): string[] {
  if (!contacts) return []
  return contacts.map(formatContact)
}

export function getPublishTimeFilterForDate(selectedDate: Date | undefined) {
  if (!selectedDate) return {}

  const fromTime = new Date(selectedDate)
  fromTime.setHours(0, 0, 0, 0)
  const toTime = new Date(selectedDate)
  toTime.setHours(23, 59, 59, 999)

  return {
    publish_time_after: fromTime.toISOString(),
    publish_time_before: toTime.toISOString(),
  }
}

export function toggleSort(sortField: string, oldSort: string): string {
  // We would like to loop through sorting like "" -> "shortname" -> "-shortname" -> ""
  if (oldSort !== sortField && oldSort !== `-${sortField}`) {
    // case 1: if field was not sorted by already, sort ascending
    return sortField
  } else {
    const isDescending = oldSort.startsWith('-')

    if (isDescending) {
      // case 2: if field was sorted in descending order, change to none
      return ''
    } else {
      // case 3: if field was sorted in ascending order, change to descending
      return `-${sortField}`
    }
  }
}

export function getSortDirection(field: string, oldSort: string) {
  if (oldSort === field) return 'ascending'
  if (oldSort === `-${field}`) return 'descending'
  return 'none'
}
