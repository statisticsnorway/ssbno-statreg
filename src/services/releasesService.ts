import type { Release } from '@/types/index'
import { prisma } from '@/lib/prisma'

export async function getAllReleases({ start = 0, count = 10 }): Promise<Release[]> {
  const releases = await prisma.release.findMany({
    skip: start,
    take: count,
  })

  if (!releases?.length) return []

  return releases.map((release) => ({
    id: release.id.toString(),
    version: release.version.toString(),
    published_at: release.publish_time.toISOString(),
    has_versions: release.has_versions,
    updated_at: release.last_updated.toISOString(),
    comment: release.comment,
    desk_appoval_status: release.desk_appoval_status,
    variant_id: release.variant_id.toString(),
    period_to: release.period_to.toISOString(),
    period_from: release.period_from.toISOString(),
    cancelled: release.cancelled,
    created_at: release.date_created.toISOString(),
    release_date_precision: release.release_date_precision,
    import_flag: release.import_flag,
  }))
}
