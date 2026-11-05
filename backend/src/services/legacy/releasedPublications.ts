import type { ExtendedPrismaClient } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { auditlogEntryToVersion } from '@/services/versionService'
import { ApprovalStatus, RevisionNames } from '@ssbno-statreg/shared'
import { formatLegacyInstant, legacyOwner, loadDivisionNames } from '@/services/legacy/legacyFormat'

type LegacyAuditLog = Prisma.AuditLogGetPayload<null>

type LegacyChange = {
  propertyName: string
  oldValue: string
  newValue: string
  modifiedDate: string
  comment: string
}

export async function listReleasedPublications(
  prisma: Pick<ExtendedPrismaClient, 'release' | 'auditLog' | 'division_DoNotUse'>
) {
  const divisionNames = await loadDivisionNames(prisma)
  const releases = await prisma.release.findMany({
    where: {
      desk_appoval_status: ApprovalStatus.ACCEPTED,
      archived: false,
      cancelled: false,
    },
    select: {
      id: true,
      publish_time: true,
      period_from: true,
      period_to: true,
      date_created: true,
      variant: {
        select: {
          revision: true,
          frequency: { select: { name: true } },
          statistic: {
            select: {
              id: true,
              name: true,
              division_code: true,
              division: { select: { code: true, name: true } },
              shortname: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { id: 'asc' },
  })

  const auditLogs = releases.length
    ? await prisma.auditLog.findMany({
        where: {
          persisted_object_id: { in: releases.map((release) => release.id) },
          AND: [
            { OR: auditClass('Release', 'Publisering') },
            { OR: [{ property_name: { in: ['tidspunkt', 'internKommentar', 'erEndret'] } }, { property_name: null }] },
          ],
        },
        orderBy: { last_updated: 'asc' },
      })
    : []
  const changesByReleaseId = groupPublicationChanges(auditLogs)

  return {
    releases: releases.map((release) => {
      const { statistic } = release.variant
      const owner = legacyOwner(statistic.division, statistic.division_code, divisionNames)
      const history = changesByReleaseId.get(release.id)

      return {
        id: release.id,
        frequency: release.variant.frequency.name,
        revision: revisionName(release.variant.revision),
        publishTime: formatLegacyInstant(release.publish_time),
        periodFrom: formatLegacyInstant(release.period_from),
        periodTo: formatLegacyInstant(release.period_to),
        dateCreated: formatLegacyInstant(release.date_created),
        erEndretDesk: history?.erEndretDesk ?? false,
        shortName: statistic.shortname.name,
        statisticId: statistic.id,
        statisticName: statistic.name,
        ownerCode: owner.ownerCode,
        owner: owner.owner,
        changes: history?.changes ?? [],
      }
    }),
  }
}

function groupPublicationChanges(entries: LegacyAuditLog[]) {
  const byObjectId = new Map<number, LegacyAuditLog[]>()
  for (const entry of entries) {
    const current = byObjectId.get(entry.persisted_object_id) ?? []
    current.push(entry)
    byObjectId.set(entry.persisted_object_id, current)
  }

  return new Map([...byObjectId].map(([id, objectEntries]) => [id, toPublicationChanges(objectEntries)]))
}

function toPublicationChanges(entries: LegacyAuditLog[]) {
  const comments = entries
    .filter((entry) => entry.property_name === 'internKommentar' && entry.new_value)
    .map((entry) => ({ at: entry.last_updated.getTime(), text: entry.new_value as string }))

  let erEndretDesk = false
  let erEndretAt = Number.NEGATIVE_INFINITY
  const changes: LegacyChange[] = []

  for (const entry of entries) {
    if (entry.property_name === 'erEndret' && entry.last_updated.getTime() >= erEndretAt) {
      erEndretAt = entry.last_updated.getTime()
      erEndretDesk = entry.new_value === 'true'
    }

    if (entry.property_name === 'tidspunkt' && entry.old_value && entry.new_value) {
      changes.push({
        propertyName: 'tidspunkt',
        oldValue: entry.old_value,
        newValue: entry.new_value,
        modifiedDate: formatLegacyInstant(entry.last_updated),
        comment: commentNear(comments, entry.last_updated.getTime()),
      })
    }
  }

  const jsonChanges = toLegacyChanges(
    entries.filter((entry) => entry.class_name.endsWith('Release')),
    'publish_time'
  ).map((change) => ({
    ...change,
    propertyName: 'tidspunkt',
    oldValue: formatAuditTimeValue(change.oldValue),
    newValue: formatAuditTimeValue(change.newValue),
  }))

  return {
    erEndretDesk,
    changes: [...changes, ...jsonChanges].sort((a, b) => a.modifiedDate.localeCompare(b.modifiedDate)),
  }
}

function formatAuditTimeValue(value: string) {
  const sql = value.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/)
  const sqlDate = sql?.[1]
  const sqlTime = sql?.[2]
  if (sqlDate && sqlTime) return new Date(`${sqlDate}T${sqlTime}Z`).toISOString()

  const java = value.match(/^[A-Z][a-z]{2} ([A-Z][a-z]{2}\s+\d{1,2}) (\d{2}:\d{2}:\d{2}) (?:CET|CEST) (\d{4})$/)
  const monthAndDay = java?.[1]
  const time = java?.[2]
  const year = java?.[3]
  if (monthAndDay && time && year) return new Date(`${monthAndDay} ${year} ${time} UTC`).toISOString()

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime()) && value.includes('T')) return parsed.toISOString()
  return value
}

function auditClass(...names: string[]) {
  return names.map((name) => ({ class_name: { endsWith: name } }))
}

function commentNear(comments: { at: number; text: string }[], at: number) {
  let best: { at: number; text: string } | undefined
  for (const comment of comments) {
    const distance = Math.abs(comment.at - at)
    if (distance > 1000) continue
    if (!best || distance < Math.abs(best.at - at)) best = comment
  }
  return best?.text ?? ''
}

function toLegacyChanges(entries: LegacyAuditLog[], propertyName?: string): LegacyChange[] {
  const comments = entries
    .filter((entry) => entry.property_name === 'internKommentar' && entry.new_value)
    .map((entry) => ({ at: entry.last_updated.getTime(), text: entry.new_value as string }))

  return entries.flatMap((entry) => {
    if (entry.property_name === 'internKommentar') return []

    const version = auditlogEntryToVersion(entry)
    const comment = commentNear(comments, entry.last_updated.getTime()) || version.comment || ''
    const changedValues = (version.changed_values ?? []).filter(
      (changed) => !propertyName || changed.field_name === propertyName
    )

    return changedValues.map((changed) => ({
      propertyName: changed.field_name,
      oldValue: changed.old_value,
      newValue: changed.new_value,
      modifiedDate: formatLegacyInstant(new Date(version.changed_at)),
      comment,
    }))
  })
}

function revisionName(code: string) {
  if (code in RevisionNames) {
    return RevisionNames[code as keyof typeof RevisionNames]
  }
  return code
}
