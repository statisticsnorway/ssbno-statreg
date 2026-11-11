import type { ExtendedPrismaClient } from '@/lib/prisma'
import { getDivisionFromCode } from '@/services/klassService'
import { ApprovalStatus, RevisionNames } from '@ssbno-statreg/shared'
import { getVersionsByObjectIds, toChangeList, toLegacyOsloDateString } from '@/services/legacy/legacyFormat'

export async function listReleasedPublications(prisma: Pick<ExtendedPrismaClient, 'release' | 'auditLog'>) {
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
              shortname: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { id: 'asc' },
  })

  const versionsById = await getVersionsByObjectIds(
    'Release',
    releases.map((release) => release.id),
    prisma
  )

  return {
    releases: releases.map((release) => {
      const { statistic } = release.variant
      const ownerCode = statistic.division_code || ''

      return {
        id: release.id,
        frequency: release.variant.frequency.name,
        revision: RevisionNames[release.variant.revision as keyof typeof RevisionNames] ?? release.variant.revision,
        publishTime: toLegacyOsloDateString(release.publish_time),
        periodFrom: toLegacyOsloDateString(release.period_from),
        periodTo: toLegacyOsloDateString(release.period_to),
        dateCreated: toLegacyOsloDateString(release.date_created),
        erEndretDesk: false,
        shortName: statistic.shortname.name,
        statisticId: statistic.id,
        statisticName: statistic.name,
        ownerCode,
        owner: getDivisionFromCode(ownerCode)?.name || '',
        changes: toChangeList(versionsById.get(release.id) ?? [], { publish_time: 'tidspunkt' }),
      }
    }),
  }
}
