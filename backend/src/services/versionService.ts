import { ExtendedPrismaClient as PrismaClient } from '@/lib/prisma'
import { StatregError } from '@/lib/statregError'
import { sanitize } from '@/lib/utils'
import type { Prisma } from '@/generated/prisma/client'
import type { Version } from '@ssbno-statreg/shared'

export type VersionPrisma = Pick<PrismaClient, 'auditLog' | 'statistic' | 'release'>

function diffObjects(
  oldObject: Record<string, unknown>,
  newObject: Record<string, unknown>
): Version['changed_values'] {
  const changes = []
  for (const key of Object.keys(oldObject)) {
    if (key === 'comment' || key === 'last_updated') {
      continue
    }

    const oldValue = oldObject[key]
    const newValue = newObject[key]

    if (oldValue !== newValue) {
      changes.push({
        field_name: key,
        old_value: JSON.stringify(oldValue),
        new_value: JSON.stringify(newValue),
      })
    }
  }

  return changes
}

function auditlogEntryToVersion(entry: Prisma.AuditLogGetPayload<null>): Version {
  let changedValues: Version['changed_values']
  let comment: string = ''

  if (entry.event_name === 'update') {
    // auditlog entries from old statreg:
    if (entry.property_name) {
      changedValues = [
        {
          field_name: String(entry.property_name),
          old_value: String(entry.old_value),
          new_value: String(entry.new_value),
        },
      ]
      // auditlog entries from new statreg:
    } else {
      const oldObject = entry.old_value ? JSON.parse(entry.old_value) : {}
      const newObject = entry.new_value ? JSON.parse(entry.new_value) : {}
      changedValues = diffObjects(oldObject, newObject)
      comment = newObject.comment
    }
  }

  return {
    change_type: entry.event_name,
    changed_at: entry.last_updated.toISOString(),
    changed_by: entry.actor,
    changed_values: changedValues,
    comment: comment,
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

  if (!statistic) throw new StatregError(`Shortname '${safeShortname}' not found`, 404)

  return getVersions('Statistic', statistic.id, prisma)
}

export async function getReleaseVersions(releaseId: number, prisma: VersionPrisma): Promise<Version[]> {
  const release = await prisma.release.findFirst({
    where: { id: releaseId },
    select: { id: true },
  })

  if (!release) throw new StatregError(`Release '${releaseId}' not found`, 404)

  return getVersions('Release', releaseId, prisma)
}
