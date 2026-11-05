import type { ExtendedPrismaClient } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { getDivisionFromCode } from '@/services/klassService'
import { auditlogEntryToVersion } from '@/services/versionService'
import { ApprovalStatus, RevisionNames } from '@ssbno-statreg/shared'

type LegacyAuditLog = Prisma.AuditLogGetPayload<null>

type LegacyChange = {
  propertyName: string
  oldValue: string
  newValue: string
  modifiedDate: string
  comment: string
}

export async function getApprovedStatisticsXml(prisma: Pick<ExtendedPrismaClient, 'statistic'>): Promise<string> {
  const statistics = await prisma.statistic.findMany({
    where: {
      status: 'A',
      desk_appoval_status: ApprovalStatus.ACCEPTED,
    },
    select: {
      id: true,
      shortname: { select: { name: true } },
    },
    orderBy: { shortname: { name: 'asc' } },
  })

  const rows = statistics.map(({ id, shortname }) => `<statistikk id="${id}" kortnavn="${shortname.name}"/>`)

  return `<statistikker antall="${statistics.length}" dato="${formatLegacyDate()}">
${rows.join('\n')}
</statistikker>`
}

export async function listReleasedStatistics(prisma: Pick<ExtendedPrismaClient, 'statistic' | 'auditLog'>) {
  const statistics = await prisma.statistic.findMany({
    where: { desk_appoval_status: ApprovalStatus.ACCEPTED },
    select: {
      id: true,
      name: true,
      name_en: true,
      language: true,
      status: true,
      division_code: true,
      yearly_reporting: true,
      first_release: true,
      date_created: true,
      shortname: { select: { name: true } },
      statistic_region_levels: { select: { region_level: { select: { name: true } } } },
      variants: {
        where: { cancelled: false },
        select: { frequency: { select: { name: true } } },
      },
    },
    orderBy: { shortname: { name: 'asc' } },
  })

  const auditLogs = statistics.length
    ? await prisma.auditLog.findMany({
        where: {
          class_name: 'Statistic',
          persisted_object_id: { in: statistics.map((statistic) => statistic.id) },
        },
        orderBy: { last_updated: 'desc' },
      })
    : []
  const changesByStatisticId = groupLegacyChanges(auditLogs)

  return {
    statistics: statistics.map((statistic) => {
      const firstRelease = statistic.first_release?.toISOString() ?? ''
      const divisionCode = statistic.division_code ?? ''

      return {
        id: statistic.id,
        shortName: statistic.shortname.name,
        name: statistic.name,
        nameEN: statistic.name_en ?? '',
        dateCreated: statistic.date_created.toISOString(),
        lang: statistic.language,
        ownerCode: divisionCode,
        owner: getDivisionFromCode(divisionCode)?.name ?? '',
        status: statistic.status,
        regionalLevels: joinSortedNames(statistic.statistic_region_levels.map(({ region_level }) => region_level.name)),
        variants: joinSortedNames(statistic.variants.map(({ frequency }) => frequency.name)),
        annualReporting: statistic.yearly_reporting,
        startYear: firstRelease.slice(0, 4),
        firstReleaseStatistic: firstRelease,
        changes: changesByStatisticId.get(statistic.id) ?? [],
      }
    }),
  }
}

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

  const auditLogs = releases.length
    ? await prisma.auditLog.findMany({
        where: {
          class_name: 'Release',
          persisted_object_id: { in: releases.map((release) => release.id) },
        },
        orderBy: { last_updated: 'desc' },
      })
    : []
  const changesByReleaseId = groupLegacyChanges(auditLogs, 'publish_time')

  return {
    releases: releases.map((release) => {
      const { statistic } = release.variant
      const divisionCode = statistic.division_code ?? ''

      return {
        id: release.id,
        frequency: release.variant.frequency.name,
        revision: revisionName(release.variant.revision),
        publishTime: release.publish_time.toISOString(),
        periodFrom: release.period_from.toISOString(),
        periodTo: release.period_to.toISOString(),
        dateCreated: release.date_created.toISOString(),
        erEndretDesk: false,
        shortName: statistic.shortname.name,
        statisticId: statistic.id,
        statisticName: statistic.name,
        ownerCode: divisionCode,
        owner: getDivisionFromCode(divisionCode)?.name ?? '',
        changes: (changesByReleaseId.get(release.id) ?? []).map((change) => ({
          ...change,
          propertyName: 'tidspunkt',
        })),
      }
    }),
  }
}

function revisionName(code: string) {
  if (code in RevisionNames) {
    return RevisionNames[code as keyof typeof RevisionNames]
  }
  return code
}

function joinSortedNames(names: string[]) {
  return [...new Set(names)].sort().join(', ')
}

function groupLegacyChanges(entries: LegacyAuditLog[], propertyName?: string) {
  const byObjectId = new Map<number, LegacyAuditLog[]>()
  for (const entry of entries) {
    const current = byObjectId.get(entry.persisted_object_id) ?? []
    current.push(entry)
    byObjectId.set(entry.persisted_object_id, current)
  }

  return new Map([...byObjectId].map(([id, objectEntries]) => [id, toLegacyChanges(objectEntries, propertyName)]))
}

function toLegacyChanges(entries: LegacyAuditLog[], propertyName?: string): LegacyChange[] {
  const commentByTimestamp: Record<string, string> = {}
  const filteredEntries = entries.filter((entry) => {
    if (entry.property_name === 'internKommentar' && entry.new_value) {
      commentByTimestamp[entry.last_updated.toISOString()] = entry.new_value
      return false
    }
    return true
  })

  return filteredEntries.flatMap((entry) => {
    const version = auditlogEntryToVersion(entry)
    const comment = commentByTimestamp[version.changed_at] || version.comment || ''
    const changedValues = (version.changed_values ?? []).filter(
      (changed) => !propertyName || changed.field_name === propertyName
    )

    return changedValues.map((changed) => ({
      propertyName: changed.field_name,
      oldValue: changed.old_value,
      newValue: changed.new_value,
      modifiedDate: version.changed_at,
      comment,
    }))
  })
}

function formatLegacyDate(): string {
  const date = new Date().toString().split(' ')
  const zone = date[5] === 'GMT+0200' ? 'CEST' : 'CET'

  return `${date[0]} ${date[1]} ${date[2]} ${date[4]} ${zone} ${date[3]}`
}
