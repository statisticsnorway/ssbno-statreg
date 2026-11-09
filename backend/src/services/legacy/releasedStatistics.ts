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
} from '@/services/legacy/legacyFormat'

const STATISTIC_CHANGE_NAMES: Record<string, string> = {
  statistikknavn: 'statistikknavn',
  name: 'statistikknavn',
  status: 'status',
}

export async function listReleasedStatistics(
  prisma: Pick<ExtendedPrismaClient, 'statistic' | 'auditLog' | 'division_DoNotUse'>
) {
  const divisionNames = await getOwnerNamesByCode(prisma)
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
        select: { region_level: { select: { code: true } } },
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
          OR: whereClassNameEndsWith('Statistic', 'Statistikk'),
        },
        orderBy: { last_updated: 'desc' },
      })
    : []
  const changesByStatisticId = new Map(
    [...groupByObjectId(auditLogs)].map(([id, entries]) => [
      id,
      toChangeList(entries).flatMap((change) => {
        const propertyName = STATISTIC_CHANGE_NAMES[change.propertyName]
        if (!propertyName || !change.comment) return []
        return [{ ...change, propertyName }]
      }),
    ])
  )

  return {
    statistics: statistics.map((statistic) => {
      const firstCms = statistic.variants.reduce<Date | null>((earliest, variant) => {
        const publishTime = variant.releases[0]?.publish_time
        if (!publishTime) return earliest
        if (!earliest || publishTime < earliest) return publishTime
        return earliest
      }, null)
      const owner = getOwner(statistic.division, statistic.division_code, divisionNames)

      return {
        id: statistic.id,
        shortName: statistic.shortname.name,
        name: statistic.name,
        nameEN: statistic.name_en || null,
        dateCreated: toUtcDateString(statistic.date_created),
        lang: statistic.language,
        ownerCode: owner.ownerCode,
        owner: owner.owner,
        status: statistic.status,
        regionalLevels: LEGACY_REGIONS.filter((region) =>
          statistic.statistic_region_levels.some(({ region_level }) => region_level.code === region.code)
        )
          .map((region) => region.name)
          .join(';'),
        variants: statistic.variants
          .map((variant) => legacyVariantLabel(variant.frequency.name, variant.revision, variant.level_of_detail))
          .join(';'),
        annualReporting: statistic.yearly_reporting,
        startYear: statistic.first_release ? statistic.first_release.toISOString().slice(0, 4) : '',
        firstReleaseStatistic: firstCms ? toUtcDateString(firstCms) : null,
        changes: changesByStatisticId.get(statistic.id) ?? [],
      }
    }),
  }
}

const LEGACY_REGIONS = [
  { code: 'L', name: 'Land' },
  { code: 'K', name: 'Kommune' },
  { code: 'F', name: 'Fylke' },
  { code: 'LD', name: 'Landsdel' },
  { code: 'BD', name: 'Bydel og krets' },
]

function legacyVariantLabel(frequency: string, revisionCode: string, detail: string | null) {
  if (detail?.trim()) return `${detail}, ${frequency.toLowerCase()}`
  const revision = getRevisionName(revisionCode)
  return !revision || revision === 'Ingen' ? frequency : `${frequency}, ${revision.toLowerCase()}`
}
