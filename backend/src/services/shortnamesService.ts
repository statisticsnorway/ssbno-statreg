import type { ExtendedPrismaClient } from '@/lib/prisma'
import { StatregError } from '@/lib/statregError'
import { sanitize } from '@/lib/utils'
import { type Shortname, type ShortnameListing } from '@ssbno-statreg/shared'

export type ShortnamePrisma = Pick<ExtendedPrismaClient, 'shortname' | 'statistic'>

export async function getShortnames(prisma: ShortnamePrisma): Promise<ShortnameListing[]> {
  const shortnames = await prisma.shortname.findMany({
    select: {
      name: true,
      statistic: { select: { name: true } },
    },
    where: { NOT: { statistic: null } },
  })

  const result = shortnames.map((item) => {
    return { shortname: item.name, statistic_name: item.statistic!.name }
  })

  return result
}

export async function getShortname(prisma: ShortnamePrisma, shortname: string): Promise<ShortnameListing> {
  const safeShortname = sanitize(shortname)

  const shortnameDetail = await prisma.shortname.findFirst({
    where: { name: safeShortname },
    select: {
      name: true,
      statistic: { select: { name: true } },
    },
  })

  if (!shortnameDetail) {
    throw new StatregError(`Shortname '${shortname}' not found.`, 404)
  }

  return { shortname: shortnameDetail.name, statistic_name: shortnameDetail.statistic?.name ?? '' }
}

export async function createShortname(prisma: ShortnamePrisma, body: unknown): Promise<Shortname> {
  if (!body || typeof body !== 'object' || !('shortname' in body)) {
    throw new StatregError("Missing required field 'shortname'.")
  }

  const shortname = parseShortname(body.shortname)

  const existing = await prisma.shortname.findUnique({
    where: { name: shortname },
    select: { id: true },
  })

  if (existing) {
    throw new StatregError(`Shortname '${shortname}' already exists`)
  }

  const now = new Date()
  const created = await prisma.shortname.create({
    data: {
      name: shortname,
      date_created: now,
      last_updated: now,
    },
  })

  return { id: created.id, shortname: created.name }
}

export function parseShortname(value: unknown): string {
  if (typeof value !== 'string') {
    throw new StatregError("Field 'shortname' must be a string.")
  }

  if (!/^[a-z_]{1,14}$/.test(value)) {
    throw new StatregError(
      "Field 'shortname' must only contain lowercase letters (a-z) and underscore (_), and be at most 14 characters."
    )
  }

  return value
}
