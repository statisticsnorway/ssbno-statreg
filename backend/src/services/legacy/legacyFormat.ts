import type { ExtendedPrismaClient } from '@/lib/prisma'
import { fromZonedTime } from 'date-fns-tz'

const OSLO = 'Europe/Oslo'

// Imported timestamps are Oslo wall-clock times stored without a zone.
// The legacy endpoints published the corresponding UTC instant, without milliseconds.
export function formatLegacyInstant(date: Date): string {
  const wallClock = date.toISOString().slice(0, 19)
  return fromZonedTime(wallClock, OSLO)
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
}

export async function loadDivisionNames(prisma: Pick<ExtendedPrismaClient, 'division_DoNotUse'>) {
  const divisions = await prisma.division_DoNotUse.findMany({ select: { code: true, name: true } })
  return new Map(divisions.map((division) => [division.code, division.name]))
}

export function legacyOwner(
  division: { code: string; name: string } | null,
  divisionCode: string | null,
  namesByCode: Map<string, string>
) {
  const ownerCode = division?.code || divisionCode || ''
  const owner = division?.name || namesByCode.get(ownerCode) || ''
  return { ownerCode, owner }
}
