import type { ExtendedPrismaClient } from '@/lib/prisma'
import { ApprovalStatus } from '@ssbno-statreg/shared'
import {
  getOwner,
  getOwnerNamesByCode,
  getRevisionName,
  groupByObjectId,
  toChangeList,
  toUtcDateString,
  whereClassNameEndsWith,
  type LegacyAuditLog,
} from '@/services/legacy/legacyFormat'

export async function listReleasedPublications(
  prisma: Pick<ExtendedPrismaClient, 'release' | 'auditLog' | 'division_DoNotUse'>
) {
  const divisionNames = await getOwnerNamesByCode(prisma)
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
          OR: whereClassNameEndsWith('Release', 'Publisering'),
        },
        orderBy: { last_updated: 'asc' },
      })
    : []
  const changesByReleaseId = new Map(
    [...groupByObjectId(auditLogs)].map(([id, entries]) => [id, toPublicationChanges(entries)])
  )

  return {
    releases: releases.map((release) => {
      const { statistic } = release.variant
      const owner = getOwner(statistic.division, statistic.division_code, divisionNames)
      const history = changesByReleaseId.get(release.id)

      return {
        id: release.id,
        frequency: release.variant.frequency.name,
        revision: getRevisionName(release.variant.revision),
        publishTime: toUtcDateString(release.publish_time),
        periodFrom: toUtcDateString(release.period_from),
        periodTo: toUtcDateString(release.period_to),
        dateCreated: toUtcDateString(release.date_created),
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

function toPublicationChanges(entries: LegacyAuditLog[]) {
  const erEndret = entries.reduce<LegacyAuditLog | undefined>(
    (latest, entry) => (entry.property_name === 'erEndret' ? entry : latest),
    undefined
  )
  const changes = [
    ...toChangeList(entries, 'tidspunkt'),
    ...toChangeList(
      entries.filter((entry) => entry.class_name.endsWith('Release')),
      'publish_time'
    ).map((change) => ({ ...change, propertyName: 'tidspunkt' })),
  ].sort((a, b) => a.modifiedDate.localeCompare(b.modifiedDate))

  return { erEndretDesk: erEndret?.new_value === 'true', changes }
}