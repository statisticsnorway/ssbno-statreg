import type { ExtendedPrismaClient } from '@/lib/prisma'
import { getDivisionFromCode } from '@/services/klassService'
import { ApprovalStatus, RevisionNames } from '@ssbno-statreg/shared'
import { getVersionsByObjectIds, toChangeList, toLegacyUTCDateString } from '@/services/legacy/legacyFormat'

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

  const versionsById = await getVersionsByObjectIds(
    'Statistic',
    statistics.map((statistic) => statistic.id),
    prisma
  )

  return {
    statistics: statistics.map((statistic) => {
      const firstCms = statistic.variants.reduce<Date | null>((earliest, variant) => {
        const publishTime = variant.releases[0]?.publish_time
        if (!publishTime) return earliest
        if (!earliest || publishTime < earliest) return publishTime
        return earliest
      }, null)
      const ownerCode = statistic.division_code || ''

      return {
        id: statistic.id,
        shortName: statistic.shortname.name,
        name: statistic.name,
        nameEN: statistic.name_en || null,
        dateCreated: toLegacyUTCDateString(statistic.date_created),
        lang: statistic.language,
        ownerCode,
        owner: getDivisionFromCode(ownerCode)?.name || '',
        status: statistic.status,
        regionalLevels: statistic.statistic_region_levels.map(({ region_level }) => region_level.name).join(';'),
        variants: statistic.variants
          .map((variant) => legacyVariantLabel(variant.frequency.name, variant.revision, variant.level_of_detail))
          .join(';'),
        annualReporting: statistic.yearly_reporting,
        startYear: statistic.first_release ? statistic.first_release.toISOString().slice(0, 4) : '',
        firstReleaseStatistic: firstCms ? toLegacyUTCDateString(firstCms) : null,
        changes: toChangeList(versionsById.get(statistic.id) ?? [], {
          name: 'statistikknavn',
          status: 'status',
        }).filter((change) => change.comment),
      }
    }),
  }
}

function legacyVariantLabel(frequency: string, revisionCode: string, detail: string | null) {
  if (detail?.trim()) return `${detail}, ${frequency.toLowerCase()}`
  const revision = RevisionNames[revisionCode as keyof typeof RevisionNames] ?? revisionCode
  return !revision || revision === 'Ingen' ? frequency : `${frequency}, ${revision.toLowerCase()}`
}
