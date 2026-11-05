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

const STATISTIC_CHANGE_NAMES: Record<string, string> = {
  statistikknavn: 'statistikknavn',
  name: 'statistikknavn',
  status: 'status',
}

export async function listReleasedStatistics(
  prisma: Pick<ExtendedPrismaClient, 'statistic' | 'auditLog' | 'division_DoNotUse'>
) {
  const divisionNames = await loadDivisionNames(prisma)
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
      division: { select: { code: true, name: true } },
      statistic_region_levels: {
        select: { region_level: { select: { name: true } } },
      },
      variants: {
        orderBy: { id: 'asc' },
        select: {
          revision: true,
          level_of_detail: true,
          frequency: { select: { name: true } },
          releases: { select: { publish_time: true }, orderBy: { publish_time: 'asc' }, take: 1 },
        },
      },
    },
    orderBy: { shortname: { name: 'asc' } },
  })

  const auditLogs = statistics.length
    ? await prisma.auditLog.findMany({
        where: {
          persisted_object_id: { in: statistics.map((statistic) => statistic.id) },
          OR: auditClass('Statistic', 'Statistikk'),
        },
        orderBy: { last_updated: 'desc' },
      })
    : []
  const changesByStatisticId = groupLegacyChanges(auditLogs)

  return {
    statistics: statistics.map((statistic) => {
      const firstCms = statistic.variants.reduce<Date | null>((earliest, variant) => {
        const publishTime = variant.releases[0]?.publish_time
        if (!publishTime) return earliest
        if (!earliest || publishTime < earliest) return publishTime
        return earliest
      }, null)
      const owner = legacyOwner(statistic.division, statistic.division_code, divisionNames)

      return {
        id: statistic.id,
        shortName: statistic.shortname.name,
        name: statistic.name,
        nameEN: statistic.name_en || null,
        dateCreated: formatLegacyInstant(statistic.date_created),
        lang: statistic.language,
        ownerCode: owner.ownerCode,
        owner: owner.owner,
        status: statistic.status,
        regionalLevels: joinLegacyList(statistic.statistic_region_levels.map(({ region_level }) => region_level.name)),
        variants: statistic.variants
          .map((variant) => legacyVariantLabel(variant.frequency.name, variant.revision, variant.level_of_detail))
          .join(';'),
        annualReporting: statistic.yearly_reporting,
        startYear: statistic.first_release ? statistic.first_release.toISOString().slice(0, 4) : '',
        firstReleaseStatistic: firstCms ? formatLegacyInstant(firstCms) : null,
        changes: changesByStatisticId.get(statistic.id) ?? [],
      }
    }),
  }
}

const REGION_ORDER = ['Land', 'Kommune', 'Fylke', 'Landsdel', 'Bydel og krets']

function joinLegacyList(names: string[]) {
  return [...new Set(names)].sort((a, b) => regionRank(a) - regionRank(b) || a.localeCompare(b, 'nb')).join(';')
}

function regionRank(name: string) {
  const index = REGION_ORDER.indexOf(name)
  return index === -1 ? REGION_ORDER.length : index
}

function legacyVariantLabel(frequency: string, revisionCode: string, detail: string | null) {
  if (detail?.trim()) return `${detail}, ${frequency.toLowerCase()}`
  const revision =
    revisionCode in RevisionNames ? RevisionNames[revisionCode as keyof typeof RevisionNames] : revisionCode
  if (!revision || revision === 'Ingen') return frequency
  return `${frequency}, ${revision.toLowerCase()}`
}

function groupLegacyChanges(entries: LegacyAuditLog[]) {
  const byObjectId = new Map<number, LegacyAuditLog[]>()
  for (const entry of entries) {
    const current = byObjectId.get(entry.persisted_object_id) ?? []
    current.push(entry)
    byObjectId.set(entry.persisted_object_id, current)
  }

  return new Map([...byObjectId].map(([id, objectEntries]) => [id, toStatisticChanges(toLegacyChanges(objectEntries))]))
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

function toLegacyChanges(entries: LegacyAuditLog[]): LegacyChange[] {
  const comments = entries
    .filter((entry) => entry.property_name === 'internKommentar' && entry.new_value)
    .map((entry) => ({ at: entry.last_updated.getTime(), text: entry.new_value as string }))

  return entries.flatMap((entry) => {
    if (entry.property_name === 'internKommentar') return []

    const version = auditlogEntryToVersion(entry)
    const comment = commentNear(comments, entry.last_updated.getTime()) || version.comment || ''

    return (version.changed_values ?? []).map((changed) => ({
      propertyName: changed.field_name,
      oldValue: changed.old_value,
      newValue: changed.new_value,
      modifiedDate: version.changed_at,
      comment,
    }))
  })
}

function toStatisticChanges(changes: LegacyChange[]) {
  return changes.flatMap((change) => {
    const propertyName = STATISTIC_CHANGE_NAMES[change.propertyName]
    if (!propertyName || !change.comment) return []
    return [
      {
        ...change,
        propertyName,
        modifiedDate: formatLegacyInstant(new Date(change.modifiedDate)),
        comment: change.comment,
      },
    ]
  })
}
