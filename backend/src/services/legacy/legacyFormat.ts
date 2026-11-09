import type { ExtendedPrismaClient } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { auditlogEntryToVersion } from '@/services/versionService'
import { RevisionNames } from '@ssbno-statreg/shared'
import { fromZonedTime } from 'date-fns-tz'

export type LegacyAuditLog = Prisma.AuditLogGetPayload<null>

export type LegacyChange = {
  propertyName: string
  oldValue: string
  newValue: string
  modifiedDate: string
  comment: string
}

export type LegacyComment = {
  at: number
  text: string
}

const OSLO = 'Europe/Oslo'

// Used on every date the dashboard formats: publish time, periods, created date, and change dates.
export function toUtcDateString(date: Date): string {
  const wallClock = date.toISOString().slice(0, 19)
  return fromZonedTime(wallClock, OSLO)
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
}

// Used when the statistic or release has a section code but no linked division row.
export async function getOwnerNamesByCode(prisma: Pick<ExtendedPrismaClient, 'division_DoNotUse'>) {
  const divisions = await prisma.division_DoNotUse.findMany({ select: { code: true, name: true } })
  return new Map(divisions.map((division) => [division.code, division.name]))
}

// Used to fill ownerCode and owner on both statistics and releases.
export function getOwner(
  division: { code: string; name: string } | null,
  divisionCode: string | null,
  namesByCode: Map<string, string>
) {
  const ownerCode = division?.code || divisionCode || ''
  const owner = division?.name || namesByCode.get(ownerCode) || ''
  return { ownerCode, owner }
}

// Used for the release revision field, and for the statistic variant text such as "År, foreløpige".
export function getRevisionName(code: string) {
  if (code in RevisionNames) {
    return RevisionNames[code as keyof typeof RevisionNames]
  }
  return code
}

// Used in the audit query so both old class names (Publisering, Statistikk) and new ones (Release, Statistic) match.
export function whereClassNameEndsWith(...names: string[]) {
  return names.map((name) => ({ class_name: { endsWith: name } }))
}

// Used by toChangeList to collect internKommentar rows.
function readComments(entries: LegacyAuditLog[]): LegacyComment[] {
  return entries
    .filter((entry) => entry.property_name === 'internKommentar' && entry.new_value)
    .map((entry) => ({ at: entry.last_updated.getTime(), text: entry.new_value as string }))
}

// Used by toChangeList to attach the comment logged within one second of a change.
function findComment(comments: LegacyComment[], at: number) {
  let best: LegacyComment | undefined
  for (const comment of comments) {
    const distance = Math.abs(comment.at - at)
    if (distance > 1000) continue
    if (!best || distance < Math.abs(best.at - at)) best = comment
  }
  return best?.text ?? ''
}

// Used to split one audit query into the rows for each statistic or release.
export function groupByObjectId(entries: LegacyAuditLog[]) {
  const byObjectId = new Map<number, LegacyAuditLog[]>()
  for (const entry of entries) {
    const current = byObjectId.get(entry.persisted_object_id) ?? []
    current.push(entry)
    byObjectId.set(entry.persisted_object_id, current)
  }
  return byObjectId
}

// Used to build the changes array. Pass "tidspunkt" or "publish_time" to keep one field.
export function toChangeList(entries: LegacyAuditLog[], propertyName?: string): LegacyChange[] {
  const comments = readComments(entries)

  return entries.flatMap((entry) => {
    if (entry.property_name === 'internKommentar') return []

    const version = auditlogEntryToVersion(entry)
    const comment = findComment(comments, entry.last_updated.getTime()) || version.comment || ''
    const changedValues = (version.changed_values ?? []).filter(
      (changed) => !propertyName || changed.field_name === propertyName
    )

    return changedValues.map((changed) => ({
      propertyName: changed.field_name,
      oldValue: changed.old_value,
      newValue: changed.new_value,
      modifiedDate: toUtcDateString(new Date(version.changed_at)),
      comment,
    }))
  })
}
