import type { ExtendedPrismaClient } from '@/lib/prisma'
import { auditlogEntryToVersion } from '@/services/versionService'
import type { Version } from '@ssbno-statreg/shared'
export type LegacyChange = {
  propertyName: string
  oldValue: string
  newValue: string
  modifiedDate: string
  comment: string
}

export function toLegacyOsloDateString(date: Date): string {
  return date.toISOString().slice(0, 19) + 'Z'
}

// Loads version history for many ids in one query, parsed like GET /versions.
export async function getVersionsByObjectIds(
  className: string,
  ids: number[],
  prisma: Pick<ExtendedPrismaClient, 'auditLog'>
) {
  if (!ids.length) return new Map<number, Version[]>()

  const entries = await prisma.auditLog.findMany({
    where: { class_name: className, persisted_object_id: { in: ids } },
    orderBy: { last_updated: 'desc' },
  })

  const versionsById = new Map<number, Version[]>()
  for (const entry of entries) {
    const versions = versionsById.get(entry.persisted_object_id) ?? []
    versions.push(auditlogEntryToVersion(entry))
    versionsById.set(entry.persisted_object_id, versions)
  }
  return versionsById
}

// Turns version history into the dashboard changes list, using the old field names.
export function toChangeList(versions: Version[], fields: Record<string, string>): LegacyChange[] {
  return versions.flatMap((version) =>
    (version.changed_values ?? []).flatMap((changed) => {
      const propertyName = fields[changed.field_name]
      if (!propertyName) return []
      return [
        {
          propertyName,
          oldValue: changed.old_value,
          newValue: changed.new_value,
          modifiedDate: toLegacyOsloDateString(new Date(version.changed_at)),
          comment: version.comment || '',
        },
      ]
    })
  )
}
