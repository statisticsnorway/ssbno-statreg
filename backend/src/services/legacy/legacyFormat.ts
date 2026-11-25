import type { ExtendedPrismaClient } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { auditlogEntryToVersion } from '@/services/versionService'
import type { Version } from '@ssbno-statreg/shared'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

const BATCH_SIZE = 250

export type LegacyChange = {
  propertyName: string
  oldValue: string
  newValue: string
  modifiedDate: string
  comment: string
}

export function toLegacyUTCDateString(date: Date): string {
  return date.toISOString().slice(0, 19) + 'Z'
}

export function toLegacyUTCDateOnlyString(date: Date): string {
  const osloDate = formatInTimeZone(date, 'Europe/Oslo', 'yyyy-MM-dd')
  return toLegacyUTCDateString(fromZonedTime(`${osloDate}T00:00:00`, 'Europe/Oslo'))
}

function getAuditLogBatches(
  className: string,
  ids: number[],
  prisma: Pick<ExtendedPrismaClient, 'auditLog'>
): AsyncIterable<Prisma.AuditLogGetPayload<null>[]> {
  return {
    [Symbol.asyncIterator]() {
      let offset = 0
      let cursor: number | undefined

      return {
        async next() {
          if (offset >= ids.length) {
            return { done: true, value: undefined }
          }

          const entries = await prisma.auditLog.findMany({
            where: {
              class_name: className,
              persisted_object_id: {
                in: ids.slice(offset, offset + BATCH_SIZE),
              },
              event_name: { notIn: ['create', 'delete'] },
            },
            orderBy: [{ last_updated: 'desc' }, { id: 'desc' }],
            take: BATCH_SIZE,
            cursor: cursor === undefined ? undefined : { id: cursor },
            skip: cursor === undefined ? 0 : 1,
          })

          cursor = entries.length === BATCH_SIZE ? entries.at(-1)?.id : undefined

          if (cursor === undefined) {
            offset += BATCH_SIZE
          }

          return { done: false, value: entries }
        },
      }
    },
  }
}

export async function getVersionsByObjectIds(
  className: string,
  ids: number[],
  prisma: Pick<ExtendedPrismaClient, 'auditLog'>,
  fields: string[]
) {
  const versionsById = new Map<number, Version[]>()

  for await (const entries of getAuditLogBatches(className, ids, prisma)) {
    for (const entry of entries) {
      const version = auditlogEntryToVersion(entry)
      const changes = version.changed_values?.filter((change) => fields.includes(change.field_name))

      if (!changes?.length) continue

      const versions = versionsById.get(entry.persisted_object_id) ?? []
      versions.push({ ...version, changed_values: changes })
      versionsById.set(entry.persisted_object_id, versions)
    }
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
          modifiedDate: toLegacyUTCDateString(new Date(version.changed_at)),
          comment: version.comment || '',
        },
      ]
    })
  )
}
