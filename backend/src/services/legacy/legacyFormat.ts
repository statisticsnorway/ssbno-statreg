import type { ExtendedPrismaClient } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { auditlogEntryToVersion } from '@/services/versionService'
import type { Version } from '@ssbno-statreg/shared'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

const BATCH_SIZE = 1000

export type LegacyChange = {
  propertyName: string
  oldValue: string
  newValue: string
  modifiedDate: string
  comment: string
}

export function deduplicateLegacyRequests<P extends object, A extends unknown[], T>(
  load: (prisma: P, ...args: A) => Promise<T>,
  getKey: (...args: A) => string
) {
  const requests = new WeakMap<P, Map<string, Promise<T>>>()

  return (prisma: P, ...args: A): Promise<T> => {
    const key = getKey(...args)
    const pending = requests.get(prisma) ?? new Map<string, Promise<T>>()

    requests.set(prisma, pending)

    const existing = pending.get(key)
    if (existing) return existing

    const request = load(prisma, ...args).finally(() => {
      pending.delete(key)
    })

    pending.set(key, request)

    return request
  }
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
      let cursor: number | undefined
      let finished = ids.length === 0

      return {
        async next() {
          if (finished) {
            return { done: true, value: undefined }
          }

          const entries = await prisma.auditLog.findMany({
            where: {
              class_name: className,
              event_name: { notIn: ['create', 'delete'] },
              persisted_object_id: ids.length <= 5000 ? { in: ids } : undefined,
              id: cursor === undefined ? undefined : { lt: cursor },
            },
            orderBy: { id: 'desc' },
            take: BATCH_SIZE,
          })

          finished = entries.length < BATCH_SIZE
          cursor = entries.at(-1)?.id

          return { done: false, value: entries }
        },
      }
    },
  }
}

function toReleaseVersion(entry: Prisma.AuditLogGetPayload<null>): Version {
  const version = auditlogEntryToVersion(entry)

  // Historical publication changes are stored as individual audit entries.
  if (
    entry.property_name === 'tidspunkt' &&
    entry.old_value !== null &&
    entry.new_value !== null
  ) {
    return {
      ...version,
      changed_values: [
        {
          field_name: 'publish_time',
          old_value: entry.old_value,
          new_value: entry.new_value,
        },
      ],
    }
  }

  return {
    ...version,
    changed_values: version.changed_values?.map((change) => ({
      ...change,
      field_name: change.field_name === 'tidspunkt' ? 'publish_time' : change.field_name,
    })),
  }
}

function attachReleaseComments(
  versionsById: Map<number, Version[]>,
  commentsByChange: Map<string, string>
) {
  for (const [objectId, versions] of versionsById) {
    for (const version of versions) {
      const key = `${objectId}:${version.changed_at}`
      version.comment = version.comment || commentsByChange.get(key) || ''
    }
  }
}

function collectAuditVersion(
  entry: Prisma.AuditLogGetPayload<null>,
  fields: string[],
  versionsById: Map<number, Version[]>,
  commentsByChange: Map<string, string>,
  isRelease: boolean
) {
  if (isRelease && entry.property_name === 'internKommentar') {
    const key = `${entry.persisted_object_id}:${entry.last_updated.toISOString()}`

    if (entry.new_value && !commentsByChange.has(key)) {
      commentsByChange.set(key, entry.new_value)
    }

    return
  }

  const version = isRelease
    ? toReleaseVersion(entry)
    : auditlogEntryToVersion(entry)

  const changes = version.changed_values?.filter(
    (change) => fields.includes(change.field_name)
  )

  if (!changes?.length) return

  const versions = versionsById.get(entry.persisted_object_id) ?? []
  versions.push({ ...version, changed_values: changes })
  versionsById.set(entry.persisted_object_id, versions)
}

export async function getVersionsByObjectIds(
  className: string,
  ids: number[],
  prisma: Pick<ExtendedPrismaClient, 'auditLog'>,
  fields: string[]
) {
  const versionsById = new Map<number, Version[]>()
  const commentsByChange = new Map<string, string>()
  const objectIds = new Set(ids)
  const isRelease = className === 'Release'

  for await (const entries of getAuditLogBatches(className, ids, prisma)) {
    for (const entry of entries) {
      if (!objectIds.has(entry.persisted_object_id)) continue

      collectAuditVersion(
        entry,
        fields,
        versionsById,
        commentsByChange,
        isRelease
      )
    }
  }

  if (isRelease) {
    attachReleaseComments(versionsById, commentsByChange)
  }

  for (const versions of versionsById.values()) {
    versions.sort((a, b) => b.changed_at.localeCompare(a.changed_at))
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
