import type { ReleaseDetails, ReleaseListing } from '@/types/index'
import { getLocalizedName, dateToISOString, sanitize } from '@/lib/utils'
import { type PrismaClient } from '@/generated/prisma/client'

type ReleasePrisma = Pick<PrismaClient, 'release'>

export async function getAllReleases({ start = 0, count = 10 }, prisma: ReleasePrisma): Promise<ReleaseListing[]> {
  const releases = await prisma.release.findMany({
    skip: start,
    take: count,
    select: {
      id: true,
      version: true,
      publish_time: true,
      desk_appoval_status: true,
      period_to: true,
      period_from: true,
      variant: {
        select: {
          frequency: {
            select: {
              name: true,
              name_en: true,
            },
          },
          statistic: {
            select: {
              language: true,
              name: true,
              name_en: true,
              shortname: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return releases.map((release) => {
    const { statistic, frequency } = release.variant ?? {}
    const lang_en = 'en'

    return {
      id: release.id,
      publish_time: dateToISOString(release.publish_time),
      approval_status: release.desk_appoval_status,
      period_to: dateToISOString(release.period_to),
      period_from: dateToISOString(release.period_from),
      frequency: {
        name: [...getLocalizedName('nb', frequency.name), ...getLocalizedName(lang_en, frequency.name_en)],
      },
      statistic: {
        shortname: statistic.shortname.name,
        name: [
          ...getLocalizedName(statistic.language, statistic.name),
          ...getLocalizedName(lang_en, statistic.name_en),
        ],
      },
    }
  })
}

export async function getReleaseById(id: string, prisma: ReleasePrisma): Promise<ReleaseDetails> {
  const idAsNumber = Number.parseInt(sanitize(id))
  if (isNaN(idAsNumber)) {
    return Promise.reject({ status: 404, statregError: 'Invalid release id' })
  }

  const release = await prisma.release.findFirst({ where: { id: idAsNumber } })

  if (!release) return Promise.reject({ status: 404, statregError: 'Release id not found' })

  // TODO: Oppdatere typen i openApiSpek iht skissene
  return {
    id: release.id,
    publish_time: dateToISOString(release.publish_time),
    updated_at: dateToISOString(release.last_updated),
    has_versions: release.version > 1,
    comment: release.comment,
    approval_status: release.desk_appoval_status,
    variant_id: release.variant_id,
    period_from: dateToISOString(release.period_from),
    period_to: dateToISOString(release.period_to),
    created_at: dateToISOString(release.date_created),
    release_date_precision: release.release_date_precision,
    cancelled: release.cancelled,
  }
}
