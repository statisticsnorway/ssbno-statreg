import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'
import { sanitize } from '@/lib/utils'
import type { Prisma } from '@/generated/prisma/client'

export type VersionPrisma = Pick<PrismaClient, 'auditLog' | 'statistic' | 'shortname'>

export type ChangedValue = {
  field_name: string
  old_value: string
  new_value: string
}

export type Version = {
  change_type: 'create' | 'update' | 'delete'
  changed_at: string
  changed_by: string
  changed_values?: ChangedValue[]
  comment?: string
}

type AuditLogEntry = Prisma.AuditLogGetPayload<Record<string, never>>

function diffObjects(oldObject: Record<string, unknown>, newObject: Record<string, unknown>): ChangedValue[] {
  const changes: ChangedValue[] = []
  for (const key of Object.keys(oldObject)) {
    if (key === 'comment') {
      continue
    }

    const oldValue = oldObject[key]
    const newValue = newObject[key]

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field_name: key,
        old_value: JSON.stringify(oldValue),
        new_value: JSON.stringify(newValue),
      })
    }
  }

  return changes
}

function auditlogEntryToVersion(entry: AuditLogEntry): Version {
  const oldObject = entry.old_value ? JSON.parse(entry.old_value) : {}
  const newObject = entry.new_value ? JSON.parse(entry.new_value) : {}
  return {
    change_type: entry.event_name as 'create' | 'update' | 'delete',
    changed_at: entry.last_updated.toISOString(),
    changed_by: entry.actor,
    changed_values: entry.event_name === 'update' ? diffObjects(oldObject, newObject) : undefined,
    comment: newObject.comment ?? '', // TODO comment should be part of audit log entry
  }
}

export async function getVersions(resourceType: string, id: number, prisma: VersionPrisma): Promise<Version[]> {
  const entries = await prisma.auditLog.findMany({
    where: {
      class_name: resourceType,
      persisted_object_id: id,
    },
    orderBy: {
      last_updated: 'desc',
    },
  })

  return entries.map(auditlogEntryToVersion)
}

export async function getStatisticVersions(shortname: string, prisma: VersionPrisma): Promise<Version[]> {
  const safeShortname = sanitize(shortname)

  const statistic = await prisma.statistic.findFirst({
    where: { shortname: { name: safeShortname } },
    select: { id: true },
  })

  if (!statistic) return Promise.reject({ status: 404, statregError: `Shortname '${safeShortname}' not found` })

  return getVersions('Statistic', statistic.id, prisma)
}
