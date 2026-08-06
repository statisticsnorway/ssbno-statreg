import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'
import { dateToISOString } from '@/lib/utils'
import type { Prisma } from '@/generated/prisma/client'

export type VersionPrisma = Pick<PrismaClient, 'auditLog'>

export type ChangedValue = {
  field_name: string
  old_value: string | null
  new_value: string | null
}

export type Version = {
  change_type: 'create' | 'update' | 'delete'
  changed_at: string
  changed_by: string
  changed_values: ChangedValue[]
  comment?: string
}

type AuditLogEntry = Prisma.AuditLogGetPayload<Record<string, never>>

function diffObjects(oldJson: string | null, newJson: string | null, eventName: string): ChangedValue[] {
  const oldObject = oldJson ? JSON.parse(oldJson) : {}
  const newObject = newJson ? JSON.parse(newJson) : {}

  if (eventName === 'create') {
    return Object.entries(newObject).map(([key, value]) => ({
      field_name: key,
      old_value: null,
      new_value: JSON.stringify(value),
    }))
  }

  if (eventName === 'delete') {
    return Object.entries(oldObject).map(([key, value]) => ({
      field_name: key,
      old_value: JSON.stringify(value),
      new_value: null,
    }))
  }

  const changes: ChangedValue[] = []
  for (const key of Object.keys(oldObject)) {
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
  return {
    change_type: entry.event_name as 'create' | 'update' | 'delete',
    changed_at: entry.last_updated.toISOString(),
    changed_by: entry.actor,
    changed_values: diffObjects(entry.old_value, entry.new_value, entry.event_name),
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
