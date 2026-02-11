import { Release } from '@/generated/prisma/client'
import { prisma } from '../lib/prisma'

export async function getAllReleases(): Promise<Release[]> {
  const releases = await prisma.release.findMany()

  return releases.map((release) => ({
    id: release.id,
    version: release.version,
    published_at: release.publish_time,
    has_versions: release.has_versions,
    updated_at: release.last_updated,
    comment: release.comment,
    desk_appoval_status: release.desk_appoval_status,
    variant_id: release.variant_id,
    period_to: release.period_to,
    period_from: release.period_from,
    cancelled: release.cancelled,
    created_at: release.date_created,
    release_date_precision: release.release_date_precision,
    import_flag: release.import_flag,
  }))
}
